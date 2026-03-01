"use client";

import { useState } from "react";
import PortTypeahead from "./PortTypeahead";

type Props = {
  onAdd: (payload: { portSlug: string; portName: string; arrivalTime: string; allAboardTime: string }) => void;
  compact?: boolean;
};

export default function QuickAddDayRow({ onAdd, compact = false }: Props) {
  const [portSlug, setPortSlug] = useState("barcelona");
  const [portName, setPortName] = useState("Barcelona");
  const [arrivalTime, setArrivalTime] = useState("08:00");
  const [allAboardTime, setAllAboardTime] = useState("17:00");

  return (
    <div className={`grid gap-2 ${compact ? "grid-cols-1" : "md:grid-cols-[1.6fr_1fr_1fr_auto]"}`}>
      <PortTypeahead value={portSlug} onSelect={(port) => {
        setPortSlug(port.slug);
        setPortName(port.name);
      }} />
      <input type="time" className="rounded-lg bg-slate-800 px-3 py-2 text-sm" value={arrivalTime} onChange={(e) => setArrivalTime(e.target.value)} />
      <input type="time" className="rounded-lg bg-slate-800 px-3 py-2 text-sm" value={allAboardTime} onChange={(e) => setAllAboardTime(e.target.value)} />
      <button
        onClick={() => onAdd({ portSlug, portName, arrivalTime, allAboardTime })}
        className="rounded-lg bg-cyan-400 px-3 py-2 text-sm font-semibold text-slate-900"
      >
        + Add day
      </button>
    </div>
  );
}
