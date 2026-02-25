import { generatePortDayPlan } from "../app/lib/planner/engine";
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

["barcelona", "cozumel", "juneau"].forEach((portSlug) => {
  const output = generatePortDayPlan({ ...base, portSlug });
  console.log(`\n=== ${portSlug} ===`);
  console.log(`score=${output.score.totalScore}; violations=${output.score.violations.length}`);
  output.plan.blocks.slice(0, 5).forEach((block) => console.log(`${block.startTime} ${block.title}`));
});
