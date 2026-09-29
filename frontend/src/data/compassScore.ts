/**
 * ─── The Compass Fit Score ──────────────────────────────────────────────
 * Career Compass doesn't hand you a single opaque "AI match %". Every score
 * you see is built from three independent, differently-computed signals,
 * blended with fixed, published weights — the same methodology for every
 * student, every career, every time. This file is the single source of
 * truth for those weights so the app, the docs, and the public
 * methodology page can never drift out of sync.
 *
 * The three signals:
 *   1. Interest Match (rule-based)   — deterministic keyword/priority
 *      scoring against your selected interests (see cardWeights.ts).
 *      Same formula for everyone, fully auditable, zero AI involved.
 *   2. AI Reasoning                   — Gemini re-ranks the rule-based
 *      shortlist and explains its reasoning in plain language.
 *   3. Description Match (semantic)   — cosine similarity between your own
 *      words/interests and each career's description, via embeddings.
 *      Captures nuance keyword-matching alone can't.
 */

export const COMPASS_SCORE_WEIGHTS = {
  interest: 0.35,
  aiReasoning: 0.45,
  semantic: 0.20,
} as const;

/** Used only when the semantic signal wasn't available for a given request (e.g. embeddings call failed). */
export const COMPASS_SCORE_FALLBACK_WEIGHTS = {
  interest: 0.35,
  aiReasoning: 0.65,
} as const;

export function computeCompassFitScore({
  ruleScore,
  aiScore,
  semanticScore,
}: {
  ruleScore: number;
  aiScore: number;
  semanticScore?: number | null;
}): number {
  const raw =
    semanticScore != null
      ? aiScore * COMPASS_SCORE_WEIGHTS.aiReasoning +
        ruleScore * COMPASS_SCORE_WEIGHTS.interest +
        semanticScore * COMPASS_SCORE_WEIGHTS.semantic
      : aiScore * COMPASS_SCORE_FALLBACK_WEIGHTS.aiReasoning +
        ruleScore * COMPASS_SCORE_FALLBACK_WEIGHTS.interest;

  return Math.min(98, Math.max(3, Math.round(raw)));
}
