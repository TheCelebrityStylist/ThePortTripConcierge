import type { PortDay } from "./types";
import { buildConciergeBrief } from "./planNarrative";
import { resolvePortIntelligence } from "./resolvePortIntelligence";
import type { PlanOutput } from "./types";

export function buildPremiumConciergeBrief(output: PlanOutput, selectedDay?: PortDay) {
  return buildConciergeBrief(output, resolvePortIntelligence(output.plan.input), selectedDay);
}
