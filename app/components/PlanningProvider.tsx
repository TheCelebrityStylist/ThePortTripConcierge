"use client";

import React, { createContext, useContext, useMemo, useState } from "react";
import type { DelayScenario, ItineraryPlan, ItineraryStop, StopType, TripMode } from "../lib/types";
import { applyScenarioDelay, breachRepair, computeRisk, minToTime, optimizePlan, parseTimeToMin, sortByStart } from "../lib/plannerUtils";

export type { ItineraryStop as PlanStop };

type Ctx = {
  plan: ItineraryPlan;
  stops: ItineraryStop[];
  scheduledStops: ItineraryStop[];
  unscheduledStops: ItineraryStop[];
  checkpoints: { label: string; time: string; status: "ok" | "warn" | "late" }[];
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
  applyDelayScenario: (scenario: DelayScenario) => void;
  setTripMode: (mode: TripMode) => void;
  budgetByType: Record<StopType, number>;
  totalBudget: number;
  wastedMinutes: number;
  arrivalTime: string;
  allAboardTime: string;
  safeReturnTime: string;
  shipExcursionBenchmark: number;
  riskScore: number;
  riskLevel: ItineraryPlan["riskLevel"];
  port: string;
};

const PlanningContext = createContext<Ctx | null>(null);
const uid = () => `st_${Math.random().toString(36).slice(2, 10)}`;

const riskLevelFromScore = (score: number): ItineraryPlan["riskLevel"] => score >= 70 ? "high" : score >= 40 ? "amber" : "low";

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
    assumptions: ["Traffic can add 10–25m to late transfers", "Queue spikes happen at headline sights"],
    shipExcursionBenchmark: 119,
    transportReliability: { walk: 1, taxi: 2, metro: 2, bus: 3 },
  });

  const recalculate = () => {
    setPlan((prev) => {
      const score = computeRisk(prev.stops, prev.mustReturnByTime);
      return { ...prev, riskScore: score, riskLevel: riskLevelFromScore(score) };
    });
  };

  const autoOptimize = () => {
    setPlan((prev) => {
      const stops = optimizePlan(prev);
      const score = computeRisk(stops, prev.mustReturnByTime);
      return { ...prev, stops, riskScore: score, riskLevel: riskLevelFromScore(score) };
    });
  };

  const applyDelay = (scenario: DelayScenario) => {
    setPlan((prev) => {
      const delayed = applyScenarioDelay(sortByStart(prev.stops), scenario);
      const repaired = breachRepair(delayed, prev.mustReturnByTime);
      const score = computeRisk(repaired.fixed, prev.mustReturnByTime);
      return { ...prev, stops: repaired.fixed, assumptions: [...prev.assumptions, repaired.suggestion], riskScore: score, riskLevel: riskLevelFromScore(score) };
    });
  };

  const value = useMemo<Ctx>(() => {
    const scheduledStops = sortByStart(plan.stops.filter((s) => s.startTime && !s.optional));
    const unscheduledStops = plan.stops.filter((s) => !s.startTime || s.optional);
    const checkpointTimes = [180, 120, 60].map((v, i) => ({ label: `Checkpoint ${String.fromCharCode(65 + i)}`, time: minToTime(parseTimeToMin(plan.mustReturnByTime) - v) }));
    const lastEnd = scheduledStops.length ? parseTimeToMin(scheduledStops[scheduledStops.length - 1].endTime) : 0;
    const checkpoints = checkpointTimes.map((c) => {
      const t = parseTimeToMin(c.time);
      const status: "ok" | "warn" | "late" = lastEnd <= t ? "ok" : lastEnd <= t + 20 ? "warn" : "late";
      return { ...c, status };
    });

    const byType = scheduledStops.reduce<Record<StopType, number>>((acc, s) => {
      acc[s.type] += s.costEstimate || 0;
      return acc;
    }, { attraction: 0, food: 0, transport: 0, buffer: 0 });

    const wastedMinutes = scheduledStops.reduce((acc, s) => acc + (s.type === "buffer" ? s.durationMin : 0) + (s.tags?.highQueue ? 10 : 0), 0);
    const cutSuggestions = plan.assumptions.slice(-2);

    return {
      plan,
      stops: plan.stops,
      scheduledStops,
      unscheduledStops,
      checkpoints,
      cutSuggestions,
      commandBanner: plan.riskLevel === "high" ? "High risk: run Auto-Optimize or cut one optional stop." : plan.riskLevel === "amber" ? "Amber risk: review simulator and keep return buffer protected." : "Return-safe posture is healthy.",
      setPlanMeta: (v) => setPlan((p) => ({ ...p, ...v })),
      addStop: (s) => setPlan((p) => ({ ...p, stops: [...p.stops, { ...s, id: uid() }] })),
      updateStop: (id, partial) => setPlan((p) => ({ ...p, stops: p.stops.map((s) => (s.id === id ? { ...s, ...partial } : s)) })),
      deleteStop: (id) => setPlan((p) => ({ ...p, stops: p.stops.filter((s) => s.id !== id) })),
      reorderStops: (id, dir) => setPlan((p) => {
        const idx = p.stops.findIndex((s) => s.id === id);
        if (idx < 0) return p;
        const n = dir === "up" ? idx - 1 : idx + 1;
        if (n < 0 || n >= p.stops.length) return p;
        const arr = [...p.stops];
        const [item] = arr.splice(idx, 1);
        arr.splice(n, 0, item);
        return { ...p, stops: arr };
      }),
      replaceStops: (stops) => setPlan((p) => ({ ...p, stops })),
      recalculate,
      autoOptimize,
      applyDelayScenario: applyDelay,
      setTripMode: (mode) => setPlan((p) => ({ ...p, tripMode: mode, bufferMinutes: mode === "aggressive" ? 45 : mode === "relaxed" ? 75 : 60 })),
      budgetByType: byType,
      totalBudget: Object.values(byType).reduce((a, b) => a + b, 0),
      wastedMinutes,
      arrivalTime: scheduledStops[0]?.startTime || "09:00",
      allAboardTime: plan.allAboardTime,
      safeReturnTime: plan.mustReturnByTime,
      shipExcursionBenchmark: plan.shipExcursionBenchmark,
      riskScore: plan.riskScore,
      riskLevel: plan.riskLevel,
      port: plan.portSlug,
    };
  }, [plan]);

  return <PlanningContext.Provider value={value}>{children}</PlanningContext.Provider>;
}

export function usePlanning() {
  const ctx = useContext(PlanningContext);
  if (!ctx) throw new Error("usePlanning must be used inside PlanningProvider");
  return ctx;
}
