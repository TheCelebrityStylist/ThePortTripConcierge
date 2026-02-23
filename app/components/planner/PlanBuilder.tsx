"use client";

import type { InterestTag, PlanInput, PlanMode } from "@/app/lib/planner/types";
import { portsRegistry } from "@/app/data/ports";

const modes: PlanMode[] = ["conservative", "balanced", "aggressive", "weather-safe", "mobility-easy"];
const interests: InterestTag[] = ["food", "culture", "views", "shopping", "beach", "history", "family"];

export default function PlanBuilder({ input, setInput, onGenerate }: { input: PlanInput; setInput: (next: PlanInput) => void; onGenerate: () => void }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/60 p-3 sm:p-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-xs text-slate-300">Port<select className="mt-1 w-full rounded bg-slate-800 p-2 text-sm" value={input.portSlug} onChange={(e) => setInput({ ...input, portSlug: e.target.value })}>{Object.values(portsRegistry).map((port) => <option key={port.slug} value={port.slug}>{port.displayName}</option>)}</select></label>
        <label className="text-xs text-slate-300">Onboard<input type="time" className="mt-1 w-full rounded bg-slate-800 p-2 text-sm" value={input.onboardTime} onChange={(e) => setInput({ ...input, onboardTime: e.target.value })} /></label>
        <label className="text-xs text-slate-300">All aboard<input type="time" className="mt-1 w-full rounded bg-slate-800 p-2 text-sm" value={input.allAboardTime} onChange={(e) => setInput({ ...input, allAboardTime: e.target.value })} /></label>
        <label className="text-xs text-slate-300">Walking<select className="mt-1 w-full rounded bg-slate-800 p-2 text-sm" value={input.walkingLevel} onChange={(e) => setInput({ ...input, walkingLevel: e.target.value as PlanInput["walkingLevel"] })}><option>minimal</option><option>moderate</option><option>active</option></select></label>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="text-xs text-slate-300">Return buffer: <span className="font-semibold text-cyan-300">{input.mustReturnBufferMin}m</span>
          <input type="range" min={30} max={120} step={5} value={input.mustReturnBufferMin} onChange={(e) => setInput({ ...input, mustReturnBufferMin: Number(e.target.value) })} className="mt-2 w-full" />
        </label>
        <label className="text-xs text-slate-300">Pace<select className="mt-1 w-full rounded bg-slate-800 p-2 text-sm" value={input.pace} onChange={(e) => setInput({ ...input, pace: e.target.value as PlanInput["pace"] })}><option>chill</option><option>normal</option><option>intense</option></select></label>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {interests.map((interest) => {
          const active = input.interests.includes(interest);
          return <button key={interest} onClick={() => setInput({ ...input, interests: active ? input.interests.filter((v) => v !== interest) : [...input.interests, interest] })} className={`rounded-full px-3 py-1 text-xs ${active ? "bg-cyan-400 text-slate-900" : "bg-slate-800"}`}>{interest}</button>;
        })}
      </div>

      <details className="mt-3 rounded-lg border border-white/10 p-3">
        <summary className="cursor-pointer text-sm font-medium">Advanced options</summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <label className="text-xs text-slate-300">Mode<select className="mt-1 w-full rounded bg-slate-800 p-2 text-sm" value={input.mode} onChange={(e) => setInput({ ...input, mode: e.target.value as PlanMode })}>{modes.map((mode) => <option key={mode} value={mode}>{mode}</option>)}</select></label>
          <label className="text-xs text-slate-300">Budget<select className="mt-1 w-full rounded bg-slate-800 p-2 text-sm" value={input.budgetSensitivity} onChange={(e) => setInput({ ...input, budgetSensitivity: e.target.value as PlanInput["budgetSensitivity"] })}><option value="low">low</option><option value="medium">medium</option><option value="high">high</option></select></label>
          <label className="text-xs text-slate-300">Risk<select className="mt-1 w-full rounded bg-slate-800 p-2 text-sm" value={input.riskTolerance} onChange={(e) => setInput({ ...input, riskTolerance: e.target.value as PlanInput["riskTolerance"] })}><option value="conservative">conservative</option><option value="balanced">balanced</option><option value="aggressive">aggressive</option></select></label>
          <label className="text-xs text-slate-300 sm:col-span-3">Must-do stops (comma separated)<input className="mt-1 w-full rounded bg-slate-800 p-2 text-sm" value={input.mustDoStops.join(", ")} onChange={(e) => setInput({ ...input, mustDoStops: e.target.value.split(",").map((v) => v.trim()).filter(Boolean) })} /></label>
          <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={input.avoidCrowds} onChange={(e) => setInput({ ...input, avoidCrowds: e.target.checked })} /> avoid crowds</label>
        </div>
      </details>

      <button onClick={onGenerate} className="mt-4 rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-900">Generate plan</button>
    </section>
  );
}
