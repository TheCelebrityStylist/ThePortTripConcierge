import assert from "node:assert/strict";
import test from "node:test";
import { generatePortDayPlan, optimizePlan, simulateRisk } from "../engine";
import type { PlanInput } from "../types";

const input: PlanInput = {
  portSlug: "barcelona",
  onboardTime: "08:30",
  allAboardTime: "16:30",
  mustReturnBufferMin: 60,
  walkingLevel: "moderate",
  pace: "normal",
  mode: "balanced",
  interests: ["food", "culture", "views"],
  budgetSensitivity: "medium",
  mustDoStops: [],
  riskTolerance: "balanced",
  avoidCrowds: false,
};

test("generatePortDayPlan deterministic with same seed", () => {
  const a = generatePortDayPlan(input);
  const b = generatePortDayPlan(input);
  assert.deepEqual(a.plan.blocks.map((block) => block.title), b.plan.blocks.map((block) => block.title));
});

test("simulateRisk returns bounded score", () => {
  const plan = generatePortDayPlan(input);
  const score = simulateRisk(plan.plan, input.portSlug);
  assert.ok(score.totalScore >= 0 && score.totalScore <= 100);
});

test("optimizePlan mutates block durations", () => {
  const plan = generatePortDayPlan(input);
  const optimized = optimizePlan(plan.plan, { action: "trim-far-stop" });
  assert.notDeepEqual(optimized.blocks.map((block) => block.durationMin), plan.plan.blocks.map((block) => block.durationMin));
});
