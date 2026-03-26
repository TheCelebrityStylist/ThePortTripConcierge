"use client";

import { useSearchParams } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import type { PlanBlock, PlanOutput } from "@/app/lib/planner/types";
import type { PlannerIntent } from "@/app/lib/planner/planMutations";
import {
  applyRecommendationToState,
  buildRecoveryPatch,
  buildSampleDayPayloads,
  createInitialPlannerWorkspaceState,
  DRAFT_KEY,
  gateMessageFor,
  generateAllDayPlans,
  generateDayPlan,
  getWorkspaceEntitlements,
  quickAddDayToCruise,
  updateSelectedDayBlocks,
} from "@/app/lib/planner/workspace/commands";
import { executePlannerActionCommand } from "@/app/lib/planner/workspace/actionBus";
import { plannerWorkspaceReducer } from "@/app/lib/planner/workspace/reducer";
import { selectDayHero, selectHealthChip, selectPlannedCount, selectSelectedDay, selectSelectedPlan } from "@/app/lib/planner/workspace/selectors";
import type { PlannerAssistantMode, PlannerMobileTab, PlannerWorkspaceState } from "@/app/lib/planner/workspace/types";

const PlannerWorkspaceContext = createContext<PlannerWorkspaceValue | null>(null);

type PlannerWorkspaceValue = {
  state: PlannerWorkspaceState;
  entitlements: ReturnType<typeof getWorkspaceEntitlements>;
  selectedDay: ReturnType<typeof selectSelectedDay>;
  selectedPlan: ReturnType<typeof selectSelectedPlan>;
  dayHero: ReturnType<typeof selectDayHero>;
  healthChip: ReturnType<typeof selectHealthChip>;
  plannedCount: number;
  gateMessage: string;
  actions: {
    setAssistantMode: (mode: PlannerAssistantMode) => void;
    setMobileTab: (tab: PlannerMobileTab) => void;
    setSelectedDayId: (dayId?: string) => void;
    setPaletteOpen: (open: boolean) => void;
    setAddDayOpen: (open: boolean) => void;
    setRecoveryOpen: (open: boolean) => void;
    setUpgradeGate: (gate: PlannerWorkspaceState["upgradeGate"]) => void;
    setStudioOpen: (next: boolean | ((prev: boolean) => boolean)) => void;
    renameCruise: (name: string) => void;
    quickAddDay: (payload: { portSlug: string; portName: string; arrivalTime: string; allAboardTime: string }) => void;
    loadSample: () => void;
    generateDay: () => Promise<void>;
    generateAll: () => Promise<void>;
    applyRecommendation: (action: PlanOutput["recommendations"][number]["action"], scope: "day" | "cruise") => void;
    applyIntent: (intent: PlannerIntent, scope: "day" | "cruise") => void;
    submitCopilotPrompt: (prompt: string, scope: "day" | "cruise") => Promise<{ summary: string; why: string[]; applyNow: Array<{ label: string; intent: PlannerIntent }>; fallback?: string } | null>;
    openStopDetails: (blockId: string) => void;
    closeStopDetails: () => void;
    editDetailBlockField: (field: keyof PlanBlock, value: string | number | boolean) => void;
    deleteDetailBlock: () => void;
    applyRecovery: (minutes: 10 | 20 | 30 | 45) => void;
    incrementBoardKey: () => void;
    undoOptimize: () => void;
  };
};

/**
 * Maintainer note:
 * - State ownership for the premium planner workspace lives here, not in `app/chat/page.tsx`.
 * - Mutation flow: UI intent -> workspace action -> planner command helper -> deterministic mutation/reflow -> score/diff -> UI patch.
 * - AI action flow: assistant prompt/chip -> intent parse -> deterministic planner command -> `buildPlanningContext` -> chat/rationale response.
 * - Data hooks: local draft persistence uses `localStorage`, local port DB is used by planner/context helpers, Tavily live context is requested inside `buildPlanningContext`, and OpenAI hooks remain behind the existing API/chat stack rather than this UI provider.
 */
