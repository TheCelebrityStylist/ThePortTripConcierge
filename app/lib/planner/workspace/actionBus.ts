import { buildChatResponse } from "../chat/buildChatResponse";
import { buildPlanningContext } from "../context/buildPlanningContext";
import { buildPremiumConciergeBrief } from "../generation/buildConciergeBrief";
import { buildRecoveryMode } from "../generation/buildRecoveryMode";
import { buildDiff } from "../mutations/buildDiff";
import { executePlanMutation } from "../mutations/executePlanMutation";
import { parseIntent } from "../mutations/parseIntent";
import type { PlannerIntent } from "../planMutations";
import type { PlanOutput } from "../types";
import type { PlannerWorkspacePatch, PlannerWorkspaceState } from "./types";

type PlannerActionScope = "day" | "cruise";

type AssistantResponse = {
  summary: string;
  why: string[];
  applyNow: Array<{ label: string; intent: PlannerIntent }>;
  fallback?: string;
};

export type PlannerActionCommand =
  | { type: "intent"; intent: PlannerIntent; scope: PlannerActionScope; source: "chip" | "prompt" }
  | { type: "prompt"; prompt: string; scope: PlannerActionScope };

export type PlannerActionExecution = {
  patch?: PlannerWorkspacePatch;
  response?: AssistantResponse | null;
};

const intentLabel = (intent: PlannerIntent) => {
  switch (intent) {
    case "make-safer":
      return "Keep me ship-safe";
    case "make-cheaper":
      return "Make it cheaper";
    case "add-food-stop":
      return "Add food stop";
    case "reduce-walking":
      return "Reduce walking";
    case "running-late":
      return "I’m 30 minutes behind";
    case "weather-safe":
      return "Weather-safe";
    case "family-friendly":
      return "Family-friendly";
    default:
      return intent.replace(/-/g, " ");
  }
};

const withDelta = (value: number) => `${value >= 0 ? "+" : ""}${value}`;

const selectedDayAndPlan = (state: PlannerWorkspaceState) => {
  const selectedDay = state.cruise.itinerary.find((day) => day.id === state.selectedDayId);
  const selectedPlan = selectedDay ? state.plansByDayId[selectedDay.id] : undefined;
  return { selectedDay, selectedPlan };
};

const buildPatchFromDayMutation = (
  state: PlannerWorkspaceState,
  intent: PlannerIntent,
  next: PlanOutput,
  changeLog: string[],
  diff: ReturnType<typeof buildDiff>,
): PlannerWorkspacePatch => {
  const { selectedDay } = selectedDayAndPlan(state);
  if (!selectedDay) return {};
  const summary = `${intentLabel(intent)} · ${Math.max(1, diff.changedBlockIds.length)} item${diff.changedBlockIds.length === 1 ? "" : "s"} changed · ${withDelta(diff.scoreDelta)} score`;

  return {
    plansByDayId: { ...state.plansByDayId, [selectedDay.id]: next },
    changeLog: [summary, ...changeLog].slice(0, 4),
    proposalLabel: summary,
    highlightedIds: diff.changedBlockIds.slice(0, 4),
  };
};

const runDayIntent = (state: PlannerWorkspaceState, intent: PlannerIntent) => {
  const { selectedDay, selectedPlan } = selectedDayAndPlan(state);
  if (!selectedDay || !selectedPlan) return null;

  if (intent === "running-late") {
    const recovery = buildRecoveryMode(selectedPlan, 30);
    const diff = buildDiff(selectedPlan, recovery.next);
    const summary = `${intentLabel(intent)} · ${Math.max(1, diff.changedBlockIds.length)} item${diff.changedBlockIds.length === 1 ? "" : "s"} changed · ${withDelta(diff.scoreDelta)} score`;
    return {
      next: recovery.next,
      diff,
      patch: {
        plansByDayId: { ...state.plansByDayId, [selectedDay.id]: recovery.next },
        changeLog: [summary, recovery.summary, ...recovery.cuts].slice(0, 4),
        proposalLabel: summary,
        highlightedIds: diff.changedBlockIds.slice(0, 4),
      } satisfies PlannerWorkspacePatch,
      changes: [recovery.summary, ...recovery.cuts],
    };
  }

  const mutation = executePlanMutation(selectedPlan, intent);
  return {
    next: mutation.next,
    diff: mutation.diff,
    patch: buildPatchFromDayMutation(state, intent, mutation.next, [mutation.rationale, ...mutation.changes], mutation.diff),
    changes: mutation.changes,
  };
};

