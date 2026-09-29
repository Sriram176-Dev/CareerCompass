import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ArrowRight, RotateCcw, Sparkles } from "lucide-react";
import { aiApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import PageTransition from "@/components/PageTransition";
import toast from "react-hot-toast";

interface DecisionOption {
  id: string | number;
  text: string;
  consequence: string;
  alignsWithCareer: boolean;
}

interface Decision {
  id: string | number;
  situation: string;
  options: DecisionOption[];
}

interface Simulation {
  scenario: string;
  decisions: Decision[];
  reflectionPrompt: string;
}

interface LocationState {
  career?: string;
}

type Phase = "loading" | "playing" | "consequence" | "reflection" | "error";

/**
 * The Decision Simulator replaces "which of these do you like?" with "what
 * would you actually do?" — a realistic branching day-in-the-life scenario
 * for a specific career. Fit signal comes from the choices a student makes
 * under a simulated version of the job's real trade-offs, not from
 * self-reported preferences. This is a reflective tool, not a verdict —
 * framed that way throughout.
 */
export default function DecisionSimulator() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, updateProfile } = useAuth();
  const career = (location.state as LocationState)?.career || profile?.selected_career;

  const [phase, setPhase] = useState<Phase>("loading");
  const [sim, setSim] = useState<Simulation | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [chosen, setChosen] = useState<DecisionOption[]>([]);
  const [activeConsequence, setActiveConsequence] = useState<string>("");

  useEffect(() => {
    if (!career) return;
    let cancelled = false;
    (async () => {
      setPhase("loading");
      try {
        const result = await aiApi.careerTools("decision-simulator", {
          career: typeof career === 'string' ? career : career.title,
          workStyle: typeof career === 'string' ? undefined : career.workStyle,
          environment: typeof career === 'string' ? undefined : career.environment,
          skills: typeof career === 'string' ? undefined : career.skills,
        });
        if (!cancelled) { setSim(result); setPhase("playing"); }
      } catch {
        if (!cancelled) setPhase("error");
      }
    })();
    return () => { cancelled = true; };
  }, [career]);

  if (!career) {
    return (
      <PageTransition>
        <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
          <p className="text-foreground font-semibold">Pick a career first</p>
          <p className="text-sm text-text-secondary mt-1">Run the assessment so we know which career to simulate.</p>
          <button onClick={() => navigate("/quiz")} className="btn-primary mt-4">Start the quiz →</button>
        </div>
      </PageTransition>
    );
  }

  const selectOption = (option: DecisionOption) => {
    setChosen((prev) => [...prev, option]);
    setActiveConsequence(option.consequence);
    setPhase("consequence");
  };

  const continueToNext = () => {
    if (!sim) return;
    if (stepIndex + 1 >= sim.decisions.length) {
      setPhase("reflection");
      const alignedCount = chosen.filter((c) => c.alignsWithCareer).length;
      const alignmentPct = chosen.length ? Math.round((alignedCount / chosen.length) * 100) : 0;
      const result = {
        careerId: career.id,
        careerTitle: career.title,
        alignmentPct,
        decisionsCount: chosen.length,
        timestamp: new Date().toISOString(),
      };
      const updated = [...((profile?.simulator_results as Array<Record<string, unknown>>) || []), result].slice(-30);
      updateProfile({ simulator_results: updated }).catch(() => null);
    } else {
      setStepIndex((i) => i + 1);
      setPhase("playing");
    }
  };

  const restart = () => {
    setStepIndex(0); setChosen([]); setSim(null); setPhase("loading");
    // re-trigger fetch
    (async () => {
      try {
        const result = await aiApi.careerTools("decision-simulator", {
          career: career.title, workStyle: career.workStyle, environment: career.environment, skills: career.skills,
        });
        setSim(result); setPhase("playing");
      } catch { setPhase("error"); }
    })();
  };

  const alignedCount = chosen.filter((c) => c.alignsWithCareer).length;
  const alignmentPct = chosen.length ? Math.round((alignedCount / chosen.length) * 100) : 0;

  return (
    <PageTransition>
      <div className="w-full max-w-2xl mx-auto px-6 py-10">
        <div className="mb-6">
          <p className="bearing-accent text-xs font-semibold uppercase tracking-wide text-primary">Decision Simulator</p>
          <h1 className="font-display text-2xl font-bold text-foreground mt-2">A day as a {career.title}</h1>
          <p className="text-sm text-text-secondary mt-1">
            No right answers here — just make the call you'd actually make, and see how it plays out.
          </p>
        </div>

        {phase === "loading" && (
          <div className="glass-card flex flex-col items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary mb-3" />
            <p className="text-sm text-text-secondary">Setting the scene…</p>
          </div>
        )}

        {phase === "error" && (
          <div className="glass-card text-center py-12">
            <p className="text-foreground font-medium">Couldn't build the simulation right now.</p>
            <button onClick={restart} className="btn-primary mt-4">Try again</button>
          </div>
        )}

        {sim && phase !== "loading" && phase !== "error" && phase !== "reflection" && (
          <AnimatePresence mode="wait">
            {phase === "playing" && (
              <motion.div key={`q-${stepIndex}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="glass-card">
                <p className="text-xs text-text-secondary mb-2">Moment {stepIndex + 1} of {sim.decisions.length}</p>
                {stepIndex === 0 && <p className="text-sm text-text-secondary mb-4 italic">{sim.scenario}</p>}
                <p className="text-foreground font-medium mb-5">{sim.decisions[stepIndex].situation}</p>
                <div className="space-y-2.5">
                  {sim.decisions[stepIndex].options.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => selectOption(opt)}
                      className="w-full text-left rounded-md border border-border hover:border-border-hover px-4 py-3 text-sm text-foreground transition-colors card-hover"
                    >
                      {opt.text}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {phase === "consequence" && (
              <motion.div key={`c-${stepIndex}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card">
                <p className="text-sm text-foreground leading-relaxed">{activeConsequence}</p>
                <button onClick={continueToNext} className="btn-primary mt-5 flex items-center gap-2 text-sm">
                  Continue <ArrowRight className="h-4 w-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {phase === "reflection" && sim && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card glass-card--featured text-center py-10">
            <Sparkles className="h-6 w-6 text-primary mx-auto mb-3" />
            <p className="text-3xl font-display font-bold text-foreground">{alignmentPct}%</p>
            <p className="text-sm text-text-secondary mt-1">
              of your choices matched how {career.title}s typically approach these moments
            </p>
            {sim.reflectionPrompt && (
              <p className="text-sm text-foreground mt-5 max-w-md mx-auto leading-relaxed">{sim.reflectionPrompt}</p>
            )}
            <p className="text-xs text-text-secondary mt-4 max-w-md mx-auto">
              This reflects one simulated day, not a verdict — a low score just means this role's day-to-day
              trade-offs might not match your instincts, which is useful to know either way.
            </p>
            <div className="flex justify-center gap-3 mt-6">
              <button onClick={restart} className="btn-outline text-sm flex items-center gap-2">
                <RotateCcw className="h-4 w-4" /> Try again
              </button>
              <button onClick={() => navigate("/results")} className="btn-primary text-sm">
                Back to matches
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </PageTransition>
  );
}