export default function PlannerWorkspaceProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const [state, dispatch] = useReducer(plannerWorkspaceReducer, undefined, createInitialPlannerWorkspaceState);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const search = searchParams.toString();
  const entitlements = useMemo(() => getWorkspaceEntitlements(state.tier, search), [search, state.tier]);

  useEffect(() => {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as { cruise: PlannerWorkspaceState["cruise"]; selectedDayId?: string };
      dispatch({ type: "hydrateDraft", draft: parsed });
    } catch {
      // ignore malformed draft
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ cruise: state.cruise, selectedDayId: state.selectedDayId }));
  }, [state.cruise, state.selectedDayId]);

  useEffect(() => {
    if (state.selectedDayId || state.cruise.itinerary.length === 0) return;
    dispatch({ type: "patch", patch: { selectedDayId: state.cruise.itinerary[0]?.id } });
  }, [state.cruise.itinerary, state.selectedDayId]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        dispatch({ type: "patch", patch: { paletteOpen: !stateRef.current.paletteOpen } });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const flashUI = useCallback((patch: Partial<PlannerWorkspaceState>, timeoutMs = 1800) => {
    dispatch({ type: "patch", patch });
    const cleanup: Partial<PlannerWorkspaceState> = {};
    if (patch.highlightedIds) cleanup.highlightedIds = [];
    if (patch.proposalLabel !== undefined) cleanup.proposalLabel = "";
    if (patch.toast) cleanup.toast = "";
    if (Object.keys(cleanup).length) {
      window.setTimeout(() => dispatch({ type: "patch", patch: cleanup }), timeoutMs);
    }
  }, []);

  const selectedDay = useMemo(() => selectSelectedDay(state), [state]);
  const selectedPlan = useMemo(() => selectSelectedPlan(state), [state]);
  const dayHero = useMemo(() => selectDayHero(state), [state]);
  const healthChip = useMemo(() => selectHealthChip(state), [state]);
  const plannedCount = useMemo(() => selectPlannedCount(state), [state]);

  const setAssistantMode = useCallback((mode: PlannerAssistantMode) => dispatch({ type: "patch", patch: { assistantMode: mode } }), []);
  const setMobileTab = useCallback((tab: PlannerMobileTab) => dispatch({ type: "patch", patch: { mobileTab: tab } }), []);
  const setSelectedDayId = useCallback((dayId?: string) => dispatch({ type: "patch", patch: { selectedDayId: dayId } }), []);
  const setPaletteOpen = useCallback((open: boolean) => dispatch({ type: "patch", patch: { paletteOpen: open } }), []);
  const setAddDayOpen = useCallback((open: boolean) => dispatch({ type: "patch", patch: { addDayOpen: open } }), []);
  const setRecoveryOpen = useCallback((open: boolean) => dispatch({ type: "patch", patch: { recoveryOpen: open } }), []);
  const setUpgradeGate = useCallback((gate: PlannerWorkspaceState["upgradeGate"]) => dispatch({ type: "patch", patch: { upgradeGate: gate } }), []);
  const setStudioOpen = useCallback((next: boolean | ((prev: boolean) => boolean)) => {
    dispatch({ type: "patch", patch: { studioOpen: typeof next === "function" ? next(stateRef.current.studioOpen) : next } });
  }, []);
  const renameCruise = useCallback((name: string) => dispatch({ type: "setCruise", cruise: { ...stateRef.current.cruise, cruiseName: name } }), []);

  const quickAddDay = useCallback((payload: { portSlug: string; portName: string; arrivalTime: string; allAboardTime: string }) => {
    const result = quickAddDayToCruise(stateRef.current, payload, search);
    if (result && "blockedBy" in result) {
      dispatch({ type: "patch", patch: { upgradeGate: result.blockedBy } });
      return;
    }
    if (!result) return;
    dispatch({ type: "setCruise", cruise: result.cruise });
    dispatch({ type: "patch", patch: { selectedDayId: result.selectedDayId, toast: result.toast } });
    flashUI({ toast: result.toast }, 1600);
  }, [flashUI, search]);

  const loadSample = useCallback(() => {
    buildSampleDayPayloads(stateRef.current, search).forEach((payload) => quickAddDay(payload));
  }, [quickAddDay, search]);

  const generateDay = useCallback(async () => {
    const current = stateRef.current;
    const day = selectSelectedDay(current);
    if (!day) return;
    const next = await generateDayPlan(current.input, day);
    dispatch({ type: "mergePlan", dayId: day.id, plan: next });
    dispatch({
      type: "setCruise",
      cruise: {
        ...current.cruise,
        itinerary: current.cruise.itinerary.map((item) => (item.id === day.id ? { ...item, status: "draft", score: next.score.totalScore } : item)),
      },
    });
  }, []);

  const generateAll = useCallback(async () => {
    const current = stateRef.current;
    dispatch({ type: "patch", patch: { generation: { running: true, done: 0, total: current.cruise.itinerary.length } } });
    const result = await generateAllDayPlans(current, search, (done, total) => {
      dispatch({ type: "patch", patch: { generation: { running: true, done, total } } });
    });

    if (result && "blockedBy" in result) {
      dispatch({ type: "patch", patch: { generation: { running: false, done: 0, total: current.cruise.itinerary.length }, upgradeGate: result.blockedBy } });
      return;
    }

    if (!result) return;
    dispatch({ type: "setPlansByDayId", plansByDayId: result.nextMap });
    dispatch({ type: "patch", patch: { generation: { running: false, done: current.cruise.itinerary.length, total: current.cruise.itinerary.length } } });
  }, [search]);

  const applyRecommendation = useCallback((action: PlanOutput["recommendations"][number]["action"], scope: "day" | "cruise") => {
    const patch = applyRecommendationToState(stateRef.current, action, scope);
    dispatch({ type: "patch", patch });
  }, []);

  const applyIntent = useCallback((intent: PlannerIntent, scope: "day" | "cruise") => {
    void executePlannerActionCommand(stateRef.current, { type: "intent", intent, scope, source: "chip" }).then((result) => {
      if (!result.patch) return;
      dispatch({ type: "patch", patch: result.patch });
      if (result.patch.highlightedIds || result.patch.proposalLabel !== undefined) {
        flashUI({ highlightedIds: result.patch.highlightedIds ?? [], proposalLabel: result.patch.proposalLabel ?? "" });
      }
    });
  }, [flashUI]);

  const submitCopilotPrompt = useCallback(async (prompt: string, scope: "day" | "cruise") => {
    const result = await executePlannerActionCommand(stateRef.current, { type: "prompt", prompt, scope });
    if (result.patch) {
      dispatch({ type: "patch", patch: result.patch });
      if (result.patch.highlightedIds || result.patch.proposalLabel !== undefined) {
        flashUI({ highlightedIds: result.patch.highlightedIds ?? [], proposalLabel: result.patch.proposalLabel ?? "" });
      }
    }
    return result.response ?? null;
  }, [flashUI]);

  const openStopDetails = useCallback((blockId: string) => {
    const current = stateRef.current;
    const plan = selectSelectedPlan(current);
    dispatch({
      type: "patch",
      patch: {
        detailBlockId: blockId,
        editingTitle: plan?.plan.blocks.find((block) => block.id === blockId)?.title,
      },
    });
  }, []);

  const closeStopDetails = useCallback(() => dispatch({ type: "patch", patch: { detailBlockId: undefined } }), []);

  const editDetailBlockField = useCallback((field: keyof PlanBlock, value: string | number | boolean) => {
    const current = stateRef.current;
    const selected = selectSelectedPlan(current);
    if (!selected || !current.detailBlockId) return;
    const nextBlocks = selected.plan.blocks.map((block) => (block.id === current.detailBlockId ? { ...block, [field]: value } : block));
    const patch = updateSelectedDayBlocks(current, nextBlocks);
    if (patch) dispatch({ type: "patch", patch });
  }, []);

  const deleteDetailBlock = useCallback(() => {
    const current = stateRef.current;
    const selected = selectSelectedPlan(current);
    if (!selected || !current.detailBlockId) return;
    const patch = updateSelectedDayBlocks(current, selected.plan.blocks.filter((block) => block.id !== current.detailBlockId));
    if (patch) dispatch({ type: "patch", patch: { ...patch, detailBlockId: undefined } });
  }, []);

  const applyRecovery = useCallback((minutes: 10 | 20 | 30 | 45) => {
    const patch = buildRecoveryPatch(stateRef.current, minutes);
    if (!patch) return;
    dispatch({ type: "patch", patch });
    flashUI({ highlightedIds: patch.highlightedIds, proposalLabel: patch.proposalLabel });
  }, [flashUI]);

  const incrementBoardKey = useCallback(() => dispatch({ type: "incrementBoardKey" }), []);

  const undoOptimize = useCallback(() => {
    const current = stateRef.current;
    if (!current.undoSnapshot) return;
    dispatch({ type: "patch", patch: { plansByDayId: current.undoSnapshot, undoSnapshot: null } });
  }, []);

  const value = useMemo<PlannerWorkspaceValue>(() => ({
    state,
    entitlements,
    selectedDay,
    selectedPlan,
    dayHero,
    healthChip,
    plannedCount,
    gateMessage: state.upgradeGate ? gateMessageFor(state.upgradeGate) : "",
    actions: {
      setAssistantMode,
      setMobileTab,
      setSelectedDayId,
      setPaletteOpen,
      setAddDayOpen,
      setRecoveryOpen,
      setUpgradeGate,
      setStudioOpen,
      renameCruise,
      quickAddDay,
      loadSample,
      generateDay,
      generateAll,
      applyRecommendation,
      applyIntent,
      submitCopilotPrompt,
      openStopDetails,
      closeStopDetails,
      editDetailBlockField,
      deleteDetailBlock,
      applyRecovery,
      incrementBoardKey,
      undoOptimize,
    },
  }), [
    state,
    entitlements,
    selectedDay,
    selectedPlan,
    dayHero,
    healthChip,
    plannedCount,
    setAssistantMode,
    setMobileTab,
    setSelectedDayId,
    setPaletteOpen,
    setAddDayOpen,
    setRecoveryOpen,
    setUpgradeGate,
    setStudioOpen,
    renameCruise,
    quickAddDay,
    loadSample,
    generateDay,
    generateAll,
    applyRecommendation,
    applyIntent,
    submitCopilotPrompt,
    openStopDetails,
    closeStopDetails,
    editDetailBlockField,
    deleteDetailBlock,
    applyRecovery,
    incrementBoardKey,
    undoOptimize,
  ]);

  return <PlannerWorkspaceContext.Provider value={value}>{children}</PlannerWorkspaceContext.Provider>;
}

export function usePlannerWorkspace() {
  const context = useContext(PlannerWorkspaceContext);
  if (!context) throw new Error("usePlannerWorkspace must be used inside PlannerWorkspaceProvider");
  return context;
}
