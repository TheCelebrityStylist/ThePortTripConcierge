"use client";

import AIActionStudio from "../AIActionStudio";
import { usePlannerWorkspace } from "./PlannerWorkspaceProvider";

export default function PlannerAssistantRail() {
  const { state, selectedDay, selectedPlan, actions } = usePlannerWorkspace();

  return (
    <AIActionStudio
      cruise={state.cruise}
      selectedDay={selectedDay}
      selectedPlan={selectedPlan}
      mode={state.assistantMode}
      changeLog={state.changeLog}
      onModeChange={actions.setAssistantMode}
      onApplyIntent={actions.applyIntent}
      onSubmitPrompt={actions.submitCopilotPrompt}
    />
  );
}
