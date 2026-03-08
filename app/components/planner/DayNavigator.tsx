"use client";

import type { Cruise, PlanOutput } from "@/app/lib/planner/types";
import QuickAddDayRow from "./QuickAddDayRow";

type Props = {
  cruise: Cruise;
  plansByDayId: Record<string, PlanOutput>;
  selectedDayId?: string;
  onSelectDay: (id: string) => void;
  onQuickAdd: (payload: { portSlug: string; portName: string; arrivalTime: string; allAboardTime: string }) => void;
  onQuickAddFive: () => void;
  autoFocusAdd?: boolean;
};

const scoreTone = (score?: number) => {
  if (!score) return "bg-slate-500/40 text-slate-300";
  if (score >= 80) return "bg-emerald-500/20 text-emerald-200";
  if (score >= 65) return "bg-amber-500/20 text-amber-200";
  return "bg-rose-500/20 text-rose-200";
};

export default function DayNavigator({ cruise, plansByDayId, selectedDayId, onSelectDay, onQuickAdd, onQuickAddFive }: Props) {
  return (
    <aside className="flex h-full flex-col rounded-[24px] border border-white/10 bg-[#0D1526] p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-[13px] uppercase tracking-[0.14em] text-cyan-200/80">Days</p>
          <p className="text-lg font-semibold">{cruise.cruiseName}</p>
        </div>
        <button className="rounded-2xl border border-white/10 bg-slate-900/70 px-3 py-2 text-xs hover:bg-slate-800" onClick={onQuickAddFive}>+ Add</button>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
        {cruise.itinerary.length === 0 && (
          <div className="rounded-3xl border border-dashed border-white/20 bg-slate-900/60 p-5 text-sm text-slate-300">
            <p className="font-semibold">Add your first day</p>
            <p className="mt-1 text-xs text-slate-400">Start with a port and time window. We’ll generate the full plan instantly.</p>
          </div>
        )}
        {cruise.itinerary.map((day, index) => {
          const active = selectedDayId === day.id;
          const score = plansByDayId[day.id]?.score.totalScore;
          const planned = !!plansByDayId[day.id];
          return (
            <button
              key={day.id}
              data-day-id={day.id}
              type="button"
              onClick={() => onSelectDay(day.id)}
              className={`w-full rounded-3xl border p-4 text-left shadow-[0_14px_32px_rgba(0,0,0,0.22)] transition ${active ? "border-cyan-300/60 bg-cyan-500/10 ring-1 ring-cyan-300/40" : "border-white/10 bg-slate-900/70 hover:bg-slate-800/70"}`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Day {index + 1}</p>
                <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${scoreTone(score)}`}>{score ? `Score ${score}` : "No score"}</span>
              </div>
              <p className="mt-2 line-clamp-1 text-base font-semibold">{day.portName || day.portSlug}</p>
              <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                <span>{day.arrivalTime}–{day.allAboardTime}</span>
                <span>{day.date}</span>
              </div>
              <span className={`mt-3 inline-flex rounded-full px-2 py-1 text-[10px] ${planned ? "bg-emerald-500/20 text-emerald-200" : "bg-slate-700 text-slate-300"}`}>{planned ? "Planned" : "Not planned"}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-5 border-t border-white/10 pt-5">
        <p className="mb-2 text-[13px] uppercase tracking-[0.14em] text-cyan-200/80">Quick add day</p>
        <QuickAddDayRow onAdd={onQuickAdd} compact />
      </div>
    </aside>
  );
}
