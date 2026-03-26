import { generatePortDayPlan } from "./engine";
import { buildPlanNarrative } from "./planNarrative";
import { resolvePortIntelligence } from "./resolvePortIntelligence";
import { buildStopNarratives } from "./buildStopNarratives";
import type { PlanInput, PlanOutput } from "./types";

const enrichPlan = (output: PlanOutput) => {
  const intelligence = resolvePortIntelligence(output.plan.input);
  const withNarratives = buildStopNarratives(output, intelligence);
  return {
    ...withNarratives,
    narrative: buildPlanNarrative(withNarratives, intelligence),
  } satisfies PlanOutput;
};

export function generateSmartPlan(input: PlanInput): PlanOutput {
  const base = generatePortDayPlan(input);
  return enrichPlan(base);
}
