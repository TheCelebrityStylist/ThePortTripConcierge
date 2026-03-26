"use client";

import DayNavigator from "../DayNavigator";
import { usePlannerWorkspace } from "./PlannerWorkspaceProvider";

export default function PlannerDayRail() {
  const { state, actions } = usePlannerWorkspace();

  return (
    <DayNavigator
      cruise={state.cruise}
      plansByDayId={state.plansByDayId}
      selectedDayId={state.selectedDayId}
      onSelectDay={actions.setSelectedDayId}
      onOpenAddDay={() => actions.setAddDayOpen(true)}
    />
  );
}
