"use client";

import { plannerPorts } from "@/app/data/ports";
import type { Brief, PlanMeta } from "@/app/lib/planner/types";

type Props = {
  open: boolean;
  hasPlan: boolean;
  meta: PlanMeta;
  brief: Brief;
  error?: string;
  onClose: () => void;
  onSkip: () => void;
  setMeta: (meta: PlanMeta) => void;
  setBrief: (brief: Brief) => void;
  onGenerate: () => void;
};

const interests = ["Food", "Old Town", "Views", "Museums", "Beaches", "Shopping", "Hidden gems"];

export default function TripBriefModal({ open, hasPlan, meta, brief, error, onClose, onSkip, setMeta, setBrief, onGenerate }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 p-3 sm:p-6">
      <div className="mx-auto flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900">
        <div className="border-b border-white/10 px-4 py-4 sm:px-6">
          <p className="text-xs uppercase tracking-wide text-cyan-300">Trip Brief</p>
          <h2 className="text-xl font-semibold">Tell us your ship constraints + your vibe.</h2>
          <p className="mt-1 text-sm text-slate-300">We’ll turn this into a return-safe port day in about a minute.</p>
          {hasPlan && <p className="mt-2 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-200">Regenerating updates unlocked stops while preserving your locked items.</p>}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          <details open className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
            <summary className="cursor-pointer font-medium">Ship timing</summary>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="text-sm">Port
                <select className="mt-1 w-full rounded-lg bg-slate-800 p-2" value={meta.portSlug} onChange={(e) => {
                  const port = plannerPorts[e.target.value];
                  setMeta({ ...meta, portSlug: e.target.value, tenderDock: port.dockTypeDefault, returnBufferMin: port.recommendedBufferMin[meta.riskTolerance] });
                }}>
                  {Object.keys(plannerPorts).map((port) => <option key={port} value={port}>{port}</option>)}
                </select>
              </label>
              <label className="text-sm">All aboard <span className="text-rose-300">*</span>
                <input className="mt-1 w-full rounded-lg bg-slate-800 p-2" type="time" value={meta.allAboardTime} onChange={(e) => setMeta({ ...meta, allAboardTime: e.target.value })} />
              </label>
              <label className="text-sm">First off (optional)
                <input className="mt-1 w-full rounded-lg bg-slate-800 p-2" type="time" value={meta.disembarkTime} onChange={(e) => setMeta({ ...meta, disembarkTime: e.target.value })} />
              </label>
              <label className="text-sm">Docking mode
                <select className="mt-1 w-full rounded-lg bg-slate-800 p-2" value={meta.tenderDock} onChange={(e) => setMeta({ ...meta, tenderDock: e.target.value as PlanMeta["tenderDock"] })}><option value="dock">dock</option><option value="tender">tender</option></select>
              </label>
              <label className="text-sm sm:col-span-2">Desired return buffer: <span className="font-semibold">{meta.returnBufferMin} min</span>
                <input type="range" min={30} max={120} step={5} value={meta.returnBufferMin} onChange={(e) => setMeta({ ...meta, returnBufferMin: Number(e.target.value) })} className="mt-2 w-full" />
              </label>
            </div>
          </details>

          <details open className="mt-3 rounded-xl border border-white/10 bg-slate-950/40 p-3">
            <summary className="cursor-pointer font-medium">Preferences</summary>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="text-sm">Pace<select className="mt-1 w-full rounded-lg bg-slate-800 p-2" value={meta.pace} onChange={(e) => setMeta({ ...meta, pace: e.target.value as PlanMeta["pace"] })}><option>relaxed</option><option>balanced</option><option>fast</option></select></label>
              <label className="text-sm">Mobility<select className="mt-1 w-full rounded-lg bg-slate-800 p-2" value={meta.mobility} onChange={(e) => setMeta({ ...meta, mobility: e.target.value as PlanMeta["mobility"] })}><option value="limited">Minimal</option><option value="moderate">Moderate</option><option value="high">Active</option></select></label>
              <label className="text-sm">Budget<select className="mt-1 w-full rounded-lg bg-slate-800 p-2" value={meta.budgetLevel} onChange={(e) => setMeta({ ...meta, budgetLevel: e.target.value as PlanMeta["budgetLevel"] })}><option value="low">Low</option><option value="med">Medium</option><option value="high">High</option></select></label>
            </div>
            <p className="mt-3 text-sm">Interests</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {interests.map((interest) => {
                const active = meta.interests.includes(interest);
                return <button key={interest} type="button" onClick={() => setMeta({ ...meta, interests: active ? meta.interests.filter((v) => v !== interest) : [...meta.interests, interest] })} className={`rounded-full px-3 py-1 text-xs ${active ? "bg-cyan-400 text-slate-900" : "bg-slate-800 text-slate-200"}`}>{interest}</button>;
              })}
            </div>
          </details>

          <details className="mt-3 rounded-xl border border-white/10 bg-slate-950/40 p-3">
            <summary className="cursor-pointer font-medium">Must-dos / Must-avoid</summary>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="text-sm">Must-do<input className="mt-1 w-full rounded-lg bg-slate-800 p-2" value={brief.mustDo} onChange={(e) => setBrief({ ...brief, mustDo: e.target.value })} /></label>
              <label className="text-sm">Avoid<input className="mt-1 w-full rounded-lg bg-slate-800 p-2" value={brief.avoid} onChange={(e) => setBrief({ ...brief, avoid: e.target.value })} /></label>
            </div>
          </details>

          <details className="mt-3 rounded-xl border border-white/10 bg-slate-950/40 p-3">
            <summary className="cursor-pointer font-medium">Party</summary>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="text-sm">Adults
                <input className="mt-1 w-full rounded-lg bg-slate-800 p-2" type="number" min={1} value={meta.adults} onChange={(e) => setMeta({ ...meta, adults: Number(e.target.value) })} />
              </label>
              <label className="flex items-center gap-2 pt-7 text-sm"><input type="checkbox" checked={meta.hasKids} onChange={(e) => setMeta({ ...meta, hasKids: e.target.checked })} /> Kids joining</label>
            </div>
          </details>

          {error && <p className="mt-3 rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</p>}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 px-4 py-3 sm:px-6">
          <button onClick={onClose} className="rounded-lg border border-white/15 px-3 py-2 text-sm">Close</button>
          <div className="flex gap-2">
            <button onClick={onSkip} disabled={!meta.portSlug} className="rounded-lg bg-slate-800 px-3 py-2 text-sm disabled:opacity-40">Skip (use defaults)</button>
            <button onClick={onGenerate} className="rounded-lg bg-cyan-400 px-3 py-2 text-sm font-semibold text-slate-900">{hasPlan ? "Regenerate using this brief" : "Generate Plan"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
