import { describe, it, expect } from "vitest";
import { computeCompassFitScore, COMPASS_SCORE_WEIGHTS, COMPASS_SCORE_FALLBACK_WEIGHTS } from "./compassScore";

describe("computeCompassFitScore", () => {
  it("blends all three signals using the published weights when semantic score is present", () => {
    const score = computeCompassFitScore({ ruleScore: 80, aiScore: 90, semanticScore: 70 });
    const expected = Math.round(
      90 * COMPASS_SCORE_WEIGHTS.aiReasoning + 80 * COMPASS_SCORE_WEIGHTS.interest + 70 * COMPASS_SCORE_WEIGHTS.semantic
    );
    expect(score).toBe(expected);
  });

  it("falls back to the 2-signal weights when semanticScore is null", () => {
    const score = computeCompassFitScore({ ruleScore: 80, aiScore: 90, semanticScore: null });
    const expected = Math.round(90 * COMPASS_SCORE_FALLBACK_WEIGHTS.aiReasoning + 80 * COMPASS_SCORE_FALLBACK_WEIGHTS.interest);
    expect(score).toBe(expected);
  });

  it("falls back to the 2-signal weights when semanticScore is omitted entirely", () => {
    const score = computeCompassFitScore({ ruleScore: 50, aiScore: 60 });
    const expected = Math.round(60 * COMPASS_SCORE_FALLBACK_WEIGHTS.aiReasoning + 50 * COMPASS_SCORE_FALLBACK_WEIGHTS.interest);
    expect(score).toBe(expected);
  });

  it("clamps the result to a maximum of 98", () => {
    const score = computeCompassFitScore({ ruleScore: 100, aiScore: 100, semanticScore: 100 });
    expect(score).toBe(98);
  });

  it("clamps the result to a minimum of 3", () => {
    const score = computeCompassFitScore({ ruleScore: 0, aiScore: 0, semanticScore: 0 });
    expect(score).toBe(3);
  });

  it("the three published weights sum to 1", () => {
    const sum = COMPASS_SCORE_WEIGHTS.interest + COMPASS_SCORE_WEIGHTS.aiReasoning + COMPASS_SCORE_WEIGHTS.semantic;
    expect(sum).toBeCloseTo(1, 5);
  });

  it("the fallback weights sum to 1", () => {
    const sum = COMPASS_SCORE_FALLBACK_WEIGHTS.interest + COMPASS_SCORE_FALLBACK_WEIGHTS.aiReasoning;
    expect(sum).toBeCloseTo(1, 5);
  });
});
