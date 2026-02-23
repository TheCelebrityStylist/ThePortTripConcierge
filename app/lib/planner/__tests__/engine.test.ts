import assert from "node:assert/strict";
import test from "node:test";
import { applyFixAction, computeRiskBreakdown, generatePlan } from "../engine";
import type { BriefState } from "../types";

const brief: BriefState = {
  portSlug: "barcelona",
  onboardTime: "08:30",
  allAboardTime: "16:30",
  targetBufferMin: 60,
  walkingLevel: "moderate",
  interests: ["food", "culture", "views"],
  pace: "normal",
  mode: "balanced",
};

test("generatePlan is deterministic with same seed inputs", () => {
  const a = generatePlan(brief);
  const b = generatePlan(brief);
  assert.deepEqual(a.stops.map((s) => s.title), b.stops.map((s) => s.title));
});

test("risk breakdown returns bounded score", () => {
  const plan = generatePlan(brief);
  const risk = computeRiskBreakdown(plan);
  assert.ok(risk.total >= 0 && risk.total <= 100);
  assert.equal(risk.items.length, 5);
});

test("fix action mutates plan structure", () => {
  const plan = generatePlan(brief);
  const fixed = applyFixAction(plan, "trim-farthest");
  assert.notDeepEqual(fixed.stops.map((s) => s.durationMin), plan.stops.map((s) => s.durationMin));
});
