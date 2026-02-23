import { generatePlan } from "../app/lib/planner/engine";
import type { PlanInput } from "../app/lib/planner/types";

const base: Omit<PlanInput, "portSlug"> = {
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

["barcelona", "santorini", "st-maarten"].forEach((portSlug) => {
  const output = generatePlan({ ...base, portSlug });
  console.log(`\n=== ${portSlug} ===`);
  console.log(`score: ${output.score.totalScore}`);
  output.plan.blocks.slice(0, 4).forEach((block) => console.log(`${block.startTime} ${block.title}`));
});
