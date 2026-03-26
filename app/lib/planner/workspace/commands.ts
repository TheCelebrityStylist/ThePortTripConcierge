import { gateMessage, getEntitlements, hasFeature } from "@/app/lib/cruise/gates";
import { createPortDayFromPort, optimizePlan, simulateRisk } from "../engine";
import { buildChatResponse } from "../chat/buildChatResponse";
import { buildPlanningContext } from "../context/buildPlanningContext";
import { buildPremiumConciergeBrief } from "../generation/buildConciergeBrief";
import { buildRecoveryMode } from "../generation/buildRecoveryMode";
import { generatePremiumDayPlan } from "../generation/generatePremiumDayPlan";
import { executePlanMutation } from "../mutations/executePlanMutation";
import { parseIntent } from "../mutations/parseIntent";
import type { Cruise, FeatureTier, PlanBlock, PlanInput, PlanOutput, PortDay } from "../types";
import type { PlannerIntent } from "../planMutations";
import type { PlannerWorkspaceState } from "./types";

export const DRAFT_KEY = "porttrip_workspace_draft_v4";

export const defaultInput: PlanInput = {
  portSlug: "barcelona",
  onboardTime: "08:30",
  allAboardTime: "16:30",
  mustReturnBufferMin: 60,
  walkingLevel: "moderate",
  pace: "normal",
  mode: "balanced",
  interests: ["food", "culture", "views"],
  budgetSensitivity: "medium",
  mustDoStops: [],
  riskTolerance: "balanced",
  avoidCrowds: false,
};

export const createDefaultCruise = (): Cruise => ({
  id: "cruise-local",
  cruiseName: "My Cruise",
  startDate: new Date().toISOString().slice(0, 10),
  durationDays: 0,
  timezone: "Local",
  itinerary: [],
});

export const createInitialPlannerWorkspaceState = (): PlannerWorkspaceState => ({
  tier: "free",
  assistantMode: "day",
  mobileTab: "plan",
  input: defaultInput,
  cruise: createDefaultCruise(),
  selectedDayId: undefined,
  plansByDayId: {},
  generation: { running: false, done: 0, total: 0 },
  upgradeGate: null,
  toast: "",
  undoSnapshot: null,
  editingTitle: undefined,
  studioOpen: true,
  changeLog: [],
  boardKey: 0,
  recoveryOpen: false,
  paletteOpen: false,
  highlightedIds: [],
  proposalLabel: "",
  addDayOpen: false,
  detailBlockId: undefined,
});

export const buildDayPlanInput = (input: PlanInput, day: PortDay): PlanInput => ({
  ...input,
  portSlug: day.portSlug,
  portName: day.portName,
  onboardTime: day.arrivalTime,
  allAboardTime: day.allAboardTime,
  walkingLevel: day.walkingPreference,
  pace: day.pace,
  riskTolerance: day.riskTolerance,
  interests: day.interests,
});

export const getWorkspaceEntitlements = (tier: FeatureTier, search: string) => getEntitlements(tier, search);

export function quickAddDayToCruise(state: PlannerWorkspaceState, payload: { portSlug: string; portName: string; arrivalTime: string; allAboardTime: string }, search: string) {
  const entitlements = getWorkspaceEntitlements(state.tier, search);
  if (!hasFeature(entitlements, "fullCruiseMode") && state.cruise.itinerary.length >= 1) {
    return { blockedBy: "fullCruiseMode" as const };
  }

  const index = state.cruise.itinerary.length;
  const date = new Date(new Date(state.cruise.startDate).getTime() + index * 86400000).toISOString().slice(0, 10);
  const day = {
    ...createPortDayFromPort(payload.portSlug, date),
    portName: payload.portName,
    arrivalTime: payload.arrivalTime,
    onboardTime: payload.arrivalTime,
    allAboardTime: payload.allAboardTime,
  };

  const cruise = {
    ...state.cruise,
    durationDays: index + 1,
    itinerary: [...state.cruise.itinerary, day],
  };

  return {
    cruise,
    selectedDayId: day.id,
    toast: `Added ${payload.portName} to Day ${index + 1}.`,
  };
}

