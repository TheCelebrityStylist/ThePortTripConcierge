"use client";

import { useMemo, useState } from "react";
import AgentChat from "@/app/components/planner/AgentChat";
import ConciergeBrief from "@/app/components/planner/ConciergeBrief";
import PlanBuilder from "@/app/components/planner/PlanBuilder";
import PlannerHeader from "@/app/components/planner/PlannerHeader";
import PlanQualityPanel from "@/app/components/planner/PlanQualityPanel";
import SimulationDrawer from "@/app/components/planner/SimulationDrawer";
import Tabs, { type Tab } from "@/app/components/planner/Tabs";
import TimelineBoard from "@/app/components/planner/TimelineBoard";
import { applyFixAction, applySimulation, chatReply, computeRiskBreakdown, conciergeBrief, generatePlan, regenerateTimeline } from "@/app/lib/planner/engine";
import type { BriefState, Plan, PlannedStop } from "@/app/lib/planner/types";

const defaultBrief: BriefState = {
  portSlug: "barcelona",
  onboardTime: "08:30",
  allAboardTime: "16:30",
  targetBufferMin: 60,
  walkingLevel: "moderate",
  interests: ["food", "culture", "views"],
  pace: "normal",
  mode: "balanced",
};

export default function ChatPage() {
  const [brief, setBrief] = useState<BriefState>(defaultBrief);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [tab, setTab] = useState<Tab>("timeline");
  const [toast, setToast] = useState("");
  const [simOpen, setSimOpen] = useState(false);

  const risk = useMemo(() => (plan ? computeRiskBreakdown(plan) : null), [plan]);
  const concierge = useMemo(() => (plan && risk ? conciergeBrief(plan, risk) : null), [plan, risk]);

  const runGenerate = () => {
    const next = generatePlan(brief);
    setPlan(next);
    setTab("timeline");
    setToast("Plan generated");
    setTimeout(() => setToast(""), 1800);
  };

  const updateStops = (updater: (stops: PlannedStop[]) => PlannedStop[]) => {
    if (!plan) return;
    setPlan(regenerateTimeline({ ...plan, stops: updater(plan.stops) }));
  };

  const onEdit = (id: string, field: keyof PlannedStop, value: string | number | boolean) => {
    updateStops((stops) => stops.map((stop) => (stop.id === id ? { ...stop, [field]: value } as PlannedStop : stop)));
  };

  const onMove = (from: number, to: number) => {
    if (!plan || from === to || to < 0 || to >= plan.stops.length) return;
    updateStops((stops) => {
      const arr = [...stops];
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      return arr;
    });
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <PlannerHeader
        hasPlan={!!plan}
        onPrimary={runGenerate}
        onAction={(key) => {
          if (key === "save") setToast("Saved locally");
          if (key === "export") setToast("Export started");
          if (key === "duplicate") setToast("Plan duplicated");
          if (key === "share") setToast("Share link copied");
          setTimeout(() => setToast(""), 1300);
        }}
      />

      <div className="mx-auto max-w-6xl px-2 pb-24 pt-3 sm:px-4">
        <PlanBuilder brief={brief} setBrief={setBrief} onGenerate={runGenerate} />
        {toast && <div className="mt-2 rounded-lg bg-cyan-400 px-3 py-2 text-xs font-semibold text-slate-900">{toast}</div>}

        <Tabs active={tab} setActive={setTab} />

        {plan && risk && concierge && (
          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_320px]">
            <section className="min-w-0 space-y-4">
              {tab === "timeline" && <TimelineBoard stops={plan.stops} onEdit={onEdit} onMove={onMove} />}
              {tab === "map" && <div className="rounded-xl border border-white/10 bg-slate-900/70 p-4 text-sm">Route flow: {plan.stops.map((stop) => stop.title).join(" → ")}</div>}
              {tab === "budget" && <div className="rounded-xl border border-white/10 bg-slate-900/70 p-4 text-sm">Total estimate: €{plan.stops.reduce((sum, stop) => sum + stop.costEUR, 0)} · walking {plan.stops.reduce((sum, stop) => sum + stop.walkMin, 0)} min.</div>}
              {tab === "risk" && (
                <div className="rounded-xl border border-white/10 bg-slate-900/70 p-4 text-sm">
                  <p className="font-medium">Smart warnings</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-300">
                    {risk.items.filter((item) => item.score < 75).map((item) => <li key={item.key}>{item.label}: {item.why}</li>)}
                  </ul>
                  <button onClick={() => setSimOpen(true)} className="mt-3 rounded bg-cyan-400 px-3 py-2 text-xs font-semibold text-slate-900">Simulate</button>
                </div>
              )}
              {tab === "chat" && <AgentChat onAsk={(message) => (plan && risk ? chatReply(plan, risk, message) : "Generate a plan first.")} />}
              <ConciergeBrief data={concierge} />
            </section>

            <section className="min-w-0 space-y-3">
              <PlanQualityPanel risk={risk} onFix={(action) => plan && setPlan(applyFixAction(plan, action))} />
              <button onClick={() => setSimOpen(true)} className="w-full rounded-lg bg-slate-800 px-3 py-2 text-sm">Open simulation</button>
            </section>
          </div>
        )}
      </div>

      <SimulationDrawer
        open={simOpen}
        onClose={() => setSimOpen(false)}
        onRun={(scenario) => {
          if (!plan) return;
          const output = applySimulation(plan, scenario);
          setPlan(output.plan);
          setToast(`Simulation applied. Suggested fix: ${output.suggestion.fixLabel}`);
          setSimOpen(false);
          setTimeout(() => setToast(""), 2400);
        }}
      />
    </main>
  );
}
