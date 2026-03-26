"use client";

import Link from "next/link";

export default function UpgradeModal({ open, message, onClose }: { open: boolean; message: string; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/60 p-4" onClick={onClose}>
      <div className="mx-auto mt-16 max-w-2xl rounded-xl border border-white/10 bg-slate-900 p-4" onClick={(event) => event.stopPropagation()}>
        <h3 className="text-lg font-semibold">Unlock more cruise planning power</h3>
        <p className="mt-2 text-sm text-slate-300">{message}</p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-white/10 bg-slate-950/70 p-3 text-sm"><p className="font-semibold">Free</p><p className="mt-1 text-xs text-slate-400">1 day fully planned · limited co-pilot messages · preview advanced tools</p></div>
          <div className="rounded-lg border border-cyan-400/30 bg-slate-950/70 p-3 text-sm"><p className="font-semibold">Trip Pass</p><p className="mt-1 text-xs text-slate-400">One itinerary unlock · all days + export</p></div>
          <div className="rounded-lg border border-white/10 bg-slate-950/70 p-3 text-sm"><p className="font-semibold">Pro</p><p className="mt-1 text-xs text-slate-400">Unlimited cruises · advanced simulation · offline packs</p></div>
        </div>
        <div className="mt-4 grid gap-2 text-sm md:grid-cols-3">
          <button className="rounded bg-slate-800 py-2">Continue free preview</button>
          <Link href="/pricing" className="rounded bg-cyan-400 py-2 text-center font-semibold text-slate-900">See pricing</Link>
          <button onClick={onClose} className="rounded border border-white/15 py-2">Close</button>
        </div>
      </div>
    </div>
  );
}
