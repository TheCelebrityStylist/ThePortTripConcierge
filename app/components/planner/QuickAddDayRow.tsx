"use client";

import { useMemo, useRef, useState } from "react";
import PortCombobox from "./PortCombobox";
import { portsRegistry } from "@/app/lib/ports";

type Props = {
  onAdd: (payload: { portSlug: string; portName: string; arrivalTime: string; allAboardTime: string }) => void;
  compact?: boolean;
  autoFocus?: boolean;
};

const parseItinerary = (raw: string) =>
  raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const normalized = line.toLowerCase();
      const found = Object.values(portsRegistry).find((port) => normalized.includes(port.name.toLowerCase()) || normalized.includes(port.slug));
      return found ? { slug: found.slug, name: found.name } : null;
    })
    .filter(Boolean) as Array<{ slug: string; name: string }>;

export default function QuickAddDayRow({ onAdd, compact = false, autoFocus = false }: Props) {
  const [portSlug, setPortSlug] = useState("barcelona");
  const [arrivalTime, setArrivalTime] = useState("08:00");
  const [allAboardTime, setAllAboardTime] = useState("17:00");
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const arrivalRef = useRef<HTMLInputElement>(null);

  const portName = useMemo(() => portsRegistry[portSlug]?.name ?? "Port", [portSlug]);

  return (
    <>
      <div className={`grid gap-2 ${compact ? "grid-cols-1" : "md:grid-cols-[1.7fr_1fr_1fr_auto]"}`}>
        <PortCombobox value={portSlug} onChange={setPortSlug} autoFocus={autoFocus} onSelectComplete={() => arrivalRef.current?.focus()} />
        <input ref={arrivalRef} type="time" className="rounded-lg bg-slate-800 px-3 py-2 text-sm" value={arrivalTime} onChange={(e) => setArrivalTime(e.target.value)} />
        <input type="time" className="rounded-lg bg-slate-800 px-3 py-2 text-sm" value={allAboardTime} onChange={(e) => setAllAboardTime(e.target.value)} />
        <button onClick={() => onAdd({ portSlug, portName, arrivalTime, allAboardTime })} className="rounded-lg bg-cyan-400 px-3 py-2 text-sm font-semibold text-slate-900">
          + Add day
        </button>
      </div>
      <button type="button" onClick={() => setShowPasteModal(true)} className="mt-2 rounded-lg bg-slate-800 px-3 py-1.5 text-xs hover:bg-slate-700">
        Paste itinerary
      </button>
      {showPasteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 p-4" onClick={() => setShowPasteModal(false)}>
          <div className="mx-auto mt-16 max-w-xl rounded-xl border border-white/10 bg-slate-900 p-4" onClick={(event) => event.stopPropagation()}>
            <p className="text-sm font-semibold">Paste itinerary</p>
            <p className="mt-1 text-xs text-slate-400">One port per line, e.g. &quot;Barcelona&quot;, &quot;Marseille&quot;, &quot;Naples&quot;.</p>
            <textarea value={pasteText} onChange={(event) => setPasteText(event.target.value)} rows={8} className="mt-3 w-full rounded-lg bg-slate-800 p-2 text-sm" />
            <div className="mt-3 flex justify-end gap-2">
              <button className="rounded-lg bg-slate-800 px-3 py-2 text-xs" onClick={() => setShowPasteModal(false)}>Cancel</button>
              <button
                className="rounded-lg bg-cyan-400 px-3 py-2 text-xs font-semibold text-slate-900"
                onClick={() => {
                  const parsed = parseItinerary(pasteText);
                  parsed.forEach((row) => onAdd({ portSlug: row.slug, portName: row.name, arrivalTime: "08:00", allAboardTime: "17:00" }));
                  setShowPasteModal(false);
                  setPasteText("");
                }}
              >
                Add parsed days
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