export function buildSampleDayPayloads(state: PlannerWorkspaceState, search: string) {
  const entitlements = getWorkspaceEntitlements(state.tier, search);
  return ["barcelona", "marseille", "naples", "rome-civitavecchia"]
    .filter((_, index) => hasFeature(entitlements, "fullCruiseMode") || index === 0)
    .map((slug) => ({ portSlug: slug, portName: slug.replace(/-/g, " "), arrivalTime: "08:00", allAboardTime: "17:00" }));
}

export async function generateDayPlan(input: PlanInput, day: PortDay) {
  return generatePremiumDayPlan(buildDayPlanInput(input, day));
}

export async function generateAllDayPlans(state: PlannerWorkspaceState, search: string, onProgress: (done: number, total: number) => void) {
  const entitlements = getWorkspaceEntitlements(state.tier, search);
  if (!hasFeature(entitlements, "generateAll")) {
    return { blockedBy: "generateAll" as const };
  }

  const nextMap: Record<string, PlanOutput> = {};
  const total = state.cruise.itinerary.length;
  for (let index = 0; index < total; index += 1) {
    const day = state.cruise.itinerary[index];
    nextMap[day.id] = await generateDayPlan(state.input, day);
    onProgress(index + 1, total);
  }

  return { nextMap };
}

export function applyRecommendationToState(state: PlannerWorkspaceState, action: PlanOutput["recommendations"][number]["action"], scope: "day" | "cruise") {
  const selectedDay = state.cruise.itinerary.find((day) => day.id === state.selectedDayId);
  const output = selectedDay ? state.plansByDayId[selectedDay.id] : undefined;
  if (scope === "day" && selectedDay && output) {
    const nextPlan = optimizePlan(output.plan, { action });
    const next = { ...output, plan: nextPlan, score: simulateRisk(nextPlan, nextPlan.input.portSlug) };
    return {
      plansByDayId: { ...state.plansByDayId, [selectedDay.id]: next },
      undoSnapshot: state.plansByDayId,
      changeLog: [`Applied ${action}.`, "Updated sequencing and timing.", "Recomputed risk score."],
    };
  }

  const next = { ...state.plansByDayId };
  Object.entries(next).forEach(([dayId, plan]) => {
    const nextPlan = optimizePlan(plan.plan, { action });
    next[dayId] = { ...plan, plan: nextPlan, score: simulateRisk(nextPlan, nextPlan.input.portSlug) };
  });
  return {
    plansByDayId: next,
    undoSnapshot: state.plansByDayId,
    changeLog: [`Applied ${action} cruise-wide.`, "Preserved locked blocks.", "Recomputed all planned days."],
  };
}

export function updateSelectedDayBlocks(state: PlannerWorkspaceState, nextBlocks: PlanBlock[]) {
  const selectedDay = state.cruise.itinerary.find((day) => day.id === state.selectedDayId);
  const output = selectedDay ? state.plansByDayId[selectedDay.id] : undefined;
  if (!selectedDay || !output) return null;
  const updatedPlan = { ...output.plan, blocks: nextBlocks };
  const updated: PlanOutput = { ...output, plan: updatedPlan, score: simulateRisk(updatedPlan, updatedPlan.input.portSlug) };
  return {
    plansByDayId: { ...state.plansByDayId, [selectedDay.id]: updated },
    changeLog: ["Manual board edits applied.", "Updated block details.", "Score recalculated."],
  };
}

