import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { BarChart3, Zap, Trophy, Flame, CheckCircle2 } from "lucide-react";

export default function ProgressAnalytics() {
  const { profile } = useAuth();

  const xp = profile?.xp || 0;
  const level = profile?.level || 1;
  const completedTasks = (profile?.completed_tasks as string[] || []).length;
  const streak = (profile as { streak?: number })?.streak || 0;
  const hasCareer = !!(profile?.selected_career);
  const pomodoroSessions = (profile as { pomodoro_sessions?: number })?.pomodoro_sessions || 0;
  const focusMinutes = (profile as { total_focus_minutes?: number })?.total_focus_minutes || 0;
  const hasActivity = xp > 0 || completedTasks > 0 || pomodoroSessions > 0;

  const progressPercent = Math.min(100, Math.round((xp % 150) / 150 * 100));

  if (!hasActivity && !hasCareer) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">📊 Progress Analytics</h2>
        <div className="glass-card text-center py-10">
          <BarChart3 className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-sm font-medium text-foreground">No data yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Complete the career quiz, finish tasks, and earn XP to see your analytics here.
          </p>
        </div>
      </motion.div>
    );
  }

  const stats = [
    { icon: Zap, label: "Total XP", value: xp, color: "text-primary" },
    { icon: Trophy, label: "Level", value: level, color: "text-yellow-400" },
    { icon: Flame, label: "Streak", value: `${streak} day${streak !== 1 ? "s" : ""}`, color: "text-orange-400" },
    { icon: CheckCircle2, label: "Tasks Done", value: completedTasks, color: "text-emerald-400" },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-4">
      <h2 className="text-lg font-semibold text-foreground">📊 Progress Analytics</h2>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="glass-card text-center py-4">
            <Icon className={`h-5 w-5 mx-auto mb-1.5 ${color}`} />
            <p className="text-lg font-bold text-foreground">{value}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
          </div>
        ))}
      </div>

      {/* Level progress */}
      <div className="glass-card">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold text-foreground">Level {level} Progress</h4>
          <span className="text-xs text-muted-foreground">{xp % 150} / 150 XP to next level</span>
        </div>
        <div className="h-2.5 rounded-full bg-muted overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full rounded-full bg-primary"
          />
        </div>
      </div>

      {/* Focus stats if any */}
      {(pomodoroSessions > 0 || focusMinutes > 0) && (
        <div className="glass-card">
          <h4 className="text-sm font-semibold text-foreground mb-3">Focus Stats</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-2xl font-bold text-foreground">{pomodoroSessions}</p>
              <p className="text-xs text-muted-foreground">Pomodoro Sessions</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{focusMinutes} min</p>
              <p className="text-xs text-muted-foreground">Total Focus Time</p>
            </div>
          </div>
        </div>
      )}

      {/* Career status */}
      {!hasCareer && (
        <div className="glass-card text-center py-6">
          <p className="text-sm text-muted-foreground">🎯 Take the career quiz to unlock career readiness insights</p>
        </div>
      )}
    </motion.div>
  );
}
