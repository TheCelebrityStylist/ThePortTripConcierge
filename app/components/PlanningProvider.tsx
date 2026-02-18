"use client";

import React, { createContext, useContext, useMemo, useState } from "react";

export type Transit = { method: "walk" | "taxi" | "metro" | "bus"; durationMinutes: number; cost: number };
export type PlanStop = {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  transitFromPrevious: Transit;
  visitCost: number;
  lat: number;
  lng: number;
  notes: string;
};

type Risk = "low" | "amber" | "high";
type Walking = "minimal" | "moderate" | "active";

type State = {
  port: string;
  arrivalTime: string;
  allAboardTime: string;
  safeReturnTime: string;
  riskScore: Risk;
  walkingPreference: Walking;
  stops: PlanStop[];
  totalBudget: number;
  shipExcursionBenchmark: number;
};

type Ctx = State & {
  setPlanMeta: (v: Partial<State>) => void;
  addStop: (s: Omit<PlanStop, "id">) => void;
  updateStop: (id: string, partial: Partial<PlanStop>) => void;
  deleteStop: (id: string) => void;
  reorderStops: (id: string, dir: "up" | "down") => void;
  replaceStops: (stops: PlanStop[]) => void;
  recalculate: () => void;
};

const PlanningContext = createContext<Ctx | null>(null);

function uid() {
  return `st_${Math.random().toString(36).slice(2, 10)}`;
}

function hhmmToMin(v: string) {
  const [h, m] = v.split(":").map(Number);
  return h * 60 + m;
}
function minToHhmm(n: number) {
  const h = Math.floor(Math.max(0, n) / 60);
  const m = Math.max(0, n) % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function PlanningProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>({
    port: "Barcelona",
    arrivalTime: "09:00",
    allAboardTime: "16:30",
    safeReturnTime: "15:15",
    riskScore: "amber",
    walkingPreference: "moderate",
    stops: [],
    totalBudget: 0,
    shipExcursionBenchmark: 119,
  });

  const recalculate = () => {
    setState((prev) => {
      let cursor = hhmmToMin(prev.arrivalTime);
      const recalced = prev.stops.map((s, idx) => {
        const transit = idx === 0 ? 0 : s.transitFromPrevious.durationMinutes;
        const start = idx === 0 ? cursor : cursor + transit;
        const end = start + s.durationMinutes;
        cursor = end;
        return { ...s, startTime: minToHhmm(start), endTime: minToHhmm(end) };
      });

      const safeReturn = hhmmToMin(prev.allAboardTime) - 75;
      const finalEnd = recalced.length ? hhmmToMin(recalced[recalced.length - 1].endTime) : hhmmToMin(prev.arrivalTime);
      const totalDist = recalced.reduce((a, s) => a + (s.transitFromPrevious.durationMinutes > 20 ? 1 : 0), 0);
      let risk: Risk = "low";
      if (finalEnd > safeReturn - 75 || totalDist >= 1) risk = "amber";
      if (safeReturn - finalEnd < 45 || totalDist >= 2) risk = "high";

      const totalTransport = recalced.reduce((a, s) => a + (s.transitFromPrevious.cost || 0), 0);
      const totalTickets = recalced.reduce((a, s) => a + (s.visitCost || 0), 0);
      return {
        ...prev,
        stops: recalced,
        safeReturnTime: minToHhmm(safeReturn),
        riskScore: risk,
        totalBudget: totalTransport + totalTickets,
      };
    });
  };

  const value = useMemo<Ctx>(
    () => ({
      ...state,
      setPlanMeta: (v) => setState((p) => ({ ...p, ...v })),
      addStop: (s) => setState((p) => ({ ...p, stops: [...p.stops, { ...s, id: uid() }] })),
      updateStop: (id, partial) => setState((p) => ({ ...p, stops: p.stops.map((s) => (s.id === id ? { ...s, ...partial } : s)) })),
      deleteStop: (id) => setState((p) => ({ ...p, stops: p.stops.filter((s) => s.id !== id) })),
      reorderStops: (id, dir) =>
        setState((p) => {
          const idx = p.stops.findIndex((s) => s.id === id);
          if (idx < 0) return p;
          const nextIdx = dir === "up" ? idx - 1 : idx + 1;
          if (nextIdx < 0 || nextIdx >= p.stops.length) return p;
          const arr = [...p.stops];
          const [item] = arr.splice(idx, 1);
          arr.splice(nextIdx, 0, item);
          return { ...p, stops: arr };
        }),
      replaceStops: (stops) => setState((p) => ({ ...p, stops })),
      recalculate,
    }),
    [state]
  );

  return <PlanningContext.Provider value={value}>{children}</PlanningContext.Provider>;
}

export function usePlanning() {
  const ctx = useContext(PlanningContext);
  if (!ctx) throw new Error("usePlanning must be used inside PlanningProvider");
  return ctx;
}
