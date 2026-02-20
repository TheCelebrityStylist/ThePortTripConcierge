"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { usePlanning } from "../components/PlanningProvider";
import { portProfilesLite } from "../lib/returnSafeEngine";
import { minToTime, parseCoordsFromInput, parseTimeToMin, stopTypeFromTitle } from "../lib/plannerUtils";
import type { DelayScenario, ItineraryStop, PlannerSuggestion, StopType, TripMode, WalkingLevel } from "../lib/types";

const LazyMap = dynamic(() => import("../components/planner/PlannerMapView"), { ssr: false });

type Role = "user" | "assistant";

type ChatMsg = { role: Role; content: string };

function asSuggestion(raw: Partial<PlannerSuggestion> & { title: string }): PlannerSuggestion {
  return {
    title: raw.title,
    why: raw.why || "Fits your current return-safe posture.",
    durationMin: raw.durationMin ?? 45,
    estimatedTravelImpact: raw.estimatedTravelImpact ?? "Estimated +10m transfer impact",
    costEstimate: raw.costEstimate ?? 0,
    location: raw.location ?? "Port area",
    type: raw.type ?? stopTypeFromTitle(raw.title),
    tags: raw.tags,
    priority: raw.priority ?? 3,
    notes: raw.notes,
  };
}

function fallbackSuggestions(port: string, mode: TripMode): PlannerSuggestion[] {
  const relax = mode === "relaxed";
  const aggr = mode === "aggressive";
  return [
    asSuggestion({ title: `${port} terminal transfer`, why: "Secures your outbound corridor early.", durationMin: 30, estimatedTravelImpact: "Low", costEstimate: 12, location: `${port} terminal`, type: "transport", tags: { returnCorridor: true }, priority: 1 }),
    asSuggestion({ title: `Primary old-town loop`, why: "Gives strong port feel without overextending.", durationMin: aggr ? 90 : relax ? 60 : 75, estimatedTravelImpact: "Medium", costEstimate: 0, location: `${port} old town`, type: "attraction", tags: { highQueue: true, outdoor: true }, priority: 2 }),
    asSuggestion({ title: `Local food stop`, why: "Adds a reliable reset before return phase.", durationMin: 50, estimatedTravelImpact: "Low", costEstimate: 22, location: `${port} market district`, type: "food", tags: { indoor: true }, priority: 3 }),
    asSuggestion({ title: `Return corridor reset`, why: "Protects final leg certainty.", durationMin: 35, estimatedTravelImpact: "Low", costEstimate: 8, location: `${port} return corridor`, type: "buffer", tags: { returnCorridor: true }, priority: 1 }),
  ];
}

function toStop(s: PlannerSuggestion, strategy: "append" | "optional" | "near-end"): Omit<ItineraryStop, "id"> {
  return {
    title: s.title,
    type: s.type,
    startTime: "",
    endTime: "",
    durationMin: s.durationMin,
    travelMinToNext: 12,
    location: { name: s.location },
    costEstimate: s.costEstimate,
    notes: s.notes || s.why,
    source: "chat",
    priority: s.priority ?? 3,
    flexibility: "flex",
    optional: strategy === "optional",
    locked: false,
    tags: { ...(s.tags || {}), returnCorridor: strategy === "near-end" ? true : s.tags?.returnCorridor },
  };
}

function tryExtractStructured(content: string): PlannerSuggestion[] {
  const block = content.match(/```json([\s\S]*?)```/i)?.[1];
  if (!block) return [];
  try {
    const parsed = JSON.parse(block);
    const rows = Array.isArray(parsed?.suggestions) ? parsed.suggestions : Array.isArray(parsed) ? parsed : [];
    return rows.filter((r: any) => r?.title).map((r: any) => asSuggestion(r));
  } catch {
    return [];
  }
}

const cleanAssistantText = (v: string) => v.replace(/```json[\s\S]*?```/gi, "").trim();
const riskColor = (score: number) => (score >= 70 ? "text-rose-300" : score >= 40 ? "text-amber-300" : "text-emerald-300");

