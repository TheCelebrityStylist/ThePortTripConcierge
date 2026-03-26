"use client";

import { useMemo, useRef, useState } from "react";
import PortSpotlightPicker from "./PortSpotlightPicker";
import { portsRegistry } from "@/app/data/ports";

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

export default function QuickAddDayRow({ onAdd, compact = false }: Props) {
  const [portSlug, setPortSlug] = useState("barcelona");
  const [arrivalTime, setArrivalTime] = useState("08:00");
  const [allAboardTime, setAllAboardTime] = useState("17:00");
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const arrivalRef = useRef<HTMLInputElement>(null);

  const portName = useMemo(() => portsRegistry[portSlug]?.name ?? "Port", [portSlug]);

  return (
    <>
      <div className={`grid gap-2 ${compact ? "grid-cols-1" : "grid-cols-1 xl:grid-cols-[1.8fr_1fr_1fr_auto]"}`}>
        <PortSpotlightPicker value={portSlug} onChange={setPortSlug} onSelectComplete={() => arrivalRef.current?.focus()} />
        <input ref={arrivalRef} type="time" className="h-12 rounded-2xl border border-white/10 bg-slate-900/70 px-3 text-sm" value={arrivalTime} onChange={(e) => setArrivalTime(e.target.value)} />
        <input type="time" className="h-12 rounded-2xl border border-white/10 bg-slate-900/70 px-3 text-sm" value={allAboardTime} onChange={(e) => setAllAboardTime(e.target.value)} />
        <button onClick={() => onAdd({ portSlug, portName, arrivalTime, allAboardTime })} className="h-12 rounded-2xl bg-cyan-400 px-4 text-sm font-semibold text-slate-900 shadow-[0_10px_24px_rgba(34,211,238,0.2)]">
          + Add day
        </button>
      </div>
      <button type="button" onClick={() => setShowPasteModal(true)} className="mt-2 rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800">
        Paste itinerary
      </button>
      {showPasteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 p-4" onClick={() => setShowPasteModal(false)}>
          <div className="mx-auto mt-16 max-w-xl rounded-3xl border border-white/10 bg-[#0B1220] p-5" onClick={(event) => event.stopPropagation()}>
            <p className="text-sm font-semibold">Paste itinerary</p>
            <p className="mt-1 text-xs text-slate-400">One port per line, like Barcelona, Marseille, Naples.</p>
            <textarea value={pasteText} onChange={(event) => setPasteText(event.target.value)} rows={8} className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-900 p-3 text-sm" />
            <div className="mt-3 flex justify-end gap-2">
              <button className="rounded-xl bg-slate-800 px-3 py-2 text-xs" onClick={() => setShowPasteModal(false)}>Cancel</button>
              <button
                className="rounded-xl bg-cyan-400 px-3 py-2 text-xs font-semibold text-slate-900"
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
