import type { PlanOutput } from "../types";
import { buildRecoveryPlan } from "../buildRecoveryPlan";

const pickStep = (minutesBehind: number): 10 | 20 | 30 | 45 => {
  if (minutesBehind >= 45) return 45;
  if (minutesBehind >= 30) return 30;
  if (minutesBehind >= 20) return 20;
  return 10;
};

export function buildRecoveryMode(output: PlanOutput, minutesBehind: number) {
  const recovery = buildRecoveryPlan(output, pickStep(minutesBehind));
  return {
    next: recovery.next,
    summary: recovery.summary,
    cuts: recovery.cuts,
    preserved: recovery.next.plan.blocks.filter((block) => block.lock).map((block) => block.title),
    newScore: recovery.next.score.totalScore,
  };
}
