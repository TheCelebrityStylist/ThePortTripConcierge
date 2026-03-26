import type { FeatureGateKey, FeatureTier, PlanBlock, PlanInput, PlanOutput, Cruise } from "../types";

export type PlannerAssistantMode = "day" | "cruise";
export type PlannerMobileTab = "days" | "plan" | "copilot";

export type PlannerGenerationState = {
  running: boolean;
  done: number;
  total: number;
};

export type PlannerWorkspaceState = {
  tier: FeatureTier;
  assistantMode: PlannerAssistantMode;
  mobileTab: PlannerMobileTab;
  input: PlanInput;
  cruise: Cruise;
  selectedDayId?: string;
  plansByDayId: Record<string, PlanOutput>;
  generation: PlannerGenerationState;
  upgradeGate: FeatureGateKey | null;
  toast: string;
  undoSnapshot: Record<string, PlanOutput> | null;
  editingTitle?: string;
  studioOpen: boolean;
  changeLog: string[];
  boardKey: number;
  recoveryOpen: boolean;
  paletteOpen: boolean;
  highlightedIds: string[];
  proposalLabel: string;
  addDayOpen: boolean;
  detailBlockId?: string;
};

export type PlannerWorkspaceDraft = {
  cruise: Cruise;
  selectedDayId?: string;
};

export type PlannerWorkspacePatch = Partial<PlannerWorkspaceState>;

export type PlannerBlockEdit = {
  field: keyof PlanBlock;
  value: string | number | boolean;
};
