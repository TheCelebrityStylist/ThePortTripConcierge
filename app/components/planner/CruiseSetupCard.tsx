"use client";

import type { Cruise, PortDay } from "@/app/lib/planner/types";
import PortPicker from "./PortPicker";

type DayError = { port?: string; times?: string };

type Props = {
  cruise: Cruise;
  mode: "single-port" | "full-cruise";
  selectedDayId?: string;
  dayErrors: Record<string, DayError>;
  onModeChange: (mode: "single-port" | "full-cruise") => void;
  onCruiseChange: (patch: Partial<Cruise>) => void;
  onDayChange: (id: string, patch: Partial<PortDay>) => void;
  onAddDay: () => void;
  onRemoveDay: (id: string) => void;
  onDuplicatePortToAll: (id: string) => void;
  onAutoFillDay: (id: string) => void;
  onSelectDay: (id: string) => void;
};

export default function CruiseSetupCard({
  cruise,
  mode,
  selectedDayId,
  dayErrors,
  onModeChange,
  onCruiseChange,
  onDayChange,
  onAddDay,
  onRemoveDay,
  onDuplicatePortToAll,
  onAutoFillDay,
  onSelectDay,
}: Props) {
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">Cruise setup</h2>
          <p className="text-xs text-slate-400">Plan your entire cruise in minutes, then fine-tune with AI.</p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-slate-800 p-1 text-xs">
          <button onClick={() => onModeChange("single-port")} className={`rounded-full px-3 py-1 ${mode === "single-port" ? "bg-cyan-400 text-slate-900" : "text-slate-300"}`}>Single Port</button>
          <button onClick={() => onModeChange("full-cruise")} className={`rounded-full px-3 py-1 ${mode === "full-cruise" ? "bg-cyan-400 text-slate-900" : "text-slate-300"}`}>Full Cruise</button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <label className="text-xs text-slate-300">Cruise name<input className="mt-1 w-full rounded-lg bg-slate-800 px-3 py-2 text-sm" value={cruise.cruiseName} onChange={(e) => onCruiseChange({ cruiseName: e.target.value })} /></label>
        <label className="text-xs text-slate-300">Start date<input type="date" className="mt-1 w-full rounded-lg bg-slate-800 px-3 py-2 text-sm" value={cruise.startDate} onChange={(e) => onCruiseChange({ startDate: e.target.value })} /></label>
        <label className="text-xs text-slate-300">Duration days<input type="number" min={1} className="mt-1 w-full rounded-lg bg-slate-800 px-3 py-2 text-sm" value={cruise.durationDays} onChange={(e) => onCruiseChange({ durationDays: Math.max(1, Number(e.target.value) || 1) })} /></label>
        <label className="text-xs text-slate-300">Cruise line<input className="mt-1 w-full rounded-lg bg-slate-800 px-3 py-2 text-sm" value={cruise.cruiseLine ?? ""} onChange={(e) => onCruiseChange({ cruiseLine: e.target.value })} /></label>
        <label className="text-xs text-slate-300">Ship (optional)<input className="mt-1 w-full rounded-lg bg-slate-800 px-3 py-2 text-sm" value={cruise.ship ?? ""} onChange={(e) => onCruiseChange({ ship: e.target.value })} /></label>
        <label className="text-xs text-slate-300">Timezone<input className="mt-1 w-full rounded-lg bg-slate-800 px-3 py-2 text-sm" value={cruise.timezone} onChange={(e) => onCruiseChange({ timezone: e.target.value })} /></label>
      </div>

      <div className="mt-4 rounded-xl border border-white/10 p-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-medium">Port days</p>
          <button onClick={onAddDay} className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs">+ Add day</button>
        </div>

        <div className="space-y-2">
          {cruise.itinerary.map((day, index) => {
            const selected = selectedDayId === day.id;
            const errors = dayErrors[day.id] || {};
            return (
              <div key={day.id} className={`rounded-xl border p-3 ${selected ? "border-cyan-400/50 bg-cyan-500/5" : "border-white/10"}`}>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <button type="button" onClick={() => onSelectDay(day.id)} className="text-left text-sm font-medium">
                    Day {index + 1} · {day.date}
                  </button>
                  <div className="flex gap-1">
                    <button onClick={() => onDuplicatePortToAll(day.id)} className="rounded bg-slate-800 px-2 py-1 text-[11px]">Apply to many</button>
                    <button onClick={() => onAutoFillDay(day.id)} className="rounded bg-slate-800 px-2 py-1 text-[11px]">Auto-fill typical</button>
                    <button onClick={() => onRemoveDay(day.id)} disabled={cruise.itinerary.length === 1} className="rounded bg-slate-800 px-2 py-1 text-[11px] disabled:opacity-40">Remove</button>
                  </div>
                </div>

                <div className="grid gap-2 md:grid-cols-4">
                  <div className="md:col-span-2">
                    <PortPicker
                      value={day.portSlug}
                      onChange={(port) => onDayChange(day.id, { portSlug: port.slug, portName: port.name })}
                    />
                  </div>
                  <label className="text-xs text-slate-300">Arrival<input type="time" value={day.arrivalTime} onChange={(e) => onDayChange(day.id, { arrivalTime: e.target.value, onboardTime: e.target.value })} className="mt-1 w-full rounded-lg bg-slate-800 px-2 py-2 text-sm" /></label>
                  <label className="text-xs text-slate-300">All aboard<input type="time" value={day.allAboardTime} onChange={(e) => onDayChange(day.id, { allAboardTime: e.target.value })} className="mt-1 w-full rounded-lg bg-slate-800 px-2 py-2 text-sm" /></label>
                </div>

                {(errors.port || errors.times) && <p className="mt-2 rounded bg-rose-500/15 px-2 py-1 text-xs text-rose-200">{errors.port || errors.times}</p>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
