"use client";

import { useState } from "react";
import AgentChat from "@/app/components/planner/AgentChat";
import ConciergeBrief from "@/app/components/planner/ConciergeBrief";
import PlanBuilder from "@/app/components/planner/PlanBuilder";
import PlannerHeader from "@/app/components/planner/PlannerHeader";
import PlanQualityPanel from "@/app/components/planner/PlanQualityPanel";
import SimulationDrawer from "@/app/components/planner/SimulationDrawer";
import Tabs, { type Tab } from "@/app/components/planner/Tabs";
import TimelineBoard from "@/app/components/planner/TimelineBoard";
import { buildAgentResponse, generatePlan, optimizePlan, simulatePlan } from "@/app/lib/planner/engine";
import { portsRegistry } from "@/app/data/ports";
import type { PlanBlock, PlanInput, PlanOutput } from "@/app/lib/planner/types";

const defaultInput: PlanInput = {
  portSlug: "barcelona",
  onboardTime: "08:30",
  allAboardTime: "16:30",
  mustReturnBufferMin: 60,
  walkingLevel: "moderate",
  pace: "normal",
  mode: "balanced",
  interests: ["food", "culture", "views"],
  budgetSensitivity: "medium",
  mustDoStops: [],
  riskTolerance: "balanced",
  avoidCrowds: false,
};

export default function ChatPage() {
  const [input, setInput] = useState<PlanInput>(defaultInput);
  const [output, setOutput] = useState<PlanOutput | null>(null);
  const [tab, setTab] = useState<Tab>("timeline");
  const [toast, setToast] = useState("");
  const [simOpen, setSimOpen] = useState(false);

  const runGenerate = () => {
    const next = generatePlan(input);
    setOutput(next);
    setToast("Plan generated.");
    setTab("timeline");
    setTimeout(() => setToast(""), 1600);
  };

  const updateBlocks = (updater: (blocks: PlanBlock[]) => PlanBlock[]) => {
    if (!output) return;
    const nextPlan = { ...output.plan, blocks: updater(output.plan.blocks) };
    const port = portsRegistry[nextPlan.input.portSlug] ?? portsRegistry.barcelona;
    const score = simulatePlan(nextPlan, port, nextPlan.input);
    setOutput({ ...output, plan: nextPlan, score });
  };

  const onEdit = (id: string, field: keyof PlanBlock, value: string | number | boolean) => {
    updateBlocks((blocks) => blocks.map((block) => (block.id === id ? { ...block, [field]: value } : block)));
  };

  const onMove = (from: number, to: number) => {
    if (!output || from === to || to < 0 || to >= output.plan.blocks.length) return;
    updateBlocks((blocks) => {
      const next = [...blocks];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <PlannerHeader
        hasPlan={!!output}
        onPrimary={runGenerate}
        onAction={(action) => {
          if (action === "simulate") setSimOpen(true);
          else setToast(`${action} action queued`);
          setTimeout(() => setToast(""), 1400);
        }}
      />

      <div className="mx-auto max-w-6xl px-2 pb-24 pt-3 sm:px-4">
        <PlanBuilder input={input} setInput={setInput} onGenerate={runGenerate} />
        {toast && <div className="mt-2 rounded-lg bg-cyan-400 px-3 py-2 text-xs font-semibold text-slate-900">{toast}</div>}

        <Tabs active={tab} setActive={setTab} />

        {output && (
          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_320px]">
            <section className="space-y-4 min-w-0">
              {tab === "timeline" && <TimelineBoard blocks={output.plan.blocks} onEdit={onEdit} onMove={onMove} />}
              {tab === "map" && <div className="rounded-xl border border-white/10 bg-slate-900/70 p-4 text-sm">Route: {output.plan.blocks.map((block) => block.title).join(" → ")}</div>}
              {tab === "budget" && <div className="rounded-xl border border-white/10 bg-slate-900/70 p-4 text-sm">Estimated spend: €{output.plan.blocks.reduce((sum, block) => sum + block.costEUR, 0)}.</div>}
              {tab === "risk" && (
                <div className="rounded-xl border border-white/10 bg-slate-900/70 p-4 text-sm">
                  <p className="font-medium">Violation checks</p>
                  <ul className="mt-2 list-disc pl-5 text-slate-300">{output.score.violations.length ? output.score.violations.map((issue) => <li key={issue}>{issue}</li>) : <li>No critical violation detected.</li>}</ul>
                </div>
              )}
              {tab === "chat" && <AgentChat onAsk={(question) => buildAgentResponse(output, question)} />}
              <ConciergeBrief output={output} />
            </section>
            <section className="space-y-3 min-w-0">
              <PlanQualityPanel output={output} onApplyRecommendation={(recommendation) => setOutput((prev) => {
                if (!prev) return prev;
                const optimized = optimizePlan(prev.plan, { action: recommendation }, portsRegistry[prev.plan.input.portSlug]);
                return { ...prev, plan: { input: optimized.input, blocks: optimized.blocks, assumptions: optimized.assumptions }, score: optimized.score };
              })} />
            </section>
          </div>
        )}
      </div>

      <SimulationDrawer
        open={simOpen}
        onClose={() => setSimOpen(false)}
        onRun={(scenario) => {
          if (!output) return;
          const delta = scenario === "disembark" ? 15 : scenario === "traffic" ? 10 : scenario === "tender" ? 20 : 12;
          const shifted = optimizePlan(output.plan, { action: "trim-far-stop" }, portsRegistry[output.plan.input.portSlug]);
          const note = `Scenario applied: ${scenario}. Delays modeled at +${delta}m with protective trim.`;
          const score = simulatePlan(shifted, portsRegistry[output.plan.input.portSlug], output.plan.input);
          setOutput({ ...output, plan: shifted, score, narrative: `${output.narrative} ${note}` });
          setSimOpen(false);
          setToast(note);
          setTimeout(() => setToast(""), 2200);
        }}
      />
    </main>
  );
}
