import type { Cruise, PlanOutput } from "../types";
import type { PlannerWorkspaceDraft, PlannerWorkspacePatch, PlannerWorkspaceState } from "./types";

export type PlannerWorkspaceAction =
  | { type: "hydrateDraft"; draft: PlannerWorkspaceDraft }
  | { type: "patch"; patch: PlannerWorkspacePatch }
  | { type: "setCruise"; cruise: Cruise }
  | { type: "setPlansByDayId"; plansByDayId: Record<string, PlanOutput> }
  | { type: "mergePlan"; dayId: string; plan: PlanOutput }
  | { type: "incrementBoardKey" };

export function plannerWorkspaceReducer(state: PlannerWorkspaceState, action: PlannerWorkspaceAction): PlannerWorkspaceState {
  switch (action.type) {
    case "hydrateDraft":
      return {
        ...state,
        cruise: action.draft.cruise,
        selectedDayId: action.draft.selectedDayId,
      };
    case "patch":
      return { ...state, ...action.patch };
    case "setCruise":
      return { ...state, cruise: action.cruise };
    case "setPlansByDayId":
      return { ...state, plansByDayId: action.plansByDayId };
    case "mergePlan":
      return { ...state, plansByDayId: { ...state.plansByDayId, [action.dayId]: action.plan } };
    case "incrementBoardKey":
      return { ...state, boardKey: state.boardKey + 1 };
    default:
      return state;
  }
}
