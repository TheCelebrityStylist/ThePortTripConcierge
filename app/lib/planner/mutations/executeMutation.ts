import { applyPlannerIntent, type PlannerIntent } from "../planMutations";
import type { PlanOutput } from "../types";
import { buildDiff } from "./buildDiff";

export function executeMutation(output: PlanOutput, intent: PlannerIntent) {
  const { next, changes } = applyPlannerIntent(output, intent);
  const diff = buildDiff(output, next);
  return { next, changes, diff, rationale: `Applied ${intent} to active itinerary and recomputed safety score.` };
}
