import { buildDayHero } from "../generation/buildDayHero";
import type { PortDay, PlanOutput } from "../types";
import type { PlannerWorkspaceState } from "./types";

export const selectSelectedDay = (state: PlannerWorkspaceState): PortDay | undefined =>
  state.cruise.itinerary.find((day) => day.id === state.selectedDayId);

export const selectSelectedPlan = (state: PlannerWorkspaceState): PlanOutput | undefined => {
  const selectedDay = selectSelectedDay(state);
  return selectedDay ? state.plansByDayId[selectedDay.id] : undefined;
};

export const selectPlannedCount = (state: PlannerWorkspaceState) => Object.keys(state.plansByDayId).length;

export const selectHealthChip = (state: PlannerWorkspaceState) => {
  const output = selectSelectedPlan(state);
  if (!output) return "No plan";
  if (output.score.totalScore >= 82) return "Flexible";
  if (output.score.totalScore >= 72) return "Ship-safe";
  if (output.score.totalScore >= 62) return "Tight";
  return "Fragile";
};

export const selectDayHero = (state: PlannerWorkspaceState) => {
  const selectedDay = selectSelectedDay(state);
  const output = selectSelectedPlan(state);
  return selectedDay && output ? buildDayHero(selectedDay, output) : null;
};
