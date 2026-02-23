"use client";

import type { PlanStop } from "@/app/lib/planner/types";

type Props = {
  stop: PlanStop;
  onToggle: (id: string, key: "lockTime" | "lockInclusion") => void;
  onAsk: (id: string, action: string) => void;
  onMove: (id: string, direction: "up" | "down") => void;
};

export default function StopCard({ stop, onToggle, onAsk, onMove }: Props) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/70 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium">{stop.startTime} • {stop.title}</p>
          <p className="text-xs text-slate-400">{stop.category} · {stop.durationMin}m · €{stop.costEUR} · walk {stop.walkMin}m · crowd {stop.crowdRisk}</p>
        </div>
        <div className="flex gap-1">
          <button className="rounded bg-slate-800 px-2" onClick={() => onMove(stop.id, "up")}>↑</button>
          <button className="rounded bg-slate-800 px-2" onClick={() => onMove(stop.id, "down")}>↓</button>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-2 text-xs">
        <button onClick={() => onToggle(stop.id, "lockTime")} className={`rounded px-2 py-1 ${stop.lockTime ? "bg-cyan-500 text-slate-900" : "bg-slate-800"}`}>Lock time</button>
        <button onClick={() => onToggle(stop.id, "lockInclusion")} className={`rounded px-2 py-1 ${stop.lockInclusion ? "bg-cyan-500 text-slate-900" : "bg-slate-800"}`}>Lock inclusion</button>
        {["Improve", "Alternative", "Cheaper", "Less walking", "Add photo", "Add food"].map((action) => <button key={action} onClick={() => onAsk(stop.id, action)} className="rounded bg-slate-800 px-2 py-1">{action}</button>)}
      </div>
    </div>
  );
}
