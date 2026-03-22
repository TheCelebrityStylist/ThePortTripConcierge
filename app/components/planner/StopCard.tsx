"use client";

import type { PlanBlock } from "@/app/lib/planner/types";

type Props = {
  block: PlanBlock;
  index: number;
  onEdit: (id: string, field: keyof PlanBlock, value: string | number | boolean) => void;
  onMove: (from: number, to: number) => void;
};

export default function StopCard({ block, index, onEdit, onMove }: Props) {
  return (
    <article
      data-timeline-item={index}
      draggable
      onDragStart={(event) => event.dataTransfer.setData("text/plain", String(index))}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        const from = Number(event.dataTransfer.getData("text/plain"));
        onMove(from, index);
      }}
      className="group rounded-2xl bg-slate-900/70 p-4 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-950/40"
    >
      <details open>
        <summary className="list-none cursor-pointer">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-base font-semibold">{block.title}</p>
              <p className="mt-1 text-xs text-slate-400">{block.startTime}–{block.endTime} · {block.type} · {block.transitMode}</p>
            </div>
            <button className="rounded bg-slate-800 px-2 py-1 text-[11px] opacity-0 transition group-hover:opacity-100">Edit</button>
          </div>
        </summary>

        <div className="mt-3 space-y-2 border-t border-white/5 pt-3">
          <input className="w-full rounded-xl bg-slate-800 px-3 py-2 text-sm" value={block.title} onChange={(e) => onEdit(block.id, "title", e.target.value)} />
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="text-xs text-slate-300">Duration<input className="mt-1 w-full rounded-xl bg-slate-800 px-3 py-2 text-sm" type="number" value={block.durationMin} onChange={(e) => onEdit(block.id, "durationMin", Number(e.target.value))} /></label>
            <label className="text-xs text-slate-300">Cost €<input className="mt-1 w-full rounded-xl bg-slate-800 px-3 py-2 text-sm" type="number" value={block.costEUR} onChange={(e) => onEdit(block.id, "costEUR", Number(e.target.value))} /></label>
          </div>
          <textarea className="w-full rounded-xl bg-slate-800 px-3 py-2 text-sm" rows={3} value={block.guidance} onChange={(e) => onEdit(block.id, "guidance", e.target.value)} />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={block.lock} onChange={(e) => onEdit(block.id, "lock", e.target.checked)} /> must-do lock</label>
            <div className="flex gap-2">
              <button onClick={() => onMove(index, Math.max(0, index - 1))} className="rounded bg-slate-800 px-2 py-1 text-xs">↑</button>
              <button onClick={() => onMove(index, index + 1)} className="rounded bg-slate-800 px-2 py-1 text-xs">↓</button>
            </div>
          </div>
        </div>
      </details>
    </article>
  );
}
