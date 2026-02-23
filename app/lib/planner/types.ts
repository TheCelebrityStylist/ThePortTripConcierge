export type PlanCategory = "food" | "history" | "scenic" | "beach" | "museum" | "shopping" | "market" | "transit" | "buffer" | "photo";

export type PlanStop = {
  id: string;
  title: string;
  category: PlanCategory;
  startTime: string;
  endTime: string;
  durationMin: number;
  costEUR: number;
  walkMin: number;
  crowdRisk: "low" | "medium" | "high";
  location?: { lat?: number; lng?: number; label?: string; gmapsUrl?: string };
  lockTime?: boolean;
  lockInclusion?: boolean;
  optional?: boolean;
  notes?: string;
};

export type PlanMeta = {
  portSlug: string;
  allAboardTime: string;
  disembarkTime: string;
  returnBufferMin: number;
  riskTolerance: "low" | "med" | "high";
  pace: "relaxed" | "balanced" | "fast";
  budgetLevel: "low" | "med" | "high";
  mobility: "limited" | "moderate" | "high";
  interests: string[];
  generatedAt?: string;
  partySize: number;
  tenderDock: "dock" | "tender";
};

export type Brief = {
  mustDo: string;
  avoid: string;
  walkingLimitMin: number;
  noStairs: boolean;
  avoidQueues: boolean;
  avoidTaxis: boolean;
  avoidBuses: boolean;
  planStyle: "local-first" | "iconic" | "mixed";
  foodAnchors: boolean;
  photoMoments: boolean;
  heatTolerance: "low" | "medium" | "high";
};

export type SuggestionAction = "add" | "swap" | "edit";

export type AgentSuggestion = {
  id: string;
  title: string;
  description: string;
  actionType: SuggestionAction;
  payload: Record<string, unknown>;
};

export type PlannerAgentResponse = {
  assistantMessage: string;
  suggestions: AgentSuggestion[];
  planPatch?: Array<{ op: "add" | "remove" | "replace"; path: string; value?: unknown }>;
  diagnostics?: string[];
};
