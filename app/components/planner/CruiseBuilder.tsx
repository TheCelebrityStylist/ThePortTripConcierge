"use client";

import type { Cruise, PortDay } from "@/app/lib/planner/types";
import PortCombobox from "./PortCombobox";

type Props = {
  cruise: Cruise;
  setCruise: (cruise: Cruise) => void;
  mode: "single-port" | "full-cruise";
  setMode: (mode: "single-port" | "full-cruise") => void;
  onAddDay: () => void;
};

export default function CruiseBuilder({ cruise, setCruise, mode, setMode, onAddDay }: Props) {
  const updateDay = (id: string, patch: Partial<PortDay>) => {
    setCruise({ ...cruise, itinerary: cruise.itinerary.map((day) => (day.id === id ? { ...day, ...patch } : day)) });
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/60 p-3 sm:p-4">
      <div className="mb-3 flex gap-2">
        <button onClick={() => setMode("single-port")} className={`rounded-full px-3 py-1 text-xs ${mode === "single-port" ? "bg-cyan-400 text-slate-900" : "bg-slate-800"}`}>Single Port</button>
        <button onClick={() => setMode("full-cruise")} className={`rounded-full px-3 py-1 text-xs ${mode === "full-cruise" ? "bg-cyan-400 text-slate-900" : "bg-slate-800"}`}>Full Cruise</button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="text-xs text-slate-300">Cruise name<input className="mt-1 w-full rounded bg-slate-800 p-2 text-sm" value={cruise.cruiseName} onChange={(event) => setCruise({ ...cruise, cruiseName: event.target.value })} /></label>
        <label className="text-xs text-slate-300">Cruise line<input className="mt-1 w-full rounded bg-slate-800 p-2 text-sm" value={cruise.cruiseLine ?? ""} onChange={(event) => setCruise({ ...cruise, cruiseLine: event.target.value })} /></label>
        <label className="text-xs text-slate-300">Ship<input className="mt-1 w-full rounded bg-slate-800 p-2 text-sm" value={cruise.ship ?? ""} onChange={(event) => setCruise({ ...cruise, ship: event.target.value })} /></label>
        <label className="text-xs text-slate-300">Start date<input type="date" className="mt-1 w-full rounded bg-slate-800 p-2 text-sm" value={cruise.startDate} onChange={(event) => setCruise({ ...cruise, startDate: event.target.value })} /></label>
        <label className="text-xs text-slate-300">Duration (days)<input type="number" className="mt-1 w-full rounded bg-slate-800 p-2 text-sm" value={cruise.durationDays} onChange={(event) => setCruise({ ...cruise, durationDays: Number(event.target.value) })} /></label>
        <label className="text-xs text-slate-300">Timezone<input className="mt-1 w-full rounded bg-slate-800 p-2 text-sm" value={cruise.timezone} onChange={(event) => setCruise({ ...cruise, timezone: event.target.value })} /></label>
      </div>

      <div className="mt-4 rounded-lg border border-white/10 p-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-medium">Itinerary port days</p>
          <button onClick={onAddDay} className="rounded bg-slate-800 px-2 py-1 text-xs">Add day</button>
        </div>
        <div className="space-y-3">
          {cruise.itinerary.map((day) => (
            <details key={day.id} className="rounded border border-white/10 p-2" open>
              <summary className="cursor-pointer text-sm">{day.date} · {day.portSlug} · {day.status}</summary>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <PortCombobox value={day.portSlug} onChange={(slug) => updateDay(day.id, { portSlug: slug })} />
                <div className="grid gap-2">
                  <label className="text-xs">Arrival<input type="time" className="mt-1 w-full rounded bg-slate-800 p-2 text-sm" value={day.arrivalTime} onChange={(event) => updateDay(day.id, { arrivalTime: event.target.value, onboardTime: event.target.value })} /></label>
                  <label className="text-xs">All aboard<input type="time" className="mt-1 w-full rounded bg-slate-800 p-2 text-sm" value={day.allAboardTime} onChange={(event) => updateDay(day.id, { allAboardTime: event.target.value })} /></label>
                </div>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
