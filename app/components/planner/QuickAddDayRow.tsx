"use client";

import { useState } from "react";
import PortCombobox from "./PortCombobox";
import { portsRegistry } from "@/app/lib/ports";

type Props = {
  onAdd: (payload: { portSlug: string; portName: string; arrivalTime: string; allAboardTime: string }) => void;
  compact?: boolean;
  autoFocus?: boolean;
};

export default function QuickAddDayRow({ onAdd, compact = false, autoFocus = false }: Props) {
  const [portSlug, setPortSlug] = useState("barcelona");
  const [arrivalTime, setArrivalTime] = useState("08:00");
  const [allAboardTime, setAllAboardTime] = useState("17:00");

  const portName = portsRegistry[portSlug]?.name ?? "Port";

  return (
    <div className={`grid gap-2 ${compact ? "grid-cols-1" : "md:grid-cols-[1.7fr_1fr_1fr_auto]"}`}>
      <PortCombobox value={portSlug} onChange={setPortSlug} autoFocus={autoFocus} />
      <input type="time" className="rounded-lg bg-slate-800 px-3 py-2 text-sm" value={arrivalTime} onChange={(e) => setArrivalTime(e.target.value)} />
      <input type="time" className="rounded-lg bg-slate-800 px-3 py-2 text-sm" value={allAboardTime} onChange={(e) => setAllAboardTime(e.target.value)} />
      <button onClick={() => onAdd({ portSlug, portName, arrivalTime, allAboardTime })} className="rounded-lg bg-cyan-400 px-3 py-2 text-sm font-semibold text-slate-900">
        + Add day
      </button>
    </div>
  );
}
