"use client";

import type { BriefState, PlanMode } from "@/app/lib/planner/types";
import { portProfiles } from "@/app/lib/planner/ports";

const modes: PlanMode[] = ["conservative", "balanced", "aggressive", "weather-safe", "mobility-easy"];
const interests: BriefState["interests"] = ["food", "culture", "views", "shopping", "beach"];

export default function PlanBuilder({ brief, setBrief, onGenerate }: { brief: BriefState; setBrief: (next: BriefState) => void; onGenerate: () => void }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/60 p-3 sm:p-4">
      <p className="text-sm text-slate-300">Tell us your ship constraints + travel style, and we’ll build a credible port-day plan.</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-xs text-slate-300">Port<select className="mt-1 w-full rounded bg-slate-800 p-2 text-sm" value={brief.portSlug} onChange={(e) => setBrief({ ...brief, portSlug: e.target.value })}>{Object.values(portProfiles).map((port) => <option key={port.slug} value={port.slug}>{port.name}</option>)}</select></label>
        <label className="text-xs text-slate-300">Onboard time<input type="time" className="mt-1 w-full rounded bg-slate-800 p-2 text-sm" value={brief.onboardTime} onChange={(e) => setBrief({ ...brief, onboardTime: e.target.value })} /></label>
        <label className="text-xs text-slate-300">All aboard<input type="time" className="mt-1 w-full rounded bg-slate-800 p-2 text-sm" value={brief.allAboardTime} onChange={(e) => setBrief({ ...brief, allAboardTime: e.target.value })} /></label>
        <label className="text-xs text-slate-300">Walking level<select className="mt-1 w-full rounded bg-slate-800 p-2 text-sm" value={brief.walkingLevel} onChange={(e) => setBrief({ ...brief, walkingLevel: e.target.value as BriefState["walkingLevel"] })}><option value="minimal">minimal</option><option value="moderate">moderate</option><option value="active">active</option></select></label>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="text-xs text-slate-300">Must-return buffer: <span className="font-semibold text-cyan-300">{brief.targetBufferMin} min</span>
          <input type="range" min={30} max={120} step={5} className="mt-2 w-full" value={brief.targetBufferMin} onChange={(e) => setBrief({ ...brief, targetBufferMin: Number(e.target.value) })} />
        </label>
        <label className="text-xs text-slate-300">Pace<select className="mt-1 w-full rounded bg-slate-800 p-2 text-sm" value={brief.pace} onChange={(e) => setBrief({ ...brief, pace: e.target.value as BriefState["pace"] })}><option value="chill">chill</option><option value="normal">normal</option><option value="intense">intense</option></select></label>
      </div>

      <div className="mt-3">
        <p className="text-xs text-slate-300">Interests</p>
        <div className="mt-1 flex flex-wrap gap-2">
          {interests.map((interest) => {
            const active = brief.interests.includes(interest);
            return <button key={interest} onClick={() => setBrief({ ...brief, interests: active ? brief.interests.filter((v) => v !== interest) : [...brief.interests, interest] })} className={`rounded-full px-3 py-1 text-xs ${active ? "bg-cyan-400 text-slate-900" : "bg-slate-800"}`}>{interest}</button>;
          })}
        </div>
      </div>

      <div className="mt-3">
        <p className="text-xs text-slate-300">One-click plan mode</p>
        <div className="mt-1 flex flex-wrap gap-2">
          {modes.map((mode) => <button key={mode} onClick={() => setBrief({ ...brief, mode })} className={`rounded-full px-3 py-1 text-xs ${brief.mode === mode ? "bg-cyan-400 text-slate-900" : "bg-slate-800"}`}>{mode}</button>)}
        </div>
      </div>

      <button onClick={onGenerate} className="mt-4 rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-900">Generate plan</button>
    </section>
  );
}
