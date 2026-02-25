"use client";

export default function UpgradeModal({ open, message, onClose }: { open: boolean; message: string; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/60 p-4">
      <div className="mx-auto mt-20 max-w-md rounded-xl border border-white/10 bg-slate-900 p-4">
        <h3 className="text-lg font-semibold">Upgrade to unlock</h3>
        <p className="mt-2 text-sm text-slate-300">{message}</p>
        <div className="mt-4 grid gap-2 text-sm">
          <button className="rounded bg-cyan-400 py-2 font-semibold text-slate-900">Get Trip Pass</button>
          <button className="rounded bg-slate-800 py-2">Go Pro Annual</button>
          <button onClick={onClose} className="rounded border border-white/15 py-2">Close</button>
        </div>
      </div>
    </div>
  );
}
