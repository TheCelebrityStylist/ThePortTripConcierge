import type { PlannerIntent } from "../planMutations";
import type { Cruise, PlanOutput, PortDay } from "../types";
import { loadLocalPortContext } from "../data/loadLocalPortContext";
import { fetchLivePortContext } from "../data/fetchLivePortContext";

export type PlanningContext = {
  scope: "day" | "cruise";
  intent?: PlannerIntent;
  selectedDay?: PortDay;
  selectedPlan?: PlanOutput;
  cruise: Cruise;
  localContext: ReturnType<typeof loadLocalPortContext>;
  liveContext: Awaited<ReturnType<typeof fetchLivePortContext>>;
};

export async function buildPlanningContext({ scope, intent, selectedDay, selectedPlan, cruise }: { scope: "day" | "cruise"; intent?: PlannerIntent; selectedDay?: PortDay; selectedPlan?: PlanOutput; cruise: Cruise }): Promise<PlanningContext> {
  const slug = selectedDay?.portSlug ?? selectedPlan?.plan.input.portSlug ?? cruise.itinerary[0]?.portSlug ?? "barcelona";
  const localContext = loadLocalPortContext(slug);
  const liveContext = await fetchLivePortContext(localContext.portName);
  return { scope, intent, selectedDay, selectedPlan, cruise, localContext, liveContext };
}