const runCruiseIntent = (state: PlannerWorkspaceState, intent: PlannerIntent) => {
  const nextMap = { ...state.plansByDayId };
  const merged: string[] = [];
  const changed: string[] = [];
  let scoreDelta = 0;

  Object.entries(nextMap).forEach(([dayId, plan]) => {
    const mutation = intent === "running-late"
      ? (() => {
          const recovery = buildRecoveryMode(plan, 30);
          return { next: recovery.next, diff: buildDiff(plan, recovery.next), changes: [recovery.summary, ...recovery.cuts] };
        })()
      : executePlanMutation(plan, intent);

    nextMap[dayId] = mutation.next;
    merged.push(...mutation.changes);
    changed.push(...mutation.diff.changedBlockIds);
    scoreDelta += mutation.diff.scoreDelta;
  });

  const summary = `${intentLabel(intent)} cruise-wide · ${Math.max(1, changed.length)} item${changed.length === 1 ? "" : "s"} changed · ${withDelta(scoreDelta)} score`;

  return {
    patch: {
      plansByDayId: nextMap,
      changeLog: [summary, ...Array.from(new Set(merged)).slice(0, 3)],
      proposalLabel: summary,
      highlightedIds: Array.from(new Set(changed)).slice(0, 6),
    } satisfies PlannerWorkspacePatch,
  };
};

const buildPromptResponse = async (state: PlannerWorkspaceState, intent: PlannerIntent, scope: PlannerActionScope, nextPlan?: PlanOutput, diff?: ReturnType<typeof buildDiff>, changes: string[] = []): Promise<AssistantResponse> => {
  const { selectedDay, selectedPlan } = selectedDayAndPlan(state);

  if (scope === "day" && nextPlan && diff) {
    const context = await buildPlanningContext({ scope, intent, selectedDay, selectedPlan: nextPlan, cruise: state.cruise });
    const chat = buildChatResponse({
      intent,
      context,
      changes,
      changedBlockIds: diff.changedBlockIds,
      scoreDelta: diff.scoreDelta,
    });

    return {
      summary: chat.summary,
      why: chat.rationale,
      applyNow: chat.applyNow,
      fallback: chat.diffLabel,
    };
  }

  const context = await buildPlanningContext({ scope, intent, selectedDay, selectedPlan, cruise: state.cruise });
  const brief = buildPremiumConciergeBrief(context);
  return {
    summary: `Applied ${intentLabel(intent).toLowerCase()} to the whole cruise.`,
    why: [`Risk watch: ${brief.risk}`, `Live note: ${brief.liveNote}`],
    applyNow: [
      { label: "Keep me ship-safe", intent: "make-safer" },
      { label: "Reduce walking", intent: "reduce-walking" },
    ],
    fallback: `Fallback loop: ${brief.fallbackLoop}`,
  };
};

export async function executePlannerActionCommand(state: PlannerWorkspaceState, command: PlannerActionCommand): Promise<PlannerActionExecution> {
  if (command.type === "intent") {
    if (command.scope === "day") {
      const dayMutation = runDayIntent(state, command.intent);
      if (!dayMutation) return { response: null };

      const response = command.source === "prompt"
        ? await buildPromptResponse(state, command.intent, command.scope, dayMutation.next, dayMutation.diff, dayMutation.changes)
        : null;

      return { patch: dayMutation.patch, response };
    }

    const cruiseMutation = runCruiseIntent(state, command.intent);
    const response = command.source === "prompt"
      ? await buildPromptResponse(state, command.intent, command.scope)
      : null;
    return { patch: cruiseMutation.patch, response };
  }

  const parsed = parseIntent(command.prompt);
  if (!parsed.intent) {
    return {
      response: {
        summary: "I couldn’t map that to a planner action yet.",
        why: ["Try one of the built-in actions like Reduce walking, Make it cheaper, Add food stop, Keep me ship-safe, Weather-safe, or Family-friendly."],
        applyNow: [
          { label: "Reduce walking", intent: "reduce-walking" },
          { label: "Make it cheaper", intent: "make-cheaper" },
          { label: "Family-friendly", intent: "family-friendly" },
        ],
      },
    };
  }

  return executePlannerActionCommand(state, { type: "intent", intent: parsed.intent, scope: command.scope, source: "prompt" });
}
