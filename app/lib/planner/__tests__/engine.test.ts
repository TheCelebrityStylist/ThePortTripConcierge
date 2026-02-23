import assert from "node:assert/strict";
import test from "node:test";
import { generatePlan, optimizePlan, simulatePlan } from "../engine";
import { portsRegistry } from "@/app/data/ports";
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

test("generatePlan is deterministic for same seed", () => {
  const a = generatePlan(input);
  const b = generatePlan(input);
  assert.deepEqual(a.plan.blocks.map((block) => block.title), b.plan.blocks.map((block) => block.title));
});

test("simulatePlan produces bounded score", () => {
  const generated = generatePlan(input);
  const score = simulatePlan(generated.plan, portsRegistry[input.portSlug], input);
  assert.ok(score.totalScore >= 0 && score.totalScore <= 100);
});

test("optimizePlan modifies block sequence or durations", () => {
  const generated = generatePlan(input);
  const optimized = optimizePlan(generated.plan, { action: "trim-far-stop" }, portsRegistry[input.portSlug]);
  assert.notDeepEqual(optimized.blocks.map((block) => block.durationMin), generated.plan.blocks.map((block) => block.durationMin));
});
