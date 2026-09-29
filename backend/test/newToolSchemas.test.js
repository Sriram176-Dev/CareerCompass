import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { decisionSimulatorSchema, roadmapRebalanceSchema } from "../src/modules/ai/schemas.js";

describe("decisionSimulatorSchema", () => {
  const validPayload = {
    scenario: "Your first week as a Software Engineer",
    decisions: [
      {
        id: 1,
        situation: "A teammate pushes broken code before a demo.",
        options: [
          { id: "a", text: "Fix it silently", consequence: "Nobody learns anything.", alignsWithCareer: false },
          { id: "b", text: "Flag it and pair on a fix", consequence: "You fix it together.", alignsWithCareer: true },
        ],
      },
      {
        id: 2,
        situation: "You're stuck on a bug for hours.",
        options: [
          { id: "a", text: "Keep grinding alone", consequence: "You eventually fix it, exhausted.", alignsWithCareer: false },
          { id: "b", text: "Ask a senior for help", consequence: "You fix it in 15 minutes.", alignsWithCareer: true },
        ],
      },
      {
        id: 3,
        situation: "Product wants to skip tests to ship faster.",
        options: [
          { id: "a", text: "Push back", consequence: "Ship delayed a day, no regressions.", alignsWithCareer: true },
          { id: "b", text: "Skip tests", consequence: "A bug reaches production next week.", alignsWithCareer: false },
        ],
      },
    ],
    reflectionPrompt: "Engineers who thrive tend to ask for help early.",
  };

  it("accepts a well-formed 3-decision simulation", () => {
    const result = decisionSimulatorSchema.safeParse(validPayload);
    assert.equal(result.success, true);
  });

  it("rejects fewer than 3 decisions", () => {
    const result = decisionSimulatorSchema.safeParse({ ...validPayload, decisions: validPayload.decisions.slice(0, 2) });
    assert.equal(result.success, false);
  });

  it("rejects more than 5 decisions", () => {
    const sixDecisions = Array.from({ length: 6 }, (_, i) => validPayload.decisions[0]);
    const result = decisionSimulatorSchema.safeParse({ ...validPayload, decisions: sixDecisions });
    assert.equal(result.success, false);
  });

  it("rejects a decision with fewer than 2 options", () => {
    const broken = { ...validPayload, decisions: [{ ...validPayload.decisions[0], options: [validPayload.decisions[0].options[0]] }, validPayload.decisions[1], validPayload.decisions[2]] };
    const result = decisionSimulatorSchema.safeParse(broken);
    assert.equal(result.success, false);
  });

  it("rejects an option missing alignsWithCareer", () => {
    const broken = JSON.parse(JSON.stringify(validPayload));
    delete broken.decisions[0].options[0].alignsWithCareer;
    const result = decisionSimulatorSchema.safeParse(broken);
    assert.equal(result.success, false);
  });

  it("defaults reflectionPrompt to an empty string when omitted", () => {
    const { reflectionPrompt, ...withoutReflection } = validPayload;
    const result = decisionSimulatorSchema.safeParse(withoutReflection);
    assert.equal(result.success, true);
    assert.equal(result.data.reflectionPrompt, "");
  });
});

describe("roadmapRebalanceSchema", () => {
  const validPayload = {
    message: "You're behind on DSA and your Aptitude quiz scores dipped this week.",
    supportTasks: [
      { id: 1, title: "Redo 5 array problems", description: "Focus on sliding window", xp: 20, category: "catch-up" },
    ],
  };

  it("accepts a well-formed rebalance response", () => {
    const result = roadmapRebalanceSchema.safeParse(validPayload);
    assert.equal(result.success, true);
  });

  it("rejects an empty supportTasks array", () => {
    const result = roadmapRebalanceSchema.safeParse({ ...validPayload, supportTasks: [] });
    assert.equal(result.success, false);
  });

  it("rejects more than 4 support tasks", () => {
    const fiveTasks = Array.from({ length: 5 }, (_, i) => ({ ...validPayload.supportTasks[0], id: i }));
    const result = roadmapRebalanceSchema.safeParse({ ...validPayload, supportTasks: fiveTasks });
    assert.equal(result.success, false);
  });

  it("defaults xp to 15 and category to 'catch-up' when omitted", () => {
    const minimal = { message: "Behind on pace.", supportTasks: [{ id: 1, title: "Quick review" }] };
    const result = roadmapRebalanceSchema.safeParse(minimal);
    assert.equal(result.success, true);
    assert.equal(result.data.supportTasks[0].xp, 15);
    assert.equal(result.data.supportTasks[0].category, "catch-up");
  });

  it("rejects a missing message", () => {
    const { message, ...withoutMessage } = validPayload;
    const result = roadmapRebalanceSchema.safeParse(withoutMessage);
    assert.equal(result.success, false);
  });
});
