import { motion, AnimatePresence } from "framer-motion";
import { SCENARIO_QUESTIONS } from "@/data/scenarioQuestions";
import { ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";

interface Props {
  scenarioIndex: number;
  setScenarioIndex: (fn: (i: number) => number) => void;
  scenarioAnswers: Record<number, number>;
  setScenarioAnswers: (fn: (prev: Record<number, number>) => Record<number, number>) => void;
}

const SCENARIO_COLORS = [
  "from-blue-500/10 to-indigo-500/10",
  "from-emerald-500/10 to-teal-500/10",
  "from-amber-500/10 to-orange-500/10",
  "from-purple-500/10 to-pink-500/10",
  "from-cyan-500/10 to-blue-500/10",
  "from-rose-500/10 to-red-500/10",
  "from-green-500/10 to-emerald-500/10",
  "from-violet-500/10 to-purple-500/10",
  "from-yellow-500/10 to-amber-500/10",
  "from-sky-500/10 to-cyan-500/10",
];

export default function ScenarioTab({ scenarioIndex, setScenarioIndex, scenarioAnswers, setScenarioAnswers }: Props) {
  const answeredCount = Object.keys(scenarioAnswers).length;
  const total = SCENARIO_QUESTIONS.length;
  const current = SCENARIO_QUESTIONS[scenarioIndex];
  const colorGradient = SCENARIO_COLORS[scenarioIndex % SCENARIO_COLORS.length];

  const handleSelect = (optionIndex: number) => {
    setScenarioAnswers(prev => ({ ...prev, [scenarioIndex]: optionIndex }));
    if (scenarioIndex < total - 1) {
      setTimeout(() => setScenarioIndex(i => i + 1), 600);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      {/* Progress dots */}
      <div className="mb-6 flex items-center justify-center gap-1.5">
        {SCENARIO_QUESTIONS.map((_, i) => (
          <button
            key={i}
            onClick={() => setScenarioIndex(() => i)}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === scenarioIndex
                ? "w-8 bg-primary"
                : scenarioAnswers[i] !== undefined
                  ? "w-2 bg-success"
                  : "w-2 bg-muted"
            }`}
          />
        ))}
      </div>

      {/* Answered counter */}
      <div className="mb-4 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          <CheckCircle2 className="inline h-3.5 w-3.5 text-success mr-1" />
          {answeredCount}/{total} answered
        </span>
        <span className="text-muted-foreground">
          {answeredCount === total ? "🎉 All done!" : `${total - answeredCount} remaining`}
        </span>
      </div>

      {/* Scenario Card */}
      <AnimatePresence mode="wait">
        {current && (
          <motion.div
            key={scenarioIndex}
            initial={{ opacity: 0, x: 60, rotateY: 5 }}
            animate={{ opacity: 1, x: 0, rotateY: 0 }}
            exit={{ opacity: 0, x: -60, rotateY: -5 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`rounded-2xl border border-border bg-gradient-to-br ${colorGradient} p-6 shadow-lg`}
          >
            {/* Icon + Question number */}
            <div className="flex items-start justify-between mb-4">
              <motion.div
                initial={{ scale: 0.5, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.1 }}
                className="flex h-14 w-14 items-center justify-center rounded-2xl bg-card/80 text-3xl shadow-sm"
              >
                {current.icon}
              </motion.div>
              <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-bold text-primary">
                {scenarioIndex + 1} / {total}
              </span>
            </div>

            <motion.h3
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-lg font-bold text-foreground leading-snug mb-6"
            >
              {current.question}
            </motion.h3>

            {/* Options */}
            <div className="space-y-3">
              {current.options.map((opt, oi) => {
                const isSelected = scenarioAnswers[scenarioIndex] === oi;
                return (
                  <motion.button
                    key={oi}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + oi * 0.07 }}
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelect(oi)}
                    className={`w-full flex items-center gap-3 rounded-xl border p-4 text-left text-sm transition-all duration-200 ${
                      isSelected
                        ? "border-primary bg-primary/10 text-primary font-medium shadow-sm shadow-primary/10"
                        : "border-border/60 bg-card/50 text-foreground hover:border-primary/30 hover:bg-card/80"
                    }`}
                  >
                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all duration-200 ${
                      isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}>
                      {isSelected ? "✓" : String.fromCharCode(65 + oi)}
                    </span>
                    <span className="flex-1">{opt.label}</span>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="text-primary"
                      >
                        <CheckCircle2 className="h-5 w-5" />
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Navigation */}
            <div className="mt-6 flex justify-between">
              <button
                onClick={() => scenarioIndex > 0 && setScenarioIndex(i => i - 1)}
                disabled={scenarioIndex === 0}
                className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-30 transition-all duration-200"
              >
                <ChevronLeft className="h-4 w-4" /> Back
              </button>
              {scenarioAnswers[scenarioIndex] !== undefined && scenarioIndex < total - 1 && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => setScenarioIndex(i => i + 1)}
                  className="flex items-center gap-1 rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20 transition-all duration-200"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keyboard hint */}
      <p className="mt-4 text-center text-[11px] text-muted-foreground">
        Press <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-mono">1-4</kbd> to select • <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-mono">→</kbd> next
      </p>
    </div>
  );
}
