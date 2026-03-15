"use client";

import type { Cruise, PlanOutput } from "@/app/lib/planner/types";

type Props = {
  cruise: Cruise;
  plansByDayId: Record<string, PlanOutput>;
  selectedDayId?: string;
  onSelectDay: (id: string) => void;
  onOpenAddDay: () => void;
};

const scoreTone = (score?: number) => {
  if (!score) return "bg-slate-500/40 text-slate-300";
  if (score >= 80) return "bg-emerald-500/20 text-emerald-200";
  if (score >= 65) return "bg-amber-500/20 text-amber-200";
  return "bg-rose-500/20 text-rose-200";
};

export default function DayNavigator({ cruise, plansByDayId, selectedDayId, onSelectDay, onOpenAddDay }: Props) {
  return (
    <aside className="flex h-full flex-col rounded-[24px] border border-white/10 bg-[#0D1526] p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs text-slate-400">Your days</p>
          <p className="text-lg font-semibold">{cruise.cruiseName}</p>
        </div>
        <button className="rounded-full bg-cyan-400 px-3 py-2 text-xs font-semibold text-slate-900" onClick={onOpenAddDay}>+ Add day</button>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
        {cruise.itinerary.length === 0 && <div className="rounded-2xl border border-dashed border-white/20 bg-slate-900/40 p-4 text-xs text-slate-300">Start by adding your first port day.</div>}
        {cruise.itinerary.map((day, index) => {
          const active = selectedDayId === day.id;
          const score = plansByDayId[day.id]?.score.totalScore;
          return (
            <button key={day.id} type="button" onClick={() => onSelectDay(day.id)} className={`w-full rounded-2xl border p-3 text-left transition ${active ? "border-cyan-300/60 bg-cyan-500/10" : "border-white/10 bg-slate-900/70 hover:bg-slate-800/70"}`}>
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-slate-400">Day {index + 1}</p>
                <span className={`rounded-full px-2 py-0.5 text-[10px] ${scoreTone(score)}`}>{score ? score : "—"}</span>
              </div>
              <p className="mt-1 text-sm font-semibold">{day.portName || day.portSlug}</p>
              <p className="text-[11px] text-slate-400">{day.arrivalTime}–{day.allAboardTime}</p>
            </button>
          );
        })}
      </div>

      <button onClick={onOpenAddDay} className="mt-4 rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-xs text-slate-300">Paste or add itinerary…</button>
    </aside>
  );
}
