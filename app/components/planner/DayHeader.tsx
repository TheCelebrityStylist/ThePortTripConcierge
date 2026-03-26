"use client";

import type { PlanOutput, PortDay } from "@/app/lib/planner/types";

export default function DayHeader({ day, plan }: { day?: PortDay; plan?: PlanOutput }) {
  if (!day) return null;
  const score = plan?.score.totalScore;

  return (
    <header className="rounded-2xl bg-slate-900/70 p-5 shadow-lg shadow-slate-950/30">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-cyan-200/80">Active day</p>
          <h2 className="mt-1 text-2xl font-semibold">{day.date} — {day.portName || day.portSlug}</h2>
          <p className="mt-2 text-sm text-slate-300">Arrival {day.arrivalTime} → All aboard {day.allAboardTime}</p>
        </div>
        <button className="rounded-lg bg-slate-800 px-2 py-1 text-xs text-slate-300 hover:bg-slate-700">Edit</button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full bg-slate-800 px-3 py-1">Walking: {day.walkingPreference}</span>
        <span className="rounded-full bg-slate-800 px-3 py-1">Pace: {day.pace}</span>
        <span className="rounded-full bg-slate-800 px-3 py-1">Score: {score ?? "—"}</span>
      </div>
    </header>
  );
}
