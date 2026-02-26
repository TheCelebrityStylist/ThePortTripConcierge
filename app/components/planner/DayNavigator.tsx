"use client";

import type { Cruise, PlanOutput } from "@/app/lib/planner/types";

type Props = {
  cruise: Cruise;
  plansByDayId: Record<string, PlanOutput>;
  selectedDayId?: string;
  onSelectDay: (id: string) => void;
  onAddDay: () => void;
};

export default function DayNavigator({ cruise, plansByDayId, selectedDayId, onSelectDay, onAddDay }: Props) {
  return (
    <aside className="rounded-2xl border border-white/10 bg-slate-900/70 p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-semibold">Cruise days</p>
        <button onClick={onAddDay} className="rounded bg-slate-800 px-2 py-1 text-xs">+ Day</button>
      </div>
      <div className="space-y-2">
        {cruise.itinerary.map((day, index) => {
          const active = selectedDayId === day.id;
          const planned = !!plansByDayId[day.id];
          return (
            <button
              key={day.id}
              type="button"
              onClick={() => onSelectDay(day.id)}
              className={`block w-full rounded-lg border p-2 text-left ${active ? "border-cyan-400/60 bg-cyan-500/10" : "border-white/10 hover:bg-white/5"}`}
            >
              <p className="text-xs text-slate-400">Day {index + 1} · {day.date}</p>
              <p className="text-sm">{day.portName || day.portSlug}</p>
              <p className="text-[11px] text-slate-400">{day.arrivalTime}–{day.allAboardTime} {planned ? `· Score ${plansByDayId[day.id].score.totalScore}` : "· Not planned"}</p>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