export function applyIntentToState(state: PlannerWorkspaceState, intent: PlannerIntent, scope: "day" | "cruise") {
  const selectedDay = state.cruise.itinerary.find((day) => day.id === state.selectedDayId);
  const output = selectedDay ? state.plansByDayId[selectedDay.id] : undefined;

  if (scope === "day" && selectedDay && output) {
    if (intent === "running-late") {
      const recovery = buildRecoveryMode(output, 30);
      return {
        plansByDayId: { ...state.plansByDayId, [selectedDay.id]: recovery.next },
        changeLog: [recovery.summary, ...recovery.cuts],
        highlightedIds: recovery.next.plan.blocks.slice(0, 2).map((block) => block.id),
        proposalLabel: "",
      };
    }
    const mutation = executePlanMutation(output, intent);
    return {
      plansByDayId: { ...state.plansByDayId, [selectedDay.id]: mutation.next },
      changeLog: [mutation.rationale, ...mutation.changes],
      proposalLabel: `Applied: ${intent.replace(/-/g, " ")}`,
      highlightedIds: mutation.diff.changedBlockIds.slice(0, 4),
    };
  }

  if (scope === "cruise") {
    const nextMap = { ...state.plansByDayId };
    const merged: string[] = [];
    const changed: string[] = [];
    Object.entries(nextMap).forEach(([dayId, plan]) => {
      const mutation = executePlanMutation(plan, intent);
      nextMap[dayId] = mutation.next;
      merged.push(...mutation.changes);
      changed.push(...mutation.diff.changedBlockIds);
    });
    return {
      plansByDayId: nextMap,
      changeLog: Array.from(new Set(merged)).slice(0, 4),
      proposalLabel: `Applied cruise-wide: ${intent.replace(/-/g, " ")}`,
      highlightedIds: Array.from(new Set(changed)).slice(0, 6),
    };
  }

  return null;
}

export async function submitCopilotPromptFromState(state: PlannerWorkspaceState, prompt: string, scope: "day" | "cruise") {
  const parsed = parseIntent(prompt);
  if (!parsed.intent) return null;

  const selectedDay = state.cruise.itinerary.find((day) => day.id === state.selectedDayId);
  const output = selectedDay ? state.plansByDayId[selectedDay.id] : undefined;

  if (scope === "day" && output) {
    const mutation = executePlanMutation(output, parsed.intent);
    const context = await buildPlanningContext({ scope, intent: parsed.intent, selectedDay, selectedPlan: mutation.next, cruise: state.cruise });
    const chat = buildChatResponse({
      intent: parsed.intent,
      context,
      changes: mutation.changes,
      changedBlockIds: mutation.diff.changedBlockIds,
      scoreDelta: mutation.diff.scoreDelta,
    });
    return {
      intent: parsed.intent,
      response: {
        summary: chat.summary,
        why: chat.rationale,
        applyNow: chat.applyNow,
        fallback: chat.diffLabel,
      },
    };
  }

  const context = await buildPlanningContext({ scope, intent: parsed.intent, selectedDay, selectedPlan: output, cruise: state.cruise });
  const brief = buildPremiumConciergeBrief(context);
  return {
    intent: parsed.intent,
    response: {
      summary: `Applied ${parsed.intent.replace(/-/g, " ")} to whole cruise.`,
      why: [`Risk watch: ${brief.risk}`, `Live note: ${brief.liveNote}`],
      applyNow: [
        { label: "Keep me ship-safe", intent: "make-safer" as PlannerIntent },
        { label: "Reduce walking", intent: "reduce-walking" as PlannerIntent },
      ],
      fallback: `Fallback loop: ${brief.fallbackLoop}`,
    },
  };
}

export function buildRecoveryPatch(state: PlannerWorkspaceState, minutes: 10 | 20 | 30 | 45) {
  const selectedDay = state.cruise.itinerary.find((day) => day.id === state.selectedDayId);
  const output = selectedDay ? state.plansByDayId[selectedDay.id] : undefined;
  if (!selectedDay || !output) return null;
  const recovery = buildRecoveryMode(output, minutes);
  return {
    plansByDayId: { ...state.plansByDayId, [selectedDay.id]: recovery.next },
    changeLog: [`Recovery +${minutes}m`, recovery.summary, ...recovery.cuts],
    proposalLabel: `Recovery plan ready (+${minutes}m behind)`,
    highlightedIds: recovery.next.plan.blocks.slice(0, 2).map((block) => block.id),
  };
}

export const gateMessageFor = gateMessage;
