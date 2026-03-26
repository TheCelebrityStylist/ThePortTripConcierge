import type { PlanOutput } from "../types";
import { loadLocalPortContext } from "../data/loadLocalPortContext";

export function buildStopNarratives(output: PlanOutput) {
  const local = loadLocalPortContext(output.plan.input.portSlug);
  return output.plan.blocks.map((block, index) => `${block.title}: timed ${block.startTime} to avoid ${local.transitNotes[index % Math.max(local.transitNotes.length, 1)] || "late queue spikes"}.`);
}
