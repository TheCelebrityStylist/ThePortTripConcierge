"use client";

import type { PlanBlock } from "@/app/lib/planner/types";

type Props = {
  block?: PlanBlock;
  open: boolean;
  onClose: () => void;
  onEdit: (field: keyof PlanBlock, value: string | number | boolean) => void;
  onDelete: () => void;
};

export default function StopDrawer({ block, open, onClose, onEdit, onDelete }: Props) {
  if (!open || !block) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60" onClick={onClose}>
      <aside className="absolute right-0 top-0 h-full w-full max-w-md bg-slate-950 p-4" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold">Edit stop</p>
          <button onClick={onClose} className="rounded bg-slate-800 px-2 py-1 text-xs">Close</button>
        </div>
        <div className="space-y-2">
          <label className="text-xs text-slate-300">Title<input className="mt-1 w-full rounded bg-slate-800 p-2 text-sm" value={block.title} onChange={(e) => onEdit("title", e.target.value)} /></label>
          <label className="text-xs text-slate-300">Type<select className="mt-1 w-full rounded bg-slate-800 p-2 text-sm" value={block.type} onChange={(e) => onEdit("type", e.target.value)}><option value="stop">stop</option><option value="transfer">transfer</option><option value="buffer">buffer</option></select></label>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs text-slate-300">Start<input className="mt-1 w-full rounded bg-slate-800 p-2 text-sm" value={block.startTime} onChange={(e) => onEdit("startTime", e.target.value)} /></label>
            <label className="text-xs text-slate-300">Duration<input className="mt-1 w-full rounded bg-slate-800 p-2 text-sm" type="number" value={block.durationMin} onChange={(e) => onEdit("durationMin", Number(e.target.value))} /></label>
          </div>
          <label className="text-xs text-slate-300">Cost<input className="mt-1 w-full rounded bg-slate-800 p-2 text-sm" type="number" value={block.costEUR} onChange={(e) => onEdit("costEUR", Number(e.target.value))} /></label>
          <label className="text-xs text-slate-300">Notes<textarea className="mt-1 w-full rounded bg-slate-800 p-2 text-sm" rows={4} value={block.guidance} onChange={(e) => onEdit("guidance", e.target.value)} /></label>
          <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={block.lock} onChange={(e) => onEdit("lock", e.target.checked)} /> Lock / must-do</label>
          <button onClick={onDelete} className="w-full rounded bg-rose-500/30 py-2 text-sm">Delete stop</button>
        </div>
      </aside>
    </div>
  );
}
