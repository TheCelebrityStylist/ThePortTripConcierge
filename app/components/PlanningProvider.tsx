"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { applySimulation, runReturnSafeEngine } from "../lib/returnSafeEngine";
import type { DelayScenario, EngineOutput, ItineraryPlan, ItineraryStop, StopType, TripMode } from "../lib/types";
import { parseTimeToMin, sortByStart } from "../lib/plannerUtils";

export type { ItineraryStop as PlanStop };

type Ctx = {
  plan: ItineraryPlan;
  engine: EngineOutput;
  stops: ItineraryStop[];
  scheduledStops: ItineraryStop[];
  unscheduledStops: ItineraryStop[];
  checkpoints: EngineOutput["checkpoints"];
  cutSuggestions: string[];
  commandBanner: string;
  setPlanMeta: (v: Partial<ItineraryPlan>) => void;
  addStop: (s: Omit<ItineraryStop, "id">) => void;
  updateStop: (id: string, partial: Partial<ItineraryStop>) => void;
  deleteStop: (id: string) => void;
  reorderStops: (id: string, dir: "up" | "down") => void;
  replaceStops: (stops: ItineraryStop[]) => void;
  recalculate: () => void;
  autoOptimize: () => void;
  applyDelayScenario: (scenario: DelayScenario) => { before: ItineraryStop[]; after: ItineraryStop[]; warning?: string };
  applyBestFix: () => void;
  setTripMode: (mode: TripMode) => void;
  budgetByType: Record<StopType, number>;
  totalBudget: number;
  wastedMinutes: number;
  allAboardTime: string;
  safeReturnTime: string;
  shipExcursionBenchmark: number;
  riskScore: number;
  riskLevel: ItineraryPlan["riskLevel"];
  port: string;
};

const PlanningContext = createContext<Ctx | null>(null);
const uid = () => `st_${Math.random().toString(36).slice(2, 10)}`;
const riskLevel = (s: number): ItineraryPlan["riskLevel"] => (s >= 70 ? "high" : s >= 40 ? "amber" : "low");

