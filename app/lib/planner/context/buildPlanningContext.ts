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
  preferences: { pace?: string; walking?: string; interests?: string[]; budget?: string };
  itinerarySnapshot: Array<{ dayId: string; port: string; score?: number }>;
  localContext: ReturnType<typeof loadLocalPortContext>;
  liveContext: Awaited<ReturnType<typeof fetchLivePortContext>>;
};

export async function buildPlanningContext({ scope, intent, selectedDay, selectedPlan, cruise }: { scope: "day" | "cruise"; intent?: PlannerIntent; selectedDay?: PortDay; selectedPlan?: PlanOutput; cruise: Cruise }): Promise<PlanningContext> {
  const slug = selectedDay?.portSlug ?? selectedPlan?.plan.input.portSlug ?? cruise.itinerary[0]?.portSlug ?? "barcelona";
  const localContext = loadLocalPortContext(slug);
  const liveContext = await fetchLivePortContext(localContext.portName);
  return {
    scope,
    intent,
    selectedDay,
    selectedPlan,
    cruise,
    preferences: {
      pace: selectedDay?.pace ?? selectedPlan?.plan.input.pace,
      walking: selectedDay?.walkingPreference ?? selectedPlan?.plan.input.walkingLevel,
      interests: selectedDay?.interests ?? selectedPlan?.plan.input.interests,
      budget: selectedPlan?.plan.input.budgetSensitivity,
    },
    itinerarySnapshot: cruise.itinerary.map((day) => ({ dayId: day.id, port: day.portSlug, score: day.score })),
    localContext,
    liveContext,
  };
}
