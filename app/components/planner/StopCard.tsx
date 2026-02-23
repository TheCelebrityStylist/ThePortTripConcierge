"use client";

import type { PlanCategory, PlannedStop } from "@/app/lib/planner/types";

type Props = {
  stop: PlannedStop;
  index: number;
  onEdit: (id: string, field: keyof PlannedStop, value: string | number | boolean) => void;
  onMove: (from: number, to: number) => void;
};

const categories: PlanCategory[] = ["anchor", "food", "scenic", "museum", "shopping", "beach", "transfer", "buffer"];

export default function StopCard({ stop, index, onEdit, onMove }: Props) {
  return (
    <article
      draggable
      onDragStart={(e) => e.dataTransfer.setData("text/plain", String(index))}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        const from = Number(e.dataTransfer.getData("text/plain"));
        onMove(from, index);
      }}
      className="rounded-xl border border-white/10 bg-slate-900/70 p-3"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="cursor-grab text-xs text-slate-400">⋮⋮ drag</span>
        <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={stop.locked} onChange={(e) => onEdit(stop.id, "locked", e.target.checked)} /> lock</label>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <input className="rounded bg-slate-800 p-2 text-sm" value={stop.title} onChange={(e) => onEdit(stop.id, "title", e.target.value)} />
        <select className="rounded bg-slate-800 p-2 text-sm" value={stop.category} onChange={(e) => onEdit(stop.id, "category", e.target.value)}>{categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}</select>
        <label className="text-xs text-slate-300">Duration <input type="number" className="mt-1 w-full rounded bg-slate-800 p-2 text-sm" value={stop.durationMin} onChange={(e) => onEdit(stop.id, "durationMin", Number(e.target.value))} /></label>
        <label className="text-xs text-slate-300">Cost € <input type="number" className="mt-1 w-full rounded bg-slate-800 p-2 text-sm" value={stop.costEUR} onChange={(e) => onEdit(stop.id, "costEUR", Number(e.target.value))} /></label>
      </div>
      <textarea className="mt-2 w-full rounded bg-slate-800 p-2 text-sm" rows={2} value={stop.notes} onChange={(e) => onEdit(stop.id, "notes", e.target.value)} />
      <div className="mt-2 flex gap-2">
        <button onClick={() => onMove(index, Math.max(0, index - 1))} className="rounded bg-slate-800 px-2 py-1 text-xs">↑</button>
        <button onClick={() => onMove(index, index + 1)} className="rounded bg-slate-800 px-2 py-1 text-xs">↓</button>
        <label className="ml-auto flex items-center gap-1 text-xs"><input type="checkbox" checked={stop.mustDo} onChange={(e) => onEdit(stop.id, "mustDo", e.target.checked)} /> must do</label>
      </div>
    </article>
  );
}
