"use client";

import { useState } from "react";

export default function RunningLateModal({ open, onClose, onApply }: { open: boolean; onClose: () => void; onApply: (mode: "safe" | "salvage", delayMin: number) => void; }) {
  const [delayMin, setDelayMin] = useState(30);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/60 p-4">
      <div className="mx-auto max-w-md rounded-xl border border-white/10 bg-slate-900 p-4">
        <h3 className="text-lg font-semibold">I&apos;m running late</h3>
        <label className="mt-3 block text-sm">Minutes behind
          <input type="number" value={delayMin} onChange={(e) => setDelayMin(Number(e.target.value))} className="mt-1 w-full rounded bg-slate-800 p-2" />
        </label>
        <div className="mt-4 grid gap-2">
          <button onClick={() => onApply("safe", delayMin)} className="rounded bg-cyan-400 py-2 text-slate-900">Safe Return Now</button>
          <button onClick={() => onApply("salvage", delayMin)} className="rounded bg-slate-700 py-2">Salvage 1 highlight</button>
          <button onClick={onClose} className="rounded border border-white/10 py-2">Cancel</button>
        </div>
      </div>
    </div>
  );
}
