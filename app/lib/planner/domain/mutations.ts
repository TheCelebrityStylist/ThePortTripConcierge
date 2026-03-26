import { applyPlannerIntent, type PlannerIntent } from "../planMutations";
import type { PlanOutput } from "../types";
import { toDayPlan } from "./dayPlan";
import { diffDayPlans } from "./diff";
import type { MutationResult } from "./types";

export function mutateDayPlan(dayId: string, output: PlanOutput, intent: PlannerIntent): MutationResult {
  const before = toDayPlan(dayId, output);
  const { next, changes } = applyPlannerIntent(output, intent);
  const updatedPlan = toDayPlan(dayId, next);
  const delta = diffDayPlans(before, updatedPlan);
  return {
    updatedPlan,
    changes,
    rationale: `Applied ${intent} with deterministic planner safeguards and reflowed timeline.`,
    changedStopIds: [...delta.addedStopIds, ...delta.changedStopIds],
    beforeAfter: { beforeScore: before.confidenceScore, afterScore: updatedPlan.confidenceScore },
  };
}
