import type { PlannerIntent } from "../planMutations";
import type { PlanOutput } from "../types";
import { executeMutation } from "./executeMutation";

export function executePlanMutation(output: PlanOutput, intent: PlannerIntent) {
  return executeMutation(output, intent);
}
