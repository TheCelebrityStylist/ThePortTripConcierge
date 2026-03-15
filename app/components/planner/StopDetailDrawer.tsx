"use client";

import type { PlanBlock } from "@/app/lib/planner/types";

export default function StopDetailDrawer({
  block,
  open,
  onClose,
  onEdit,
  onDelete,
}: {
  block?: PlanBlock;
  open: boolean;
  onClose: () => void;
  onEdit: (field: keyof PlanBlock, value: string | number | boolean) => void;
  onDelete: () => void;
}) {
  if (!open || !block) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60" onClick={onClose}>
      <aside className="absolute right-0 top-0 h-full w-full max-w-lg border-l border-white/10 bg-[#0B1220] p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400">Stop details</p>
            <p className="text-lg font-semibold">{block.title}</p>
          </div>
          <button onClick={onClose} className="rounded-xl bg-slate-800 px-3 py-2 text-xs">Close</button>
        </div>

        <div className="space-y-3">
          <label className="text-xs text-slate-300">Title<input className="mt-1 w-full rounded-xl bg-slate-900 p-2 text-sm" value={block.title} onChange={(e) => onEdit("title", e.target.value)} /></label>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs text-slate-300">Start<input className="mt-1 w-full rounded-xl bg-slate-900 p-2 text-sm" value={block.startTime} onChange={(e) => onEdit("startTime", e.target.value)} /></label>
            <label className="text-xs text-slate-300">Duration<input className="mt-1 w-full rounded-xl bg-slate-900 p-2 text-sm" type="number" value={block.durationMin} onChange={(e) => onEdit("durationMin", Number(e.target.value))} /></label>
          </div>
          <label className="text-xs text-slate-300">Cost<input className="mt-1 w-full rounded-xl bg-slate-900 p-2 text-sm" type="number" value={block.costEUR} onChange={(e) => onEdit("costEUR", Number(e.target.value))} /></label>
          <label className="text-xs text-slate-300">Route note<textarea className="mt-1 w-full rounded-xl bg-slate-900 p-2 text-sm" rows={3} value={block.guidance} onChange={(e) => onEdit("guidance", e.target.value)} /></label>
          <label className="text-xs text-slate-300">Fallback logic<textarea className="mt-1 w-full rounded-xl bg-slate-900 p-2 text-sm" rows={2} value={block.runningLateDecision} onChange={(e) => onEdit("runningLateDecision", e.target.value)} /></label>
          <label className="flex items-center gap-2 text-xs text-slate-300"><input type="checkbox" checked={block.lock} onChange={(e) => onEdit("lock", e.target.checked)} /> Lock / must-do</label>
          <div className="grid grid-cols-2 gap-2 pt-2">
            <button onClick={onDelete} className="rounded-xl bg-rose-500/25 py-2 text-sm">Remove stop</button>
            <button onClick={onClose} className="rounded-xl bg-cyan-400 py-2 text-sm font-semibold text-slate-900">Done</button>
          </div>
        </div>
      </aside>
    </div>
  );
}
