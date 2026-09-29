import { describe, it } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { User } from "../src/models/User.js";

// These fields are the instrumentation layer for closing the loop on the
// Compass Fit Score — logging what actually happened (career picked,
// Decision Simulator alignment) so the fixed 45/35/20 blend can eventually
// be validated against real outcomes instead of staying a fixed guess.
// No live DB connection needed — .validateSync() runs Mongoose's schema
// validation in isolation.
describe("User model — outcome logging fields", () => {
  function buildValidBaseUser(overrides = {}) {
    return new User({
      email: "student@example.com",
      password: "hashed-password-placeholder",
      name: "Test Student",
      ...overrides,
    });
  }

  it("accepts a well-formed career_selection_events entry", () => {
    const user = buildValidBaseUser({
      career_selection_events: [
        {
          careerId: 42,
          careerTitle: "Software Engineer",
          compassFitScore: 87,
          ruleScore: 80,
          aiScore: 90,
          semanticScore: 75,
          rankPosition: 1,
        },
      ],
    });
    const err = user.validateSync();
    assert.equal(err, undefined);
    assert.equal(user.career_selection_events[0].careerTitle, "Software Engineer");
    assert.equal(user.career_selection_events[0].rankPosition, 1);
  });

  it("auto-fills a timestamp on career_selection_events when omitted", () => {
    const user = buildValidBaseUser({
      career_selection_events: [{ careerId: 1, careerTitle: "Doctor", compassFitScore: 70, rankPosition: 3 }],
    });
    assert.ok(user.career_selection_events[0].timestamp);
    assert.ok(!Number.isNaN(Date.parse(user.career_selection_events[0].timestamp)));
  });

  it("accepts a well-formed simulator_results entry", () => {
    const user = buildValidBaseUser({
      simulator_results: [
        { careerId: 42, careerTitle: "Software Engineer", alignmentPct: 66, decisionsCount: 3 },
      ],
    });
    const err = user.validateSync();
    assert.equal(err, undefined);
    assert.equal(user.simulator_results[0].alignmentPct, 66);
  });

  it("defaults both logs to empty arrays for a brand-new user", () => {
    const user = buildValidBaseUser();
    assert.deepEqual(user.career_selection_events, []);
    assert.deepEqual(user.simulator_results, []);
  });

  it("accepts a non-numeric careerId (Mixed type) without validation error", () => {
    const user = buildValidBaseUser({
      career_selection_events: [{ careerId: "custom-career-slug", careerTitle: "Custom", compassFitScore: 50, rankPosition: 2 }],
    });
    const err = user.validateSync();
    assert.equal(err, undefined);
  });
});