export default function ChatPage() {
  const planning = usePlanning();
  const [activeTab, setActiveTab] = useState<"timeline" | "chat" | "map" | "budget" | "risk">("timeline");
  const [showWizard, setShowWizard] = useState(false);
  const [showSimulate, setShowSimulate] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [simBeforeAfter, setSimBeforeAfter] = useState<{ before: ItineraryStop[]; after: ItineraryStop[]; warning?: string } | null>(null);

  const [messages, setMessages] = useState<ChatMsg[]>([{ role: "assistant", content: "I’m your PortTrip Copilot. Share your mission and I’ll produce actionable cards plus balanced/aggressive/relaxed alternates." }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedStopId, setSelectedStopId] = useState<string>("");
  const [suggestions, setSuggestions] = useState<PlannerSuggestion[]>(fallbackSuggestions(planning.port, planning.plan.tripMode));

  const [wizard, setWizard] = useState({
    step: 1,
    port: planning.port,
    arrival: "09:00",
    allAboard: planning.allAboardTime,
    mode: planning.plan.tripMode as TripMode,
    interests: ["old town", "local food"],
    walking: planning.plan.walkingLevel as WalkingLevel,
    budgetCap: planning.plan.budgetCap,
  });

  const [prefs, setPrefs] = useState({ pace: "balanced", dislikes: "", mobility: "none", budgetCap: planning.plan.budgetCap });

  useEffect(() => {
    const seen = localStorage.getItem("pt.wizard.seen");
    if (!seen || planning.stops.length === 0) setShowWizard(true);
  }, [planning.stops.length]);

  const missionSummary = useMemo(() => {
    const safeStops = planning.scheduledStops.filter((s) => s.type !== "buffer").length;
    return `Return-Safe Score ${planning.riskScore}/100 • You can safely do ${safeStops} stops in current conditions.`;
  }, [planning.riskScore, planning.scheduledStops]);

  const nextStart = () => planning.scheduledStops.length ? planning.scheduledStops[planning.scheduledStops.length - 1].endTime : "";

  const addSuggestion = (s: PlannerSuggestion, strategy: "append" | "optional" | "near-end") => {
    const base = toStop(s, strategy);
    const start = strategy === "append" ? nextStart() : "";
    planning.addStop({ ...base, startTime: start, endTime: start ? minToTime(parseTimeToMin(start) + base.durationMin) : "" });
    planning.autoOptimize();
    setActiveTab("timeline");
  };

  const replaceSelected = (s: PlannerSuggestion) => {
    const target = planning.stops.find((x) => x.id === selectedStopId) ?? planning.scheduledStops[planning.scheduledStops.length - 1];
    if (!target) return addSuggestion(s, "append");
    const start = target.startTime || nextStart();
    planning.updateStop(target.id, { ...toStop(s, "append"), startTime: start, endTime: start ? minToTime(parseTimeToMin(start) + s.durationMin) : "" });
    planning.autoOptimize();
  };

  const runWizard = () => {
    planning.setPlanMeta({
      portSlug: wizard.port,
      allAboardTime: wizard.allAboard,
      mustReturnByTime: minToTime(parseTimeToMin(wizard.allAboard) - (wizard.mode === "aggressive" ? 45 : wizard.mode === "relaxed" ? 75 : 60)),
      tripMode: wizard.mode,
      budgetCap: wizard.budgetCap,
      walkingLevel: wizard.walking,
      assumptions: [
        `Interests: ${wizard.interests.join(", ")}`,
        `Walking level: ${wizard.walking}`,
        `Budget cap: €${wizard.budgetCap}`,
      ],
      stops: [],
    });
    fallbackSuggestions(wizard.port, wizard.mode).forEach((s, idx) => {
      const base = toStop(s, idx === 3 ? "near-end" : "append");
      planning.addStop({ ...base, startTime: idx === 0 ? wizard.arrival : "", endTime: "" });
    });
    planning.autoOptimize();
    localStorage.setItem("pt.wizard.seen", "1");
    setShowWizard(false);
    setActiveTab("timeline");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const user = input.trim();
    setInput("");
    setMessages((m) => [...m, { role: "user", content: user }]);
    setLoading(true);

    const planSnapshot = planning.scheduledStops.map((s) => ({ title: s.title, start: s.startTime, end: s.endTime, priority: s.priority, optional: s.optional }));
    const systemPrompt = `You are PortTrip structured Copilot. Ask max one question if critical data is missing; then proceed with labeled assumptions. Return: 1 recommended plan + 2 alternates (aggressive/relaxed) as action cards in JSON fenced block under suggestions. Keep each card concise. Context prefs=${JSON.stringify(prefs)} plan=${JSON.stringify(planSnapshot)}.`;

    try {
      const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: [{ role: "system", content: systemPrompt }, ...messages, { role: "user", content: user }] }) });
      const data = await res.json();
      const reply = data?.message || data?.answer || "Built a context-grounded plan with alternates.";
      const parsed = tryExtractStructured(reply);
      setSuggestions(parsed.length ? parsed : fallbackSuggestions(planning.port, planning.plan.tripMode));
      setMessages((m) => [...m, { role: "assistant", content: cleanAssistantText(reply) }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Connection interrupted. I generated deterministic fallback cards from your current mission profile." }]);
      setSuggestions(fallbackSuggestions(planning.port, planning.plan.tripMode));
    } finally {
      setLoading(false);
    }
  };

  const runSimulation = (scenario: DelayScenario) => {
    const result = planning.applyDelayScenario(scenario);
    setSimBeforeAfter(result);
    setShowSimulate(true);
    setActiveTab("risk");
  };

  const exportNotes = async () => {
    const txt = planning.scheduledStops.map((s) => `${s.startTime}-${s.endTime} ${s.title} (${s.location.name})`).join("\n");
    await navigator.clipboard.writeText(txt || "No scheduled stops.");
  };

  const exportICS = () => {
    const d = planning.plan.date.replace(/-/g, "");
    const body = planning.scheduledStops.map((s) => `BEGIN:VEVENT\nDTSTART:${d}T${s.startTime.replace(":", "")}00\nDTEND:${d}T${s.endTime.replace(":", "")}00\nSUMMARY:${s.title}\nLOCATION:${s.location.name}\nEND:VEVENT`).join("\n");
    const blob = new Blob([`BEGIN:VCALENDAR\nVERSION:2.0\n${body}\nEND:VCALENDAR`], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${planning.port}-porttrip.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const costPerUsableHour = planning.totalBudget / Math.max(1, planning.scheduledStops.filter((s) => s.type !== "buffer").reduce((a, s) => a + s.durationMin, 0) / 60);
  const savings = planning.shipExcursionBenchmark - planning.totalBudget;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-slate-100 md:px-6">
      <div className="mx-auto max-w-7xl space-y-4">
        <section className="sticky top-2 z-40 rounded-2xl border border-white/10 bg-slate-900/95 p-3 backdrop-blur">
          <div className="grid gap-2 md:grid-cols-[1fr_auto]">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <select value={planning.port} onChange={(e) => planning.setPlanMeta({ portSlug: e.target.value })} className="rounded bg-slate-800 px-2 py-1">{Object.keys(portProfilesLite).map((p) => <option key={p}>{p}</option>)}</select>
              <span>All-aboard</span>
              <input type="time" value={planning.allAboardTime} onChange={(e) => planning.setPlanMeta({ allAboardTime: e.target.value })} className="rounded bg-slate-800 px-2 py-1" />
              <span>Buffer {planning.plan.bufferMinutes}m</span>
              <input type="range" min={30} max={120} value={planning.plan.bufferMinutes} onChange={(e) => planning.setPlanMeta({ bufferMinutes: Number(e.target.value), mustReturnByTime: minToTime(parseTimeToMin(planning.allAboardTime) - Number(e.target.value)) })} />
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2 text-sm">
              <span className={`rounded-full bg-white/10 px-3 py-1 font-semibold ${riskColor(planning.riskScore)}`}>Return-Safe {planning.riskScore}</span>
              <button onClick={planning.autoOptimize} className="rounded bg-cyan-500 px-3 py-1 font-semibold text-slate-900">Auto-Optimize</button>
              <button onClick={() => setShowSimulate(true)} className="rounded bg-white/10 px-3 py-1">Simulate</button>
              <button onClick={() => setShowExport(true)} className="rounded bg-white/10 px-3 py-1">Export</button>
              <button onClick={exportNotes} className="rounded bg-white/10 px-3 py-1">Save</button>
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-300">{planning.commandBanner}</p>
        </section>

        <div className="flex flex-wrap gap-2">
          {(["timeline", "chat", "map", "budget", "risk"] as const).map((tab) => <button key={tab} onClick={() => setActiveTab(tab)} className={`rounded-full px-3 py-1 text-sm ${activeTab === tab ? "bg-cyan-500 text-slate-900" : "bg-white/10"}`}>{tab.toUpperCase()}</button>)}
          <div className="ml-auto flex gap-2 text-xs">
            {(["balanced", "aggressive", "relaxed"] as const).map((m) => <button key={m} onClick={() => { planning.setTripMode(m); planning.autoOptimize(); }} className="rounded bg-white/10 px-2 py-1">{m}</button>)}
          </div>
        </div>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
          {activeTab === "timeline" && (
            <div className="space-y-3">
              <p className="text-sm font-semibold">{missionSummary}</p>
              <div className="grid gap-2 md:grid-cols-3">{planning.checkpoints.map((c) => <div key={c.label} className={`rounded border px-3 py-2 text-sm ${c.status === "ok" ? "border-emerald-500/40" : c.status === "warn" ? "border-amber-500/40" : "border-rose-500/40"}`}>{c.label}: {c.time}</div>)}</div>
              {planning.engine.breachReasons.length > 0 && <p className="rounded bg-rose-500/20 px-3 py-2 text-sm">{planning.engine.breachReasons[0]}</p>}
              {planning.scheduledStops.map((s) => (
                <div key={s.id} className="rounded-lg border border-white/10 bg-slate-900/80 p-3 text-sm">
                  <div className="grid gap-2 md:grid-cols-[1fr_90px_90px_80px_80px_90px_80px_140px_auto]">
                    <input value={s.title} onFocus={() => setSelectedStopId(s.id)} onChange={(e) => planning.updateStop(s.id, { title: e.target.value })} className="rounded bg-slate-800 px-2 py-1" />
                    <input type="time" value={s.startTime} onChange={(e) => planning.updateStop(s.id, { startTime: e.target.value })} className="rounded bg-slate-800 px-2 py-1" />
                    <input type="time" value={s.endTime} onChange={(e) => planning.updateStop(s.id, { endTime: e.target.value })} className="rounded bg-slate-800 px-2 py-1" />
                    <input type="number" value={s.durationMin} onChange={(e) => planning.updateStop(s.id, { durationMin: Number(e.target.value) || 0 })} className="rounded bg-slate-800 px-2 py-1" />
                    <input type="number" value={s.costEstimate} onChange={(e) => planning.updateStop(s.id, { costEstimate: Number(e.target.value) || 0 })} className="rounded bg-slate-800 px-2 py-1" />
                    <select value={s.type} onChange={(e) => planning.updateStop(s.id, { type: e.target.value as StopType })} className="rounded bg-slate-800 px-2 py-1"><option value="attraction">attraction</option><option value="food">food</option><option value="transport">transport</option><option value="buffer">buffer</option><option value="misc">misc</option></select>
                    <button onClick={() => planning.updateStop(s.id, { locked: !s.locked })} className="rounded bg-white/10 px-2">{s.locked ? "Unlock" : "Lock"}</button>
                    <input placeholder="Paste Google Maps link or lat,lng" onBlur={(e) => { const c = parseCoordsFromInput(e.target.value); if (c) planning.updateStop(s.id, { location: { ...s.location, lat: c.lat, lng: c.lng } }); }} className="rounded bg-slate-800 px-2 py-1 text-xs" />
                    <div className="flex gap-1"><button onClick={() => planning.updateStop(s.id, { type: "buffer" })} className="rounded bg-white/10 px-2">Buffer</button><button onClick={() => planning.updateStop(s.id, { optional: true, startTime: "", endTime: "" })} className="rounded bg-white/10 px-2">Optional</button><button onClick={() => planning.deleteStop(s.id)} className="rounded bg-rose-500/20 px-2">✕</button></div>
                  </div>
                </div>
              ))}
              {planning.unscheduledStops.length > 0 && <div className="rounded border border-dashed border-white/20 p-3 text-sm"><p className="font-semibold">Optional section</p><ul className="mt-2 list-disc pl-5 text-slate-300">{planning.unscheduledStops.map((s) => <li key={s.id}>{s.title}</li>)}</ul></div>}
            </div>
          )}

          {activeTab === "chat" && (
            <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
              <div>
                <div className="mb-2 flex flex-wrap gap-2 text-xs">
                  {[
                    "Time in port", "Walking level", "Interests", "Budget", "Kids", "Mobility"
                  ].map((chip) => <span key={chip} className="rounded bg-white/10 px-2 py-1">{chip}</span>)}
                </div>
                <div className="h-[300px] space-y-2 overflow-auto rounded-lg bg-slate-900/80 p-3">
                  {messages.map((m, i) => <p key={`${m.role}-${i}`} className={`rounded-lg p-2 text-sm whitespace-pre-wrap ${m.role === "user" ? "bg-cyan-500 text-slate-900" : "bg-white/10"}`}>{m.content}</p>)}
                  {loading && <p className="text-xs text-slate-400">Generating actionable cards…</p>}
                </div>
                <form onSubmit={submit} className="mt-3 flex gap-2">
                  <input value={input} onChange={(e) => setInput(e.target.value)} className="flex-1 rounded bg-slate-900 px-3 py-2 text-sm" placeholder="Ask what to do next" />
                  <button type="submit" className="rounded bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-900">Send</button>
                </form>
              </div>
              <div className="space-y-2">
                <div className="rounded-lg border border-white/10 bg-slate-900/70 p-2 text-xs">Plan memory: pace={prefs.pace}, budget cap={prefs.budgetCap}, dislikes={prefs.dislikes || "none"}, mobility={prefs.mobility}</div>
                {suggestions.map((s, i) => (
                  <div key={`${s.title}-${i}`} className="rounded-lg border border-white/10 bg-slate-900/80 p-3 text-sm">
                    <p className="font-semibold">{s.title}</p>
                    <p className="text-xs text-slate-300">{s.why}</p>
                    <p className="text-xs text-slate-400">{s.durationMin}m • {s.estimatedTravelImpact} • €{s.costEstimate} • tags: {Object.entries(s.tags || {}).filter(([, v]) => v).map(([k]) => k).join(", ") || "none"}</p>
                    <div className="mt-2 flex flex-wrap gap-1 text-xs">
                      <button onClick={() => addSuggestion(s, "append")} className="rounded bg-cyan-500 px-2 py-1 font-semibold text-slate-900">Add to plan</button>
                      <button onClick={() => addSuggestion(s, "optional")} className="rounded bg-white/10 px-2 py-1">Add as optional</button>
                      <button onClick={() => addSuggestion(s, "near-end")} className="rounded bg-white/10 px-2 py-1">Add near end</button>
                      <button onClick={() => replaceSelected(s)} className="rounded bg-white/10 px-2 py-1">Replace selected stop</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "map" && <LazyMap stops={planning.scheduledStops} port={planning.port} mustReturnByTime={planning.safeReturnTime} onUpdateCoords={(id, lat, lng) => planning.updateStop(id, { location: { ...(planning.stops.find((s) => s.id === id)?.location || { name: "Pinned" }), lat, lng } })} />}

          {activeTab === "budget" && (
            <div className="space-y-2 text-sm">
              <p>Transport: €{planning.budgetByType.transport.toFixed(0)}</p>
              <p>Attractions: €{planning.budgetByType.attraction.toFixed(0)}</p>
              <p>Food: €{planning.budgetByType.food.toFixed(0)}</p>
              <p>Misc: €{(planning.budgetByType.misc + planning.budgetByType.buffer).toFixed(0)}</p>
              <p>Ship excursion benchmark: <input type="number" value={planning.shipExcursionBenchmark} onChange={(e) => planning.setPlanMeta({ shipExcursionBenchmark: Number(e.target.value) || 0 })} className="ml-2 w-24 rounded bg-slate-900 px-2 py-1" /></p>
              <p className="font-semibold">DIY total: €{planning.totalBudget.toFixed(0)}</p>
              <p className={savings >= 0 ? "text-emerald-300" : "text-rose-300"}>Savings: €{savings.toFixed(0)}</p>
              <p>Cost per usable hour: €{costPerUsableHour.toFixed(1)}</p>
              {planning.budgetByType.transport > planning.totalBudget * 0.45 && <p className="rounded bg-amber-500/20 px-3 py-2">Budget risk: expensive taxi-dependent legs are dominating this plan.</p>}
            </div>
          )}

          {activeTab === "risk" && (
            <div className="space-y-3 text-sm">
              <p className={`${riskColor(planning.riskScore)} font-semibold`}>Return-Safe Score: {planning.riskScore}/100</p>
              <ol className="list-decimal pl-5 text-slate-300">{planning.engine.scoreDrivers.map((d) => <li key={d}>{d}</li>)}</ol>
              <p>Most fragile leg: {planning.engine.fragileLeg}</p>
              <p>Fallback plan: {planning.engine.cutRecommendations[0]} {planning.engine.shortenRecommendations[0]}</p>
              <ul className="list-disc pl-5 text-slate-300">
                <li>Rule 1: Be in return corridor before {planning.checkpoints[2]?.time || planning.safeReturnTime}.</li>
                <li>Rule 2: If one checkpoint slips, cut one optional stop immediately.</li>
                <li>Rule 3: Preserve one reliable transfer mode for your final leg.</li>
              </ul>
              {planning.engine.breachReasons.length > 0 && <button onClick={planning.applyBestFix} className="rounded bg-cyan-500 px-3 py-1 font-semibold text-slate-900">Best Fix</button>}
            </div>
          )}
        </section>
      </div>

      {showWizard && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 p-4">
          <div className="mx-auto max-w-xl rounded-2xl border border-white/10 bg-slate-900 p-4">
            <h2 className="text-xl font-semibold">Port Day Wizard</h2>
            <p className="text-sm text-slate-300">Step {wizard.step} of 5</p>
            <div className="mt-3 space-y-3">
              {wizard.step === 1 && <select value={wizard.port} onChange={(e) => setWizard({ ...wizard, port: e.target.value })} className="w-full rounded bg-slate-800 px-3 py-2">{Object.keys(portProfilesLite).map((p) => <option key={p}>{p}</option>)}</select>}
              {wizard.step === 2 && <div className="grid gap-2 sm:grid-cols-2"><input type="time" value={wizard.arrival} onChange={(e) => setWizard({ ...wizard, arrival: e.target.value })} className="rounded bg-slate-800 px-3 py-2" /><input type="time" value={wizard.allAboard} onChange={(e) => setWizard({ ...wizard, allAboard: e.target.value })} className="rounded bg-slate-800 px-3 py-2" /></div>}
              {wizard.step === 3 && <div className="flex gap-2">{(["balanced", "aggressive", "relaxed"] as const).map((m) => <button key={m} onClick={() => setWizard({ ...wizard, mode: m })} className={`rounded px-3 py-2 ${wizard.mode === m ? "bg-cyan-500 text-slate-900" : "bg-white/10"}`}>{m}</button>)}</div>}
              {wizard.step === 4 && <div className="space-y-2"><input value={wizard.interests.join(", ")} onChange={(e) => setWizard({ ...wizard, interests: e.target.value.split(",").map((v) => v.trim()).filter(Boolean) })} className="w-full rounded bg-slate-800 px-3 py-2" placeholder="Interests" /><select value={wizard.walking} onChange={(e) => setWizard({ ...wizard, walking: e.target.value as WalkingLevel })} className="w-full rounded bg-slate-800 px-3 py-2"><option value="low">Low walking</option><option value="moderate">Moderate</option><option value="high">High</option></select><input type="number" value={wizard.budgetCap} onChange={(e) => setWizard({ ...wizard, budgetCap: Number(e.target.value) || 120 })} className="w-full rounded bg-slate-800 px-3 py-2" placeholder="Budget cap" /></div>}
              {wizard.step === 5 && <div className="rounded bg-white/10 p-3 text-sm">Generate a complete plan instantly with assumptions if needed.</div>}
            </div>
            <div className="mt-4 flex justify-between"><button onClick={() => setWizard({ ...wizard, step: Math.max(1, wizard.step - 1) })} className="rounded bg-white/10 px-3 py-1">Back</button>{wizard.step < 5 ? <button onClick={() => setWizard({ ...wizard, step: wizard.step + 1 })} className="rounded bg-cyan-500 px-3 py-1 font-semibold text-slate-900">Next</button> : <button onClick={runWizard} className="rounded bg-cyan-500 px-3 py-1 font-semibold text-slate-900">Generate Plan</button>}</div>
          </div>
        </div>
      )}

      {showSimulate && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 p-4">
          <div className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-slate-900 p-4">
            <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-semibold">Simulate Reality</h2><button onClick={() => setShowSimulate(false)} className="rounded bg-white/10 px-3 py-1">Close</button></div>
            <div className="flex flex-wrap gap-2 text-sm"><button onClick={() => runSimulation("tender20")} className="rounded bg-white/10 px-3 py-1">Tender delay +20</button><button onClick={() => runSimulation("traffic25")} className="rounded bg-white/10 px-3 py-1">Traffic spike +25</button><button onClick={() => runSimulation("queue30")} className="rounded bg-white/10 px-3 py-1">Attraction queue +30</button><button onClick={() => runSimulation("lost15")} className="rounded bg-white/10 px-3 py-1">Lost time +15</button><button onClick={() => runSimulation("weatherPivot")} className="rounded bg-white/10 px-3 py-1">Weather pivot</button></div>
            {simBeforeAfter && (
              <div className="mt-3 grid gap-3 md:grid-cols-2 text-sm">
                <div className="rounded border border-white/10 p-2"><p className="font-semibold">Before</p><ul className="mt-1 list-disc pl-5 text-slate-300">{simBeforeAfter.before.slice(0, 6).map((s) => <li key={`b-${s.id}`}>{s.startTime} {s.title}</li>)}</ul></div>
                <div className="rounded border border-white/10 p-2"><p className="font-semibold">After</p><ul className="mt-1 list-disc pl-5 text-slate-300">{simBeforeAfter.after.slice(0, 6).map((s) => <li key={`a-${s.id}`}>{s.startTime} {s.title}</li>)}</ul></div>
              </div>
            )}
            {planning.engine.breachReasons.length > 0 && (
              <div className="mt-3 rounded bg-rose-500/20 p-3 text-sm">
                <p>{planning.engine.breachReasons[0]}</p>
                <button onClick={planning.applyBestFix} className="mt-2 rounded bg-cyan-500 px-3 py-1 font-semibold text-slate-900">Best Fix</button>
                <details className="mt-2"><summary className="cursor-pointer">Alternative Fixes</summary><ul className="list-disc pl-5 text-slate-300">{planning.cutSuggestions.map((s) => <li key={s}>{s}</li>)}</ul></details>
              </div>
            )}
          </div>
        </div>
      )}

      {showExport && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 p-4">
          <div className="mx-auto max-w-xl rounded-2xl border border-white/10 bg-slate-900 p-4">
            <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-semibold">Export</h2><button onClick={() => setShowExport(false)} className="rounded bg-white/10 px-3 py-1">Close</button></div>
            <div className="space-y-2 text-sm">
              <button onClick={() => window.print()} className="w-full rounded bg-white/10 px-3 py-2 text-left">Printable Day Sheet</button>
              <button onClick={exportNotes} className="w-full rounded bg-white/10 px-3 py-2 text-left">Copy notes format</button>
              <button onClick={exportICS} className="w-full rounded bg-white/10 px-3 py-2 text-left">Download .ics calendar</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
