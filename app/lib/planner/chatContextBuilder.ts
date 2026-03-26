import { buildPortIntelligence } from "./planHeuristics";
import type { Cruise, PlanOutput, PortDay } from "./types";

export type PlannerChatContext = {
  cruise: Cruise;
  selectedDay?: PortDay;
  selectedPlan?: PlanOutput;
  scope: "day" | "cruise";
  intelligenceSummary: ReturnType<typeof buildPortIntelligence> | null;
  lockedStops: string[];
  weakestPart: string;
};

export function buildChatContext({ cruise, selectedDay, selectedPlan, scope }: { cruise: Cruise; selectedDay?: PortDay; selectedPlan?: PlanOutput; scope: "day" | "cruise" }): PlannerChatContext {
  const intelligenceSummary = selectedPlan ? buildPortIntelligence(selectedPlan.plan.input) : null;
  return {
    cruise,
    selectedDay,
    selectedPlan,
    scope,
    intelligenceSummary,
    lockedStops: selectedPlan?.plan.blocks.filter((block) => block.lock).map((block) => block.title) ?? [],
    weakestPart: selectedPlan?.score.violations[0] ?? "Transfer reliability near late afternoon window.",
  };
}
