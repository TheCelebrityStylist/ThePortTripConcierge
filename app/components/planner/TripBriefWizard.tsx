"use client";

import { plannerPorts } from "@/app/data/ports";
import type { Brief, PlanMeta } from "@/app/lib/planner/types";

type Props = {
  open: boolean;
  meta: PlanMeta;
  brief: Brief;
  setMeta: (meta: PlanMeta) => void;
  setBrief: (brief: Brief) => void;
  onGenerate: () => void;
};

const interests = ["food", "history", "scenic views", "beaches", "museums", "shopping", "local markets", "hidden gems"];

export default function TripBriefWizard({ open, meta, brief, setMeta, setBrief, onGenerate }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 p-3 sm:p-6">
      <div className="mx-auto max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-white/10 bg-slate-900 p-4 sm:p-6">
        <h2 className="text-xl font-semibold">Trip Brief</h2>
        <p className="mt-1 text-sm text-slate-300">Personalize your cruise day before generating timelines.</p>

        <section className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm">Port
            <select className="mt-1 w-full rounded-lg bg-slate-800 p-2" value={meta.portSlug} onChange={(e) => {
              const port = e.target.value;
              setMeta({ ...meta, portSlug: port, tenderDock: plannerPorts[port]?.dockType ?? "dock" });
            }}>
              {Object.keys(plannerPorts).map((port) => <option key={port} value={port}>{port}</option>)}
            </select>
          </label>
          <label className="text-sm">All aboard
            <input className="mt-1 w-full rounded-lg bg-slate-800 p-2" type="time" value={meta.allAboardTime} onChange={(e) => setMeta({ ...meta, allAboardTime: e.target.value })} />
          </label>
          <label className="text-sm">Disembark
            <input className="mt-1 w-full rounded-lg bg-slate-800 p-2" type="time" value={meta.disembarkTime} onChange={(e) => setMeta({ ...meta, disembarkTime: e.target.value })} />
          </label>
          <label className="text-sm">Tender or dock
            <select className="mt-1 w-full rounded-lg bg-slate-800 p-2" value={meta.tenderDock} onChange={(e) => setMeta({ ...meta, tenderDock: e.target.value as "dock" | "tender" })}>
              <option value="dock">dock</option><option value="tender">tender</option>
            </select>
          </label>
          <label className="text-sm">Party size
            <input className="mt-1 w-full rounded-lg bg-slate-800 p-2" type="number" min={1} value={meta.partySize} onChange={(e) => setMeta({ ...meta, partySize: Number(e.target.value) })} />
          </label>
          <label className="text-sm">Mobility
            <select className="mt-1 w-full rounded-lg bg-slate-800 p-2" value={meta.mobility} onChange={(e) => setMeta({ ...meta, mobility: e.target.value as PlanMeta["mobility"] })}><option>limited</option><option>moderate</option><option>high</option></select>
          </label>
        </section>

        <section className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm">Pace<select className="mt-1 w-full rounded-lg bg-slate-800 p-2" value={meta.pace} onChange={(e) => setMeta({ ...meta, pace: e.target.value as PlanMeta["pace"] })}><option>relaxed</option><option>balanced</option><option>fast</option></select></label>
          <label className="text-sm">Budget<select className="mt-1 w-full rounded-lg bg-slate-800 p-2" value={meta.budgetLevel} onChange={(e) => setMeta({ ...meta, budgetLevel: e.target.value as PlanMeta["budgetLevel"] })}><option>low</option><option>med</option><option>high</option></select></label>
          <label className="text-sm">Risk tolerance<select className="mt-1 w-full rounded-lg bg-slate-800 p-2" value={meta.riskTolerance} onChange={(e) => setMeta({ ...meta, riskTolerance: e.target.value as PlanMeta["riskTolerance"] })}><option>low</option><option>med</option><option>high</option></select></label>
          <label className="text-sm">Walking limit (min)
            <input className="mt-1 w-full rounded-lg bg-slate-800 p-2" type="number" min={30} value={brief.walkingLimitMin} onChange={(e) => setBrief({ ...brief, walkingLimitMin: Number(e.target.value) })} />
          </label>
        </section>

        <section className="mt-4">
          <p className="text-sm">Interests</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {interests.map((interest) => {
              const active = meta.interests.includes(interest);
              return <button key={interest} type="button" onClick={() => setMeta({ ...meta, interests: active ? meta.interests.filter((v) => v !== interest) : [...meta.interests, interest] })} className={`rounded-full px-3 py-1 text-xs ${active ? "bg-cyan-400 text-slate-900" : "bg-slate-800 text-slate-200"}`}>{interest}</button>;
            })}
          </div>
        </section>

        <section className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm">Must-do
            <input className="mt-1 w-full rounded-lg bg-slate-800 p-2" value={brief.mustDo} onChange={(e) => setBrief({ ...brief, mustDo: e.target.value })} />
          </label>
          <label className="text-sm">Must-avoid
            <input className="mt-1 w-full rounded-lg bg-slate-800 p-2" value={brief.avoid} onChange={(e) => setBrief({ ...brief, avoid: e.target.value })} />
          </label>
        </section>

        <button onClick={onGenerate} className="mt-6 w-full rounded-xl bg-cyan-400 py-3 font-semibold text-slate-900">Generate Plan</button>
      </div>
    </div>
  );
}
