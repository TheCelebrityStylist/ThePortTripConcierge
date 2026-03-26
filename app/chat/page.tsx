"use client";

import PlannerWorkspaceProvider from "@/app/components/planner/workspace/PlannerWorkspaceProvider";
import PlannerWorkspaceScreen from "@/app/components/planner/workspace/PlannerWorkspaceScreen";

export default function ChatPage() {
  return (
    <PlannerWorkspaceProvider>
      <PlannerWorkspaceScreen />
    </PlannerWorkspaceProvider>
  );
}
