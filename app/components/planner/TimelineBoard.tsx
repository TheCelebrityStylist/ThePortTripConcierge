"use client";

import { useMemo, useState } from "react";
import type { PlanBlock } from "@/app/lib/planner/types";
import { toMinutes } from "./timelineUtils";
import PlanCard from "./PlanCard";

const move = <T,>(items: T[], from: number, to: number) => {
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
};

const draftBlock = (type: PlanBlock["type"]): PlanBlock => ({ id: `draft-${Date.now()}`, title: type === "stop" ? "New stop" : type === "transfer" ? "Transfer leg" : "Safety buffer", type, startTime: "09:00", endTime: "09:30", durationMin: 30, costEUR: 0, transitMode: "walk", whyThisHere: "User-added draft block.", guidance: "Edit details inline.", runningLateDecision: "Skip optional segments.", lock: false });

export default function TimelineBoard({ blocks, dayStart, dayEnd, onChange, onSelectBlock }: { blocks: PlanBlock[]; dayStart: string; dayEnd: string; onChange: (next: PlanBlock[]) => void; onSelectBlock?: (block?: PlanBlock) => void }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const sorted = useMemo(() => [...blocks].sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime)), [blocks]);
  const totalDuration = Math.max(sorted.reduce((sum, block) => sum + block.durationMin, 0), 1);

  const update = (id: string, updater: (block: PlanBlock) => PlanBlock) => onChange(sorted.map((block) => (block.id === id ? updater(block) : block)));

  return (
    <section className="relative rounded-[24px] border border-white/10 bg-[#0D1526] p-6">
      <div className="mb-4 rounded-2xl border border-white/10 bg-slate-900/50 p-4">
        <p className="text-sm font-semibold text-cyan-100">Journey Canvas</p>
        <p className="text-xs text-slate-400">{dayStart} → {dayEnd}</p>
        <div className="mt-3 flex overflow-x-auto rounded-xl bg-slate-950/60 p-1">
          {sorted.map((block) => (
            <button key={`seg-${block.id}`} onClick={() => { setExpandedId(block.id); onSelectBlock?.(block); }} className={`h-12 min-w-[72px] rounded-lg px-2 text-left text-[10px] ${expandedId === block.id ? "bg-cyan-400/30" : block.type === "buffer" ? "bg-emerald-500/20" : block.type === "transfer" ? "bg-violet-500/20" : "bg-slate-700/60"}`} style={{ width: `${Math.max((block.durationMin / totalDuration) * 100, 8)}%` }}>
              <p className="truncate font-semibold">{block.title}</p>
              <p>{block.startTime}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {sorted.map((block) => (
          <div key={block.id} draggable onDragStart={() => setDraggingId(block.id)} onDragOver={(event) => event.preventDefault()} onDrop={() => {
            if (!draggingId || draggingId === block.id) return;
            const from = sorted.findIndex((item) => item.id === draggingId);
            const to = sorted.findIndex((item) => item.id === block.id);
            onChange(move(sorted, from, to));
            setDraggingId(null);
          }}>
            <PlanCard block={block} selected={expandedId === block.id} expanded={expandedId === block.id} onExpand={() => { const next = expandedId === block.id ? null : block.id; setExpandedId(next); onSelectBlock?.(next ? block : undefined); }} onLock={() => update(block.id, (draft) => ({ ...draft, lock: !draft.lock }))} onConvert={() => update(block.id, (draft) => ({ ...draft, type: draft.type === "transfer" ? "stop" : "transfer" }))} onUpdate={(next) => update(block.id, (draft) => ({ ...draft, ...next }))} />
          </div>
        ))}
      </div>

      <div className="absolute bottom-6 right-6">
        <button onClick={() => setShowAddMenu((prev) => !prev)} className="rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-900">+ Add stop</button>
        {showAddMenu && <div className="absolute bottom-14 right-0 w-44 rounded-2xl border border-white/10 bg-slate-900 p-2 text-xs">
          <button onClick={() => { onChange([...sorted, draftBlock("stop")]); setShowAddMenu(false); }} className="block w-full rounded-xl px-2 py-2 text-left hover:bg-white/10">Attraction / Food</button>
          <button onClick={() => { onChange([...sorted, draftBlock("transfer")]); setShowAddMenu(false); }} className="block w-full rounded-xl px-2 py-2 text-left hover:bg-white/10">Transfer</button>
          <button onClick={() => { onChange([...sorted, draftBlock("buffer")]); setShowAddMenu(false); }} className="block w-full rounded-xl px-2 py-2 text-left hover:bg-white/10">Buffer</button>
        </div>}
      </div>
    </section>
  );
}
