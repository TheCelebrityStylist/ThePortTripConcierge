"use client";

import { useState } from "react";

export default function RecoveryModeDrawer({ open, onClose, onApply }: { open: boolean; onClose: () => void; onApply: (minutes: 10 | 20 | 30 | 45) => void }) {
  const [minutes, setMinutes] = useState<10 | 20 | 30 | 45>(20);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/60 p-4" onClick={onClose}>
      <div className="mx-auto mt-20 max-w-md rounded-3xl border border-white/10 bg-[#0D1526] p-5" onClick={(event) => event.stopPropagation()}>
        <p className="text-lg font-semibold">Recovery mode</p>
        <p className="mt-1 text-sm text-slate-300">How far behind are you right now?</p>
        <div className="mt-4 grid grid-cols-4 gap-2">
          {[10, 20, 30, 45].map((value) => (
            <button key={value} onClick={() => setMinutes(value as 10 | 20 | 30 | 45)} className={`rounded-xl px-2 py-2 text-sm ${minutes === value ? "bg-cyan-400 text-slate-900" : "bg-slate-900 text-slate-200"}`}>
              +{value}m
            </button>
          ))}
        </div>
        <div className="mt-5 space-y-1 text-xs text-slate-300">
          <p>• Keep must-not-miss highlight</p>
          <p>• Trim lowest-value outer leg</p>
          <p>• Restore return-safe buffer first</p>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-xl bg-slate-900 px-3 py-2 text-sm">Cancel</button>
          <button onClick={() => { onApply(minutes); onClose(); }} className="rounded-xl bg-cyan-400 px-3 py-2 text-sm font-semibold text-slate-900">Apply recovery</button>
        </div>
      </div>
    </div>
  );
}
