"use client";

import React, { createContext, useContext, useMemo, useState } from "react";
import type { DelayScenario, ItineraryPlan, ItineraryStop, StopType } from "../lib/types";
import { applyScenarioDelay, minToTime, parseTimeToMin, sortByStart } from "../lib/plannerUtils";

export type { ItineraryStop as PlanStop };

type Ctx = {
  plan: ItineraryPlan;
  stops: ItineraryStop[];
  unscheduledStops: ItineraryStop[];
  checkpoints: { label: string; time: string; status: "ok" | "warn" | "late" }[];
  cutSuggestions: string[];
  setPlanMeta: (v: Partial<ItineraryPlan>) => void;
  addStop: (s: Omit<ItineraryStop, "id">) => void;
  updateStop: (id: string, partial: Partial<ItineraryStop>) => void;
  deleteStop: (id: string) => void;
  reorderStops: (id: string, dir: "up" | "down") => void;
  replaceStops: (stops: ItineraryStop[]) => void;
  recalculate: () => void;
  autoSequence: () => void;
  applyDelayScenario: (scenario: DelayScenario) => void;
  budgetByType: Record<StopType, number>;
  totalBudget: number;
  arrivalTime: string;
  allAboardTime: string;
  safeReturnTime: string;
  shipExcursionBenchmark: number;
  riskScore: ItineraryPlan["riskLevel"];
  port: string;
};

const PlanningContext = createContext<Ctx | null>(null);

function uid() {
  return `st_${Math.random().toString(36).slice(2, 10)}`;
}

function riskFromPlan(stops: ItineraryStop[], mustReturnByTime: string): ItineraryPlan["riskLevel"] {
  const scheduled = stops.filter((s) => s.startTime && s.endTime);
  if (!scheduled.length) return "low";
  const last = scheduled[scheduled.length - 1];
  const left = parseTimeToMin(mustReturnByTime) - parseTimeToMin(last.endTime);
  if (left < 20) return "high";
  if (left < 45) return "amber";
  return "low";
}

export function PlanningProvider({ children }: { children: React.ReactNode }) {
  const [plan, setPlan] = useState<ItineraryPlan>({
    id: "local-plan",
    portSlug: "barcelona",
    date: new Date().toISOString().slice(0, 10),
    allAboardTime: "16:30",
    mustReturnByTime: "15:15",
    riskLevel: "low",
    stops: [],
    assumptions: ["Traffic variance can expand last transfer by 10–20m", "Keep at least one hard buffer before return"],
    shipExcursionBenchmark: 119,
  });

  const recalculate = () => {
    setPlan((prev) => {
      const sorted = sortByStart(prev.stops);
      const withDuration = sorted.map((s) => {
        if (!s.startTime || !s.durationMin) return s;
        return { ...s, endTime: minToTime(parseTimeToMin(s.startTime) + s.durationMin) };
      });
      const riskLevel = riskFromPlan(withDuration, prev.mustReturnByTime);
      return { ...prev, stops: withDuration, riskLevel };
    });
  };

  const autoSequence = () => {
    setPlan((prev) => {
      const scheduled = sortByStart(prev.stops.filter((s) => s.startTime));
      let cursor = scheduled[0]?.startTime ? parseTimeToMin(scheduled[0].startTime) : parseTimeToMin("09:00");
      const sequenced: ItineraryStop[] = [];
      scheduled.forEach((stop, idx) => {
        const start = idx === 0 ? cursor : cursor + 10;
        const end = start + stop.durationMin;
        sequenced.push({ ...stop, startTime: minToTime(start), endTime: minToTime(end) });
        cursor = end;
        if (idx < scheduled.length - 1) {
          sequenced.push({
            id: uid(),
            title: `Buffer before ${scheduled[idx + 1].title}`,
            type: "buffer",
            startTime: minToTime(cursor),
            endTime: minToTime(cursor + 15),
            durationMin: 15,
            location: { name: "Transit/queue margin" },
            costEstimate: 0,
            notes: "Auto-inserted safety buffer",
            source: "manual",
          });
          cursor += 15;
        }
      });
      const unscheduled = prev.stops.filter((s) => !s.startTime);
      const nextStops = [...sequenced, ...unscheduled];
      return { ...prev, stops: nextStops, riskLevel: riskFromPlan(sequenced, prev.mustReturnByTime) };
    });
  };

  const applyDelayScenario = (scenario: DelayScenario) => {
    setPlan((prev) => {
      const scheduled = sortByStart(prev.stops.filter((s) => s.startTime));
      const delayed = applyScenarioDelay(scheduled, scenario);
      const unscheduled = prev.stops.filter((s) => !s.startTime);
      const merged = [...delayed, ...unscheduled];
      return { ...prev, stops: merged, riskLevel: riskFromPlan(delayed, prev.mustReturnByTime) };
    });
  };

  const value = useMemo<Ctx>(() => {
    const scheduled = sortByStart(plan.stops.filter((s) => s.startTime));
    const unscheduledStops = plan.stops.filter((s) => !s.startTime);
    const checkpointTimes = [
      { label: "Checkpoint A", time: minToTime(parseTimeToMin(plan.mustReturnByTime) - 180) },
      { label: "Checkpoint B", time: minToTime(parseTimeToMin(plan.mustReturnByTime) - 120) },
      { label: "Checkpoint C", time: minToTime(parseTimeToMin(plan.mustReturnByTime) - 60) },
    ];
    const lastEnd = scheduled.length ? parseTimeToMin(scheduled[scheduled.length - 1].endTime) : 0;
    const checkpoints = checkpointTimes.map((c) => {
      const t = parseTimeToMin(c.time);
      const status: "ok" | "warn" | "late" = lastEnd <= t ? "ok" : lastEnd <= t + 20 ? "warn" : "late";
      return { ...c, status };
    });
    const byType = scheduled.reduce<Record<StopType, number>>(
      (acc, s) => {
        acc[s.type] += s.costEstimate || 0;
        return acc;
      },
      { attraction: 0, food: 0, transport: 0, buffer: 0 }
    );
    const cutSuggestions = plan.riskLevel === "high"
      ? scheduled.filter((s) => s.type !== "transport").slice(-2).map((s) => `Cut '${s.title}' to recover ${s.durationMin}m.`)
      : plan.riskLevel === "amber"
      ? ["Consider skipping one optional attraction to increase return margin."]
      : ["Plan is currently within return-safe margin."];

    return {
      plan,
      stops: plan.stops,
      unscheduledStops,
      checkpoints,
      cutSuggestions,
      setPlanMeta: (v) => setPlan((p) => ({ ...p, ...v })),
      addStop: (s) => setPlan((p) => ({ ...p, stops: [...p.stops, { ...s, id: uid() }] })),
      updateStop: (id, partial) => setPlan((p) => ({ ...p, stops: p.stops.map((s) => (s.id === id ? { ...s, ...partial } : s)) })),
      deleteStop: (id) => setPlan((p) => ({ ...p, stops: p.stops.filter((s) => s.id !== id) })),
      reorderStops: (id, dir) =>
        setPlan((p) => {
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
      autoSequence,
      applyDelayScenario,
      budgetByType: byType,
      totalBudget: Object.values(byType).reduce((a, b) => a + b, 0),
      arrivalTime: scheduled[0]?.startTime || "09:00",
      allAboardTime: plan.allAboardTime,
      safeReturnTime: plan.mustReturnByTime,
      shipExcursionBenchmark: plan.shipExcursionBenchmark,
      riskScore: plan.riskLevel,
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
