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
  const [showAddMenu, setShowAddMenu] = useState(false);

  const sorted = useMemo(() => [...blocks].sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime)), [blocks]);

  const update = (id: string, updater: (block: PlanBlock) => PlanBlock) => onChange(sorted.map((block) => (block.id === id ? updater(block) : block)));

  return (
    <section className="relative rounded-[24px] border border-white/10 bg-[#0D1526] p-6">
      <div className="mb-5 rounded-2xl border border-white/10 bg-slate-900/50 p-4 text-sm text-slate-300">
        <p className="text-[13px] uppercase tracking-[0.14em] text-cyan-200/80">Day Board</p>
        <p className="mt-1 text-base font-semibold text-slate-100">{dayStart} → {dayEnd}</p>
      </div>

      <div className="relative pl-6">
        <div className="absolute bottom-0 left-1.5 top-0 w-px bg-gradient-to-b from-cyan-300/50 via-cyan-300/20 to-transparent" />
        <div className="space-y-4">
          {sorted.map((block) => (
            <div
              key={block.id}
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
            >
              <PlanCard
                block={block}
                selected={expandedId === block.id}
                expanded={expandedId === block.id}
                onExpand={() => {
                  const next = expandedId === block.id ? null : block.id;
                  setExpandedId(next);
                  onSelectBlock?.(next ? block : undefined);
                }}
                onLock={() => update(block.id, (draft) => ({ ...draft, lock: !draft.lock }))}
                onConvert={() => update(block.id, (draft) => ({ ...draft, type: draft.type === "transfer" ? "stop" : "transfer" }))}
                onUpdate={(next) => update(block.id, (draft) => ({ ...draft, ...next }))}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-6 right-6">
        <button onClick={() => setShowAddMenu((prev) => !prev)} className="rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-900 shadow-[0_16px_34px_rgba(34,211,238,0.28)]">+ Add stop</button>
        {showAddMenu && (
          <div className="absolute bottom-14 right-0 w-44 rounded-2xl border border-white/10 bg-slate-900 p-2 text-xs">
            <button onClick={() => { onChange([...sorted, draftBlock("stop")]); setShowAddMenu(false); }} className="block w-full rounded-xl px-2 py-2 text-left hover:bg-white/10">Attraction / Food</button>
            <button onClick={() => { onChange([...sorted, draftBlock("transfer")]); setShowAddMenu(false); }} className="block w-full rounded-xl px-2 py-2 text-left hover:bg-white/10">Transfer</button>
            <button onClick={() => { onChange([...sorted, draftBlock("buffer")]); setShowAddMenu(false); }} className="block w-full rounded-xl px-2 py-2 text-left hover:bg-white/10">Buffer</button>
          </div>
        )}
      </div>
    </section>
  );
}