export function PlanningProvider({ children }: { children: React.ReactNode }) {
  const [plan, setPlan] = useState<ItineraryPlan>({
    id: "local-plan",
    portSlug: "barcelona",
    date: new Date().toISOString().slice(0, 10),
    allAboardTime: "16:30",
    mustReturnByTime: "15:30",
    bufferMinutes: 60,
    tripMode: "balanced",
    riskLevel: "low",
    riskScore: 20,
    stops: [],
    assumptions: ["Estimated travel windows are used unless locked manually"],
    shipExcursionBenchmark: 119,
    budgetCap: 150,
    walkingLevel: "moderate",
    transportReliability: { walk: 1, taxi: 2, metro: 2, bus: 3 },
  });

  const engine = useMemo(() => runReturnSafeEngine(plan), [plan]);

  const recalculate = useCallback(() => {
    setPlan((prev) => {
      const out = runReturnSafeEngine(prev);
      return { ...prev, stops: out.scheduledBlocks, riskScore: out.returnSafeScore, riskLevel: riskLevel(out.returnSafeScore) };
    });
  }, []);

  const autoOptimize = useCallback(() => {
    setPlan((prev) => {
      const output = runReturnSafeEngine(prev);
      return { ...prev, stops: output.scheduledBlocks, riskScore: output.returnSafeScore, riskLevel: riskLevel(output.returnSafeScore), assumptions: [...prev.assumptions, ...output.breachReasons] };
    });
  }, []);

  const applyDelayScenario = useCallback((scenario: DelayScenario) => {
    const before = sortByStart(plan.stops.filter((s) => s.startTime));
    const sim = applySimulation(plan, scenario);
    const afterPlan = { ...plan, stops: sim.shifted };
    const output = runReturnSafeEngine(afterPlan);
    setPlan((prev) => ({ ...prev, stops: output.scheduledBlocks, riskScore: output.returnSafeScore, riskLevel: riskLevel(output.returnSafeScore), assumptions: [...prev.assumptions, ...output.breachReasons, ...(sim.weatherWarning ? [sim.weatherWarning] : [])] }));
    return { before, after: output.scheduledBlocks.filter((s) => s.startTime), warning: sim.weatherWarning || undefined };
  }, [plan]);

  const applyBestFix = useCallback(() => {
    setPlan((prev) => {
      const output = runReturnSafeEngine(prev);
      const cutTitle = output.cutRecommendations[0]?.match(/cut (.+?) to/i)?.[1];
      if (cutTitle) {
        const keep = prev.stops.filter((s) => !s.title.toLowerCase().includes(cutTitle.toLowerCase()));
        const rerun = runReturnSafeEngine({ ...prev, stops: keep });
        return { ...prev, stops: rerun.scheduledBlocks, riskScore: rerun.returnSafeScore, riskLevel: riskLevel(rerun.returnSafeScore), assumptions: [...prev.assumptions, output.cutRecommendations[0]] };
      }
      const flex = [...prev.stops].reverse().find((s) => s.flexibility === "flex" && !s.optional);
      if (flex) {
        const next = prev.stops.map((s) => (s.id === flex.id ? { ...s, durationMin: Math.max(20, s.durationMin - 20) } : s));
        const rerun = runReturnSafeEngine({ ...prev, stops: next });
        return { ...prev, stops: rerun.scheduledBlocks, riskScore: rerun.returnSafeScore, riskLevel: riskLevel(rerun.returnSafeScore), assumptions: [...prev.assumptions, output.shortenRecommendations[0]] };
      }
      return prev;
    });
  }, []);

  const value = useMemo<Ctx>(() => {
    const scheduledStops = sortByStart(plan.stops.filter((s) => s.startTime && !s.optional));
    const unscheduledStops = plan.stops.filter((s) => !s.startTime || s.optional);
    const byType = scheduledStops.reduce<Record<StopType, number>>(
      (acc, s) => {
        acc[s.type] = (acc[s.type] || 0) + (s.costEstimate || 0);
        return acc;
      },
      { attraction: 0, food: 0, transport: 0, buffer: 0, misc: 0 }
    );

    const wastedMinutes = scheduledStops.reduce((acc, s) => acc + (s.type === "buffer" ? s.durationMin : 0) + (s.tags?.highQueue ? 10 : 0), 0);

    return {
      plan,
      engine,
      stops: plan.stops,
      scheduledStops,
      unscheduledStops,
      checkpoints: engine.checkpoints,
      cutSuggestions: [...engine.cutRecommendations, ...engine.shortenRecommendations],
      commandBanner: engine.breachReasons.length ? engine.breachReasons[0] : "Return-safe posture is healthy.",
      setPlanMeta: (v) => setPlan((p) => ({ ...p, ...v })),
      addStop: (s) => setPlan((p) => ({ ...p, stops: [...p.stops, { ...s, id: uid() }] })),
      updateStop: (id, partial) => setPlan((p) => ({ ...p, stops: p.stops.map((s) => (s.id === id ? { ...s, ...partial } : s)) })),
      deleteStop: (id) => setPlan((p) => ({ ...p, stops: p.stops.filter((s) => s.id !== id) })),
      reorderStops: (id, dir) =>
        setPlan((p) => {
          const idx = p.stops.findIndex((s) => s.id === id);
          if (idx < 0) return p;
          const nextIdx = dir === "up" ? idx - 1 : idx + 1;
          if (nextIdx < 0 || nextIdx >= p.stops.length) return p;
          const arr = [...p.stops];
          const [item] = arr.splice(idx, 1);
          arr.splice(nextIdx, 0, item);
          return { ...p, stops: arr };
        }),
      replaceStops: (stops) => setPlan((p) => ({ ...p, stops })),
      recalculate,
      autoOptimize,
      applyDelayScenario,
      applyBestFix,
      setTripMode: (mode) => setPlan((p) => ({ ...p, tripMode: mode, bufferMinutes: mode === "aggressive" ? 45 : mode === "relaxed" ? 75 : 60 })),
      budgetByType: byType,
      totalBudget: Object.values(byType).reduce((a, b) => a + b, 0),
      wastedMinutes,
      allAboardTime: plan.allAboardTime,
      safeReturnTime: plan.mustReturnByTime,
      shipExcursionBenchmark: plan.shipExcursionBenchmark,
      riskScore: plan.riskScore,
      riskLevel: plan.riskLevel,
      port: plan.portSlug,
    };
  }, [plan, engine, recalculate, autoOptimize, applyDelayScenario, applyBestFix]);

  return <PlanningContext.Provider value={value}>{children}</PlanningContext.Provider>;
}

export function usePlanning() {
  const ctx = useContext(PlanningContext);
  if (!ctx) throw new Error("usePlanning must be used inside PlanningProvider");
  return ctx;
}
