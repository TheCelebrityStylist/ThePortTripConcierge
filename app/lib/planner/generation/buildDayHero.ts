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
  const firstMajor = output.plan.blocks.find((b) => b.type === "stop")?.title ?? intel.signatureHighlight;
  const lunch = output.plan.blocks.find((b) => /food|market|tapas|lunch/i.test(b.title))?.title ?? intel.foodAnchor;
  const lastSafe = [...output.plan.blocks].reverse().find((b) => b.type !== "transfer")?.title ?? intel.nearPortFallbackLoop;

  return {
    title: port,
    window: `${day.arrivalTime}–${day.allAboardTime}`,
    summary: `${firstMajor} sets the tone early, ${lunch} keeps energy stable mid-day, and the final leg stays close enough to board without a risky late cross-city transfer.`,
    mustNotMiss: firstMajor,
    watchOutFor: output.score.violations[0] ?? `Late transfer risk after ${lunch}.`,
    fallback: intel.nearPortFallbackLoop,
    whyThisWorks: `The sequence moves from ${firstMajor} into ${lunch}, then narrows toward ${lastSafe} so your last meaningful stop remains in a safer return corridor before all-aboard.`,
  };
}
