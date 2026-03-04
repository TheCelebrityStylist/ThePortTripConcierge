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
  if (!score) return "bg-slate-500";
  if (score >= 80) return "bg-emerald-400";
  if (score >= 65) return "bg-amber-300";
  return "bg-rose-400";
};

export default function DayNavigator({ cruise, plansByDayId, selectedDayId, onSelectDay, onQuickAdd, onQuickAddFive, autoFocusAdd = false }: Props) {
  return (
    <aside className="flex h-full flex-col rounded-2xl bg-slate-900/70 p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-cyan-200/80">Cruise days</p>
          <p className="truncate text-sm font-semibold">{cruise.cruiseName}</p>
        </div>
        <button className="rounded-lg bg-slate-800 px-2 py-1 text-xs" onClick={onQuickAddFive}>+ Add 5</button>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
        {cruise.itinerary.map((day, index) => {
          const active = selectedDayId === day.id;
          const score = plansByDayId[day.id]?.score.totalScore;
          const planned = !!plansByDayId[day.id];
          return (
            <button key={day.id} data-day-id={day.id} type="button" onClick={() => onSelectDay(day.id)} className={`w-full rounded-xl px-3 py-2 text-left transition ${active ? "bg-cyan-500/15 shadow" : "bg-slate-950/40 hover:bg-white/5"}`}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-slate-400">Day {index + 1}</p>
                <span className={`h-2.5 w-2.5 rounded-full ${scoreTone(score)}`} aria-hidden />
              </div>
              <p className="mt-1 line-clamp-1 text-sm font-medium">{day.portName || day.portSlug}</p>
              <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                <span>{day.date}</span>
                <span className={`rounded-full px-2 py-0.5 ${planned ? "bg-emerald-500/20 text-emerald-200" : "bg-slate-700/70 text-slate-300"}`}>{planned ? "Planned" : "Not planned"}</span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-3 space-y-2 border-t border-white/10 pt-3">
        <p className="text-xs text-slate-400">Quick add day</p>
        <QuickAddDayRow onAdd={onQuickAdd} compact autoFocus={autoFocusAdd} />
      </div>
    </aside>
  );
}
