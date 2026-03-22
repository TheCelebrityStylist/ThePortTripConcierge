"use client";

import type { Cruise, PlanOutput } from "@/app/lib/planner/types";

type Props = {
  cruise: Cruise;
  plansByDayId: Record<string, PlanOutput>;
  selectedDayId?: string;
  onSelectDay: (id: string) => void;
};

export default function CruiseOverview({ cruise, plansByDayId, selectedDayId, onSelectDay }: Props) {
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold">Cruise overview</h3>
        <p className="text-xs text-slate-400">Tap a day to drill into timeline</p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {cruise.itinerary.map((day, index) => {
          const plan = plansByDayId[day.id];
          const themes = plan?.plan.input.interests.slice(0, 3).join(" • ") ?? "Awaiting generation";
          const active = selectedDayId === day.id;
          return (
            <button
              type="button"
              key={day.id}
              onClick={() => onSelectDay(day.id)}
              className={`rounded-xl border p-3 text-left ${active ? "border-cyan-400/50 bg-cyan-500/10" : "border-white/10 hover:bg-white/5"}`}
            >
              <p className="text-xs text-slate-400">Day {index + 1} · {day.date}</p>
              <p className="mt-1 text-sm font-semibold">{day.portName || day.portSlug}</p>
              <p className="mt-1 text-xs text-slate-300">{day.arrivalTime} → {day.allAboardTime}</p>
              <p className="mt-1 text-xs text-slate-300">Score: {plan?.score.totalScore ?? "—"} · Walk: {day.walkingPreference}</p>
              <p className="mt-1 line-clamp-2 text-[11px] text-slate-400">{themes}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
