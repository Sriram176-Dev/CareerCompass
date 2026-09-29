import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, Sparkles, Loader2 } from "lucide-react";
import { aiApi } from "@/lib/api";
import toast from "react-hot-toast";

interface SupportTask {
  title: string;
  xp?: number;
  category?: string;
}

interface RoadmapPulseProps {
  career: string | { title?: string };
  roadmap: { milestones?: Array<{ tasks?: Array<{ id: string }> }> };
  roadmapGeneratedAt: string | null | undefined;
  doneTasks: number;
  totalTasks: number;
  completedTaskIds: string[];
  quizAttempts: Array<{ category: string; score: number; total: number }>;
  onAcceptSupportTasks: (tasks: SupportTask[]) => void;
}

/**
 * Turns the roadmap from a static plan into one that reacts to real
 * behavior. Pace is estimated from elapsed time vs. tasks actually
 * completed (using the roadmap's own milestone durations when available,
 * falling back to a 6-month default). Weak spots come from real quiz
 * history, not a guess. When the student is genuinely behind, one AI call
 * proposes small, specific catch-up tasks — nothing here is decorative.
 */
export default function RoadmapPulse({
  career, roadmap, roadmapGeneratedAt, doneTasks, totalTasks, completedTaskIds, quizAttempts, onAcceptSupportTasks,
}: RoadmapPulseProps) {
  const [rebalancing, setRebalancing] = useState(false);
  const [suggestion, setSuggestion] = useState<{ message: string; supportTasks: SupportTask[] } | null>(null);

  const pulse = useMemo(() => {
    if (!roadmapGeneratedAt || totalTasks === 0) return null;

    // Estimate total expected duration from milestone.duration strings
    // ("2 months", "3-4 weeks") when present; otherwise assume 6 months.
    let estimatedMonths = 0;
    (roadmap?.milestones || []).forEach((m: { duration?: string }) => {
      const match = String(m.duration || "").match(/(\d+)(?:-(\d+))?\s*(week|month)/i);
      if (match) {
        const low = Number(match[1]);
        const high = match[2] ? Number(match[2]) : low;
        const avg = (low + high) / 2;
        estimatedMonths += /week/i.test(match[3]) ? avg / 4.345 : avg;
      }
    });
    if (estimatedMonths <= 0) estimatedMonths = 6;

    const totalDays = estimatedMonths * 30;
    const elapsedDays = Math.max(0, (Date.now() - new Date(roadmapGeneratedAt).getTime()) / 86400000);
    const expectedPct = Math.min(100, Math.round((elapsedDays / totalDays) * 100));
    const actualPct = Math.round((doneTasks / totalTasks) * 100);
    const delta = actualPct - expectedPct;

    const status: "ahead" | "on-track" | "behind" = delta >= 8 ? "ahead" : delta <= -12 ? "behind" : "on-track";

    const recent = (quizAttempts || []).slice(-8);
    const byCategory: Record<string, { correct: number; total: number }> = {};
    recent.forEach((a) => {
      const c = byCategory[a.category] || { correct: 0, total: 0 };
      c.correct += a.score; c.total += a.total;
      byCategory[a.category] = c;
    });
    const weakCategories = Object.entries(byCategory)
      .filter(([, s]) => s.total > 0 && s.correct / s.total < 0.6)
      .map(([cat]) => cat);
    const recentQuizAverage = recent.length
      ? recent.reduce((s, a) => s + a.score / a.total, 0) / recent.length
      : null;

    return { expectedPct, actualPct, status, weakCategories, recentQuizAverage };
  }, [roadmap, roadmapGeneratedAt, doneTasks, totalTasks, quizAttempts]);

  if (!pulse) return null;

  const needsRebalance = pulse.status === "behind" || pulse.weakCategories.length > 0;

  const requestRebalance = async () => {
    setRebalancing(true);
    try {
      const currentMilestone = (roadmap?.milestones || []).find((m: { tasks?: Array<{ id: string }> }) =>
        (m.tasks || []).some((t) => !completedTaskIds.includes(t.id))
      );
      const result = await aiApi.careerTools("roadmap-rebalance", {
        career: typeof career === 'string' ? career : career?.title,
        currentMilestone: currentMilestone?.title,
        completedRatio: totalTasks ? doneTasks / totalTasks : 0,
        recentQuizAverage: pulse.recentQuizAverage,
        weakCategories: pulse.weakCategories,
      });
      setSuggestion(result);
    } catch {
      toast.error("Couldn't rebalance right now — try again in a bit.");
    } finally {
      setRebalancing(false);
    }
  };

  const statusConfig = {
    ahead: { icon: TrendingUp, color: "text-success", label: "Ahead of pace", bg: "bg-success/10" },
    "on-track": { icon: Minus, color: "text-primary", label: "On track", bg: "bg-primary/10" },
    behind: { icon: TrendingDown, color: "text-warning", label: "Falling behind pace", bg: "bg-warning/10" },
  }[pulse.status];
  const StatusIcon = statusConfig.icon;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`icon-box h-9 w-9 ${statusConfig.bg}`}>
            <StatusIcon className={`h-4 w-4 ${statusConfig.color}`} />
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">Roadmap pulse: {statusConfig.label}</p>
            <p className="text-xs text-text-secondary">
              {pulse.actualPct}% done vs. {pulse.expectedPct}% expected by now
              {pulse.weakCategories.length > 0 && ` • struggling with ${pulse.weakCategories.join(", ")}`}
            </p>
          </div>
        </div>
        {needsRebalance && !suggestion && (
          <button onClick={requestRebalance} disabled={rebalancing} className="btn-outline text-xs px-3 py-1.5 shrink-0 disabled:opacity-50">
            {rebalancing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <span className="flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5" /> Rebalance</span>}
          </button>
        )}
      </div>

      {suggestion && (
        <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-3">
          <p className="text-sm text-foreground">{suggestion.message}</p>
          <div className="mt-3 space-y-2">
            {suggestion.supportTasks.map((t: SupportTask) => (
              <div key={t.id} className="flex items-center justify-between rounded-md bg-card border border-border px-3 py-2 text-xs">
                <div>
                  <p className="font-medium text-foreground">{t.title}</p>
                  {t.description && <p className="text-text-secondary mt-0.5">{t.description}</p>}
                </div>
                <span className="text-primary font-semibold shrink-0 ml-3">+{t.xp} XP</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => { onAcceptSupportTasks(suggestion.supportTasks); setSuggestion(null); }}
              className="btn-primary text-xs px-3 py-1.5"
            >
              Add to my roadmap
            </button>
            <button onClick={() => setSuggestion(null)} className="btn-outline text-xs px-3 py-1.5">
              Dismiss
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
