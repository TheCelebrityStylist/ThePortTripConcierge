import { mutateDayPlan } from "../domain/mutations";
import type { PlannerIntent } from "../planMutations";
import type { PlanOutput } from "../types";
import { buildAssistantResponse } from "./buildAssistantResponse";

export function executeIntent(args: { dayId: string; output: PlanOutput; intent: PlannerIntent }) {
  const result = mutateDayPlan(args.dayId, args.output, args.intent);
  const assistant = buildAssistantResponse({
    intent: args.intent,
    changes: result.changes,
    scoreDelta: result.beforeAfter.afterScore - result.beforeAfter.beforeScore,
    changedStopIds: result.changedStopIds,
  });
  return { result, assistant };
}
