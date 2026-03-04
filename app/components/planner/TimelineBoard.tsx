"use client";

import { useMemo, useState } from "react";
import type { PlanBlock } from "@/app/lib/planner/types";
import { toMinutes } from "./timelineUtils";

const move = <T,>(items: T[], from: number, to: number) => {
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
};

const draftBlock = (type: PlanBlock["type"]): PlanBlock => ({
  id: `draft-${Date.now()}`,
  title: type === "stop" ? "New stop" : type === "transfer" ? "Transfer leg" : "Safety buffer",
  type,
  startTime: "09:00",
  endTime: "09:30",
  durationMin: 30,
  costEUR: 0,
  transitMode: "walk",
  whyThisHere: "User-added draft block.",
  guidance: "Edit details inline.",
  runningLateDecision: "Skip optional segments.",
  lock: false,
});

export default function TimelineBoard({ blocks, dayStart, dayEnd, onChange, onSelectBlock }: { blocks: PlanBlock[]; dayStart: string; dayEnd: string; onChange: (next: PlanBlock[]) => void; onSelectBlock?: (block?: PlanBlock) => void }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [focusMode, setFocusMode] = useState(true);

  const sorted = useMemo(() => [...blocks].sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime)), [blocks]);

  const update = (id: string, updater: (block: PlanBlock) => PlanBlock) => onChange(sorted.map((block) => (block.id === id ? updater(block) : block)));

  return (
    <section className="space-y-3 rounded-2xl border border-white/10 bg-slate-900/60 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
        <p>{dayStart} → {dayEnd}</p>
        <div className="flex items-center gap-2">
          <button onClick={() => onChange([...sorted, draftBlock("stop")])} className="rounded-lg bg-slate-800 px-2 py-1 hover:bg-slate-700">+ Add stop</button>
          <button onClick={() => setFocusMode((prev) => !prev)} className="rounded-lg bg-slate-800 px-2 py-1 hover:bg-slate-700">Focus mode: {focusMode ? "On" : "Off"}</button>
        </div>
      </div>

      <div className="space-y-2">
        {sorted.map((block, index) => (
          <div key={block.id}>
            {!focusMode && index > 0 && <div className="mb-2 ml-4 border-l border-dashed border-cyan-400/50 pl-4 text-[11px] text-cyan-100">Route leg · {sorted[index - 1].transitMode || "walk"} → {block.transitMode || "walk"}</div>}
            <article
              draggable
              onDragStart={() => setDraggingId(block.id)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => {
                if (!draggingId || draggingId === block.id) return;
                const from = sorted.findIndex((item) => item.id === draggingId);
                const to = sorted.findIndex((item) => item.id === block.id);
                onChange(move(sorted, from, to));
                setDraggingId(null);
              }}
              className="rounded-xl border border-white/10 bg-slate-950/70 p-3 shadow-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <button
                  className="text-left"
                  onClick={() => {
                    const next = expandedId === block.id ? null : block.id;
                    setExpandedId(next);
                    onSelectBlock?.(next ? block : undefined);
                  }}
                >
                  <p className="text-sm font-semibold">{block.title}</p>
                  <p className="text-xs text-slate-400">{block.startTime} - {block.endTime} · {block.durationMin}m · €{block.costEUR} · {block.transitMode}</p>
                </button>
                <div className="flex items-center gap-2">
                  <button className="rounded bg-slate-800 px-2 py-1 text-xs" onClick={() => update(block.id, (draft) => ({ ...draft, type: draft.type === "transfer" ? "stop" : "transfer" }))}>Convert</button>
                  <button className={`rounded px-2 py-1 text-xs ${block.lock ? "bg-cyan-400 text-slate-900" : "bg-slate-800"}`} onClick={() => update(block.id, (draft) => ({ ...draft, lock: !draft.lock }))}>{block.lock ? "Locked / Must-do" : "Lock"}</button>
                </div>
              </div>

              {expandedId === block.id && (
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  <label className="text-xs text-slate-300">Title<input value={block.title} onChange={(event) => update(block.id, (draft) => ({ ...draft, title: event.target.value }))} className="mt-1 w-full rounded bg-slate-800 p-2" /></label>
                  <label className="text-xs text-slate-300">Duration<input type="number" min={10} value={block.durationMin} onChange={(event) => update(block.id, (draft) => ({ ...draft, durationMin: Number(event.target.value) }))} className="mt-1 w-full rounded bg-slate-800 p-2" /></label>
                  <label className="text-xs text-slate-300">Transit mode<select value={block.transitMode} onChange={(event) => update(block.id, (draft) => ({ ...draft, transitMode: event.target.value }))} className="mt-1 w-full rounded bg-slate-800 p-2"><option>walk</option><option>taxi</option><option>bus</option><option>metro</option><option>tram</option></select></label>
                  <label className="text-xs text-slate-300">Cost (EUR)<input type="number" min={0} value={block.costEUR} onChange={(event) => update(block.id, (draft) => ({ ...draft, costEUR: Number(event.target.value) }))} className="mt-1 w-full rounded bg-slate-800 p-2" /></label>
                  <label className="text-xs text-slate-300 md:col-span-2">Notes<input value={block.guidance} onChange={(event) => update(block.id, (draft) => ({ ...draft, guidance: event.target.value }))} className="mt-1 w-full rounded bg-slate-800 p-2" /></label>
                </div>
              )}
            </article>
          </div>
        ))}
      </div>
    </section>
  );
}
