import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Target, Sparkles, Radar, Compass } from "lucide-react";
import PageTransition from "@/components/PageTransition";
import { COMPASS_SCORE_WEIGHTS, COMPASS_SCORE_FALLBACK_WEIGHTS } from "@/data/compassScore";

const SIGNALS = [
  {
    icon: Target,
    name: "Interest Match",
    weight: COMPASS_SCORE_WEIGHTS.interest,
    color: "text-sky-500",
    barColor: "bg-sky-500",
    description:
      "A deterministic score computed from the interests, priorities, and scenario answers you picked in the quiz, weighted against a hand-built table mapping interests to careers. No AI involved — same formula, every time, fully auditable.",
  },
  {
    icon: Sparkles,
    name: "AI Reasoning",
    weight: COMPASS_SCORE_WEIGHTS.aiReasoning,
    color: "text-primary",
    barColor: "bg-primary",
    description:
      "Gemini re-ranks your rule-based shortlist and writes a plain-language reason for each match — catching context the keyword table can't, like how your scenario answers and free-text description fit together.",
  },
  {
    icon: Radar,
    name: "Description Match",
    weight: COMPASS_SCORE_WEIGHTS.semantic,
    color: "text-emerald-500",
    barColor: "bg-emerald-500",
    description:
      "Your own words and selected interests are compared to each career's description using vector embeddings — the same technique search engines use for semantic search — measuring similarity in meaning, not just matching keywords.",
  },
];

export default function CompassScoreMethodology() {
  return (
    <PageTransition>
      <div className="w-full max-w-3xl mx-auto px-6 py-12">
        <Link to="/results" className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-foreground mb-8">
          <ArrowLeft className="h-4 w-4" /> Back to your matches
        </Link>

        <div className="flex items-center gap-3 mb-3">
          <span className="icon-box icon-box-primary h-11 w-11">
            <Compass className="h-5 w-5" />
          </span>
          <h1 className="font-display text-3xl font-bold text-foreground">The Compass Fit Score</h1>
        </div>
        <p className="text-text-secondary max-w-xl leading-relaxed">
          Every match you see on Career Compass carries a Fit Score built from three independent signals,
          computed three different ways, blended with fixed weights — published here, not hidden in a
          black box. Same methodology for every student, every career.
        </p>

        <div className="mt-10 space-y-5">
          {SIGNALS.map((signal, i) => {
            const Icon = signal.icon;
            return (
              <motion.div
                key={signal.name}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="glass-card"
              >
                <div className="flex items-start gap-4">
                  <span className={`icon-box h-10 w-10 shrink-0 bg-muted ${signal.color}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-3 flex-wrap">
                      <h2 className="font-display text-lg font-semibold text-foreground">{signal.name}</h2>
                      <span className={`text-sm font-bold ${signal.color}`}>{Math.round(signal.weight * 100)}% weight</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-border mt-2 mb-3">
                      <div className={`h-1.5 rounded-full ${signal.barColor}`} style={{ width: `${signal.weight * 100}%` }} />
                    </div>
                    <p className="text-sm text-text-secondary leading-relaxed">{signal.description}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="glass-card mt-6 bg-muted/30">
          <p className="text-sm font-semibold text-foreground mb-1">The formula</p>
          <p className="text-sm text-text-secondary font-mono">
            score = interest × {COMPASS_SCORE_WEIGHTS.interest} + aiReasoning × {COMPASS_SCORE_WEIGHTS.aiReasoning} + descriptionMatch × {COMPASS_SCORE_WEIGHTS.semantic}
          </p>
          <p className="text-xs text-text-secondary mt-3">
            If the description-match signal isn't available for a given request (rare — only if the embedding
            call fails), the score falls back to interest × {COMPASS_SCORE_FALLBACK_WEIGHTS.interest} + aiReasoning ×{" "}
            {COMPASS_SCORE_FALLBACK_WEIGHTS.aiReasoning} so you never see a broken or missing score.
          </p>
        </div>

        <div className="mt-8 rounded-lg border border-border p-4">
          <p className="text-xs text-text-secondary leading-relaxed">
            <strong className="text-foreground">Why this matters:</strong> most "AI-powered" recommendations are
            a single opaque number from a single model call. We publish ours because a career decision deserves
            more than "trust the algorithm" — you can see exactly which signal moved your score, and why.
          </p>
        </div>
      </div>
    </PageTransition>
  );
}
