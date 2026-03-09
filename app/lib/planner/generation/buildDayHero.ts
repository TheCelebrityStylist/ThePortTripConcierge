import type { PlanOutput, PortDay } from "../types";
import { buildPortIntelligence } from "../planHeuristics";

export type DayHero = {
  title: string;
  window: string;
  summary: string;
  mustNotMiss: string;
  watchOutFor: string;
  fallback: string;
  whyThisWorks: string;
};

export function buildDayHero(day: PortDay, output: PlanOutput): DayHero {
  const intel = buildPortIntelligence(output.plan.input);
  const port = day.portName || day.portSlug;
  return {
    title: port,
    window: `${day.arrivalTime}–${day.allAboardTime}`,
    summary: `A ${output.plan.input.pace} ship-safe day balancing ${output.plan.input.interests.slice(0, 2).join(" + ")} with a protected return corridor.`,
    mustNotMiss: intel.signatureHighlight,
    watchOutFor: output.score.violations[0] ?? "Late-distance drift after lunch.",
    fallback: intel.nearPortFallbackLoop,
    whyThisWorks: `${intel.anchorClusters[0]} lands early, then transitions stay near ${intel.supportingClusters[0]} before final return buffer protection.`,
  };
}
