import { applyPlannerIntent } from "./planMutations";
import type { PlanOutput } from "./types";

export function buildRecoveryPlan(output: PlanOutput, behindMinutes: 10 | 20 | 30 | 45) {
  const first = applyPlannerIntent(output, "running-late");
  const next = behindMinutes >= 30 ? applyPlannerIntent(first.next, "shorten-day") : first;
  const cuts = behindMinutes >= 30 ? ["Trimmed optional outer stop", "Shortened dwell windows"] : ["Cut riskiest late leg", "Protected return corridor"]; 
  return {
    next: next.next,
    summary: `Recovery mode applied for +${behindMinutes}m delay.`,
    cuts,
  };
}
