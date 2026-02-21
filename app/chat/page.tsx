"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { usePlanning } from "../components/PlanningProvider";
import { addCultureBias, addFoodBias, makeCheaper, makeSafer, rainPlan, reduceWalking, runningLate } from "../lib/planMutations";
import { portProfilesLite } from "../lib/returnSafeEngine";
import { minToTime, parseCoordsFromInput, parseTimeToMin, stopTypeFromTitle } from "../lib/plannerUtils";
import type { DelayScenario, ItineraryStop, PlannerSuggestion, StopType, TripMode, WalkingLevel } from "../lib/types";

const LazyMap = dynamic(() => import("../components/planner/PlannerMapView"), { ssr: false });

type ChatMsg = { role: "user" | "assistant"; content: string };

const chips = [
  "Make it safer", "Make it cheaper", "Less walking", "More culture", "More food", "One iconic sight", "I’m running late", "Tender is chaos", "Rain plan",
] as const;

function asSuggestion(raw: Partial<PlannerSuggestion> & { title: string }): PlannerSuggestion {
  return {
    title: raw.title,
    why: raw.why || "Fits your current mission profile.",
    durationMin: raw.durationMin ?? 45,
    estimatedTravelImpact: raw.estimatedTravelImpact ?? "Estimated transfer impact +10m",
    costEstimate: raw.costEstimate ?? 0,
    location: raw.location ?? "Port area",
    type: raw.type ?? stopTypeFromTitle(raw.title),
    tags: raw.tags,
    priority: raw.priority ?? 3,
    notes: raw.notes,
  };
}

function fallbackSuggestions(port: string, mode: TripMode): PlannerSuggestion[] {
  return [
    asSuggestion({ title: `${port} terminal transfer`, why: "Stabilizes first leg reliability.", durationMin: 30, estimatedTravelImpact: "Low", costEstimate: 12, location: `${port} terminal`, type: "transport", tags: { returnCorridor: true }, priority: 1 }),
    asSuggestion({ title: "Iconic old-town block", why: "Delivers strongest first impression.", durationMin: mode === "aggressive" ? 90 : 70, estimatedTravelImpact: "Medium", costEstimate: 0, location: `${port} old town`, type: "attraction", tags: { highQueue: true, outdoor: true }, priority: 2 }),
    asSuggestion({ title: "Local food anchor", why: "Adds low-friction reset before return.", durationMin: 50, estimatedTravelImpact: "Low", costEstimate: 24, location: `${port} market corridor`, type: "food", tags: { indoor: true }, priority: 3 }),
    asSuggestion({ title: "Return corridor staging", why: "Protects last leg certainty.", durationMin: 35, estimatedTravelImpact: "Low", costEstimate: 8, location: `${port} return corridor`, type: "buffer", tags: { returnCorridor: true }, priority: 1 }),
  ];
}

function toStop(s: PlannerSuggestion, strategy: "append" | "optional" | "near-end"): Omit<ItineraryStop, "id"> {
  const tags = { ...(s.tags || {}), returnCorridor: strategy === "near-end" ? true : s.tags?.returnCorridor };
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
    tags,
    category: s.type === "food" ? "food" : s.type === "attraction" ? "culture" : "view",
    indoorFriendly: !!tags.indoor,
    crowdSensitive: !!tags.highQueue,
    keywordTags: Object.entries(tags).filter(([, v]) => v).map(([k]) => k),
  };
}

function parseSuggestions(content: string): PlannerSuggestion[] {
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

export default function ChatPage() {
  const planning = usePlanning();
  const [activeTab, setActiveTab] = useState<"timeline" | "chat" | "map" | "budget" | "risk">("timeline");
  const [messages, setMessages] = useState<ChatMsg[]>([{ role: "assistant", content: "Mission control online. Use a quick chip or ask for plan refinements." }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<PlannerSuggestion[]>(fallbackSuggestions(planning.port, planning.plan.tripMode));
  const [selectedStopId, setSelectedStopId] = useState("");

  const [showWizard, setShowWizard] = useState(false);
  const [showSim, setShowSim] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [showTune, setShowTune] = useState(false);
  const [showLate, setShowLate] = useState(false);
  const [compactBar, setCompactBar] = useState(false);

  const [wizard, setWizard] = useState({ step: 1, port: planning.port, arrival: "09:00", allAboard: planning.allAboardTime, mode: planning.plan.tripMode as TripMode, interests: ["old town", "food"], walking: planning.plan.walkingLevel as WalkingLevel, budgetCap: planning.plan.budgetCap });
  const [tune, setTune] = useState({ pace: 50, walking: 50, spend: 50, crowd: 50, photo: 50 });
  const [changeLog, setChangeLog] = useState<string[]>([]);
  const [simResult, setSimResult] = useState<{ before: ItineraryStop[]; after: ItineraryStop[]; warning?: string } | null>(null);

  useEffect(() => {
    const seen = localStorage.getItem("pt.wizard.v2");
    if (!seen || planning.stops.length === 0) setShowWizard(true);
  }, [planning.stops.length]);

  useEffect(() => {
    let prev = window.scrollY;
    const onScroll = () => {
      const cur = window.scrollY;
      setCompactBar(cur > prev && cur > 40);
      prev = cur;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      const missed = planning.checkpoints.find((c) => parseTimeToMin(c.time) < parseTimeToMin(hhmm) && c.status !== "ok");
      if (missed) setChangeLog((prev) => [`Checkpoint missed (${missed.label}) — tap Best Fix.`, ...prev].slice(0, 3));
    }, 60000);
    return () => clearInterval(timer);
  }, [planning.checkpoints]);

  const nextStart = () => (planning.scheduledStops.length ? planning.scheduledStops[planning.scheduledStops.length - 1].endTime : "");

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

  const applyMutation = (chip: (typeof chips)[number]) => {
    const current = planning.stops;
    const result =
      chip === "Make it safer" || chip === "Tender is chaos" ? makeSafer(current)
      : chip === "Make it cheaper" ? makeCheaper(current)
      : chip === "Less walking" ? reduceWalking(current)
      : chip === "More culture" ? addCultureBias(current)
      : chip === "More food" ? addFoodBias(current)
      : chip === "Rain plan" ? rainPlan(current)
      : chip === "I’m running late" ? runningLate(current, 20)
      : makeSafer(current);
    planning.replaceStops(result.stops);
    planning.autoOptimize();
    const note = `${chip}: ${result.changeLog.slice(0, 2).join("; ")}`;
    setMessages((m) => [...m, { role: "assistant", content: note }]);
    setChangeLog(result.changeLog.slice(0, 3));
  };

  const applyTune = (next: typeof tune) => {
    setTune(next);
    let logs: string[] = [];
    if (next.pace > 65) {
      planning.setTripMode("aggressive");
      logs.push("Pace moved toward aggressive sequencing.");
    } else if (next.pace < 35) {
      planning.setTripMode("relaxed");
      logs.push("Pace moved toward relaxed spacing.");
    } else {
      planning.setTripMode("balanced");
      logs.push("Pace normalized to balanced mode.");
    }
    if (next.walking < 35) logs.push("Reduced high-walk pressure.");
    if (next.spend < 35) logs.push("Shifted budget toward lower-cost legs.");
    if (next.crowd < 35) logs.push("Prioritized off-peak/crowd-safe ordering.");
    if (next.photo > 65) logs.push("Promoted scenic anchors earlier.");
    setChangeLog(logs.slice(0, 3));
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
      assumptions: [`Interests: ${wizard.interests.join(", ")}`, `Budget cap: €${wizard.budgetCap}`, `Walking level: ${wizard.walking}`],
      stops: [],
    });
    fallbackSuggestions(wizard.port, wizard.mode).forEach((s, idx) => {
      const base = toStop(s, idx === 3 ? "near-end" : "append");
      planning.addStop({ ...base, startTime: idx === 0 ? wizard.arrival : "", endTime: "" });
    });
    planning.autoOptimize();
    localStorage.setItem("pt.wizard.v2", "1");
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
    const snapshot = planning.scheduledStops.map((s) => ({ title: s.title, start: s.startTime, end: s.endTime, priority: s.priority }));
    const systemPrompt = `Ask max one question if critical data missing then proceed. Return recommended + aggressive + relaxed as action cards in JSON suggestions. Context=${JSON.stringify(snapshot)}.`;
    try {
      const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: [{ role: "system", content: systemPrompt }, ...messages, { role: "user", content: user }] }) });
      const data = await res.json();
      const reply = data?.message || data?.answer || "Updated cards generated.";
      const parsed = parseSuggestions(reply);
      setSuggestions(parsed.length ? parsed : fallbackSuggestions(planning.port, planning.plan.tripMode));
      setMessages((m) => [...m, { role: "assistant", content: cleanAssistantText(reply) }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Network hiccup; fallback cards generated from current mission state." }]);
      setSuggestions(fallbackSuggestions(planning.port, planning.plan.tripMode));
    } finally {
      setLoading(false);
    }
  };

  const runSimulation = (scenario: DelayScenario) => {
    const result = planning.applyDelayScenario(scenario);
    setSimResult(result);
    setShowSim(true);
    setActiveTab("risk");
  };

  const applyRunningLate = (minutes: number) => {
    const result = runningLate(planning.stops, minutes);
    planning.replaceStops(result.stops);
    planning.autoOptimize();
    setShowLate(false);
    setChangeLog([`Running late +${minutes} applied`, ...result.changeLog].slice(0, 3));
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

  const savings = planning.shipExcursionBenchmark - planning.totalBudget;
  const costPerHour = planning.totalBudget / Math.max(1, planning.scheduledStops.filter((s) => s.type !== "buffer").reduce((a, s) => a + s.durationMin, 0) / 60);

  return (
    <main className="min-h-screen overflow-x-hidden bg-slate-950 px-3 pb-28 pt-4 text-slate-100 md:px-6 md:pb-8">
      <div className="mx-auto max-w-7xl space-y-3">
        <section className="rounded-2xl border border-white/10 bg-slate-900/95 p-3">
          <div className="grid gap-2 lg:grid-cols-[1fr_auto]">
            <div className="grid gap-2 sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-center">
              <select value={planning.port} onChange={(e) => planning.setPlanMeta({ portSlug: e.target.value })} className="h-11 rounded bg-slate-800 px-3 text-sm">{Object.keys(portProfilesLite).map((p) => <option key={p}>{p}</option>)}</select>
              <input type="time" value={planning.allAboardTime} onChange={(e) => planning.setPlanMeta({ allAboardTime: e.target.value })} className="h-11 rounded bg-slate-800 px-3 text-sm" />
              <div className="flex items-center gap-2 rounded bg-slate-800 px-3 py-2 text-sm">Buffer {planning.plan.bufferMinutes}m<input type="range" min={30} max={120} value={planning.plan.bufferMinutes} onChange={(e) => planning.setPlanMeta({ bufferMinutes: Number(e.target.value), mustReturnByTime: minToTime(parseTimeToMin(planning.allAboardTime) - Number(e.target.value)) })} /></div>
              <span className={`rounded-full bg-white/10 px-3 py-2 text-sm font-semibold ${planning.riskScore >= 70 ? "text-rose-300" : planning.riskScore >= 40 ? "text-amber-300" : "text-emerald-300"}`}>Score {planning.riskScore}</span>
            </div>
            <div className="hidden items-center gap-2 lg:flex">
              <button onClick={planning.autoOptimize} className="h-11 rounded bg-cyan-500 px-4 text-sm font-semibold text-slate-900">Auto-Optimize</button>
              <button onClick={() => setShowSim(true)} className="h-11 rounded bg-white/10 px-4 text-sm">Simulate</button>
              <button onClick={() => setShowExport(true)} className="h-11 rounded bg-white/10 px-4 text-sm">Export</button>
              <button onClick={exportNotes} className="h-11 rounded bg-white/10 px-4 text-sm">Save</button>
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-300">{planning.commandBanner}</p>
        </section>

        <div className="overflow-x-auto pb-1"><div className="flex min-w-max gap-2">{(["timeline", "chat", "map", "budget", "risk"] as const).map((tab) => <button key={tab} onClick={() => setActiveTab(tab)} className={`h-11 rounded-full px-4 text-sm ${activeTab === tab ? "bg-cyan-500 text-slate-900" : "bg-white/10"}`}>{tab.toUpperCase()}</button>)}<button onClick={() => setShowTune(true)} className="h-11 rounded-full bg-white/10 px-4 text-sm">Tune</button><button onClick={() => setShowLate(true)} className="h-11 rounded-full bg-rose-500/20 px-4 text-sm">Running Late</button></div></div>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-3 md:p-4">
          {activeTab === "timeline" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between"><p className="text-sm font-semibold">Return-Safe Score {planning.riskScore}/100</p><button onClick={() => setShowAdd(true)} className="h-11 rounded bg-white/10 px-3 text-sm">Add Stop</button></div>
              <div className="grid gap-2 sm:grid-cols-3">{planning.checkpoints.map((c) => <div key={c.label} className={`rounded border px-3 py-2 text-xs ${c.status === "ok" ? "border-emerald-500/40" : c.status === "warn" ? "border-amber-500/40" : "border-rose-500/40"}`}>{c.label}<div>{c.time}</div></div>)}</div>
              {planning.engine.breachReasons.length > 0 && <div className="rounded bg-rose-500/20 px-3 py-2 text-sm">{planning.engine.breachReasons[0]}</div>}
              {planning.scheduledStops.map((s) => (
                <div key={s.id} className="rounded-lg border border-white/10 bg-slate-900/80 p-3 text-sm">
                  <div className="grid gap-2 md:grid-cols-[1fr_82px_82px_70px_70px_110px_auto]">
                    <input value={s.title} onFocus={() => setSelectedStopId(s.id)} onChange={(e) => planning.updateStop(s.id, { title: e.target.value })} className="h-11 rounded bg-slate-800 px-2" />
                    <input type="time" value={s.startTime} onChange={(e) => planning.updateStop(s.id, { startTime: e.target.value })} className="h-11 rounded bg-slate-800 px-2" />
                    <input type="time" value={s.endTime} onChange={(e) => planning.updateStop(s.id, { endTime: e.target.value })} className="h-11 rounded bg-slate-800 px-2" />
                    <input type="number" value={s.durationMin} onChange={(e) => planning.updateStop(s.id, { durationMin: Number(e.target.value) || 0 })} className="h-11 rounded bg-slate-800 px-2" />
                    <input type="number" value={s.costEstimate} onChange={(e) => planning.updateStop(s.id, { costEstimate: Number(e.target.value) || 0 })} className="h-11 rounded bg-slate-800 px-2" />
                    <select value={s.type} onChange={(e) => planning.updateStop(s.id, { type: e.target.value as StopType })} className="h-11 rounded bg-slate-800 px-2"><option value="attraction">attraction</option><option value="food">food</option><option value="transport">transport</option><option value="buffer">buffer</option><option value="misc">misc</option></select>
                    <div className="flex gap-1"><button onClick={() => planning.updateStop(s.id, { optional: true, startTime: "", endTime: "" })} className="h-11 rounded bg-white/10 px-2">Opt</button><button onClick={() => planning.updateStop(s.id, { locked: !s.locked })} className="h-11 rounded bg-white/10 px-2">{s.locked ? "Un" : "Lock"}</button><button onClick={() => planning.deleteStop(s.id)} className="h-11 rounded bg-rose-500/20 px-2">✕</button></div>
                  </div>
                  <input placeholder="Paste Google Maps link or lat,lng" onBlur={(e) => { const c = parseCoordsFromInput(e.target.value); if (c) planning.updateStop(s.id, { location: { ...s.location, lat: c.lat, lng: c.lng } }); }} className="mt-2 h-11 w-full rounded bg-slate-800 px-2 text-xs" />
                </div>
              ))}
            </div>
          )}

          {activeTab === "chat" && (
            <div className="grid gap-3 lg:grid-cols-[1.1fr_1fr]">
              <div>
                <div className="mb-2 flex flex-wrap gap-2">{chips.map((chip) => <button key={chip} onClick={() => applyMutation(chip)} className="h-11 rounded-full bg-white/10 px-3 text-xs">{chip}</button>)}</div>
                <div className="h-[260px] space-y-2 overflow-auto rounded bg-slate-900/80 p-3">{messages.map((m, i) => <p key={`${m.role}-${i}`} className={`rounded p-2 text-sm ${m.role === "user" ? "bg-cyan-500 text-slate-900" : "bg-white/10"}`}>{m.content}</p>)}</div>
                <form onSubmit={submit} className="mt-2 flex gap-2"><input value={input} onChange={(e) => setInput(e.target.value)} className="h-11 flex-1 rounded bg-slate-900 px-3 text-sm" placeholder="Ask AI Copilot" /><button className="h-11 rounded bg-cyan-500 px-4 text-sm font-semibold text-slate-900">Send</button></form>
              </div>
              <div className="space-y-2">{suggestions.map((s, i) => <div key={`${s.title}-${i}`} className="rounded border border-white/10 bg-slate-900/80 p-3 text-sm"><p className="font-semibold">{s.title}</p><p className="text-xs text-slate-300">{s.why}</p><p className="text-xs text-slate-400">{s.durationMin}m • {s.estimatedTravelImpact} • €{s.costEstimate}</p><div className="mt-2 flex flex-wrap gap-1 text-xs"><button onClick={() => addSuggestion(s, "append")} className="h-11 rounded bg-cyan-500 px-2 font-semibold text-slate-900">Add</button><button onClick={() => addSuggestion(s, "optional")} className="h-11 rounded bg-white/10 px-2">Optional</button><button onClick={() => addSuggestion(s, "near-end")} className="h-11 rounded bg-white/10 px-2">Near End</button><button onClick={() => replaceSelected(s)} className="h-11 rounded bg-white/10 px-2">Replace</button></div></div>)}</div>
            </div>
          )}

          {activeTab === "map" && <LazyMap stops={planning.scheduledStops} port={planning.port} mustReturnByTime={planning.safeReturnTime} onUpdateCoords={(id, lat, lng) => planning.updateStop(id, { location: { ...(planning.stops.find((s) => s.id === id)?.location || { name: "Pinned" }), lat, lng } })} />}

          {activeTab === "budget" && <div className="space-y-2 text-sm"><p>Transport: €{planning.budgetByType.transport.toFixed(0)}</p><p>Attractions: €{planning.budgetByType.attraction.toFixed(0)}</p><p>Food: €{planning.budgetByType.food.toFixed(0)}</p><p>Misc: €{(planning.budgetByType.misc + planning.budgetByType.buffer).toFixed(0)}</p><p>Benchmark <input type="number" value={planning.shipExcursionBenchmark} onChange={(e) => planning.setPlanMeta({ shipExcursionBenchmark: Number(e.target.value) || 0 })} className="ml-2 h-11 w-24 rounded bg-slate-900 px-2" /></p><p>Savings: €{savings.toFixed(0)}</p><p>Cost per usable hour: €{costPerHour.toFixed(1)}</p></div>}

          {activeTab === "risk" && <div className="space-y-2 text-sm"><p className={planning.riskScore >= 70 ? "text-rose-300" : planning.riskScore >= 40 ? "text-amber-300" : "text-emerald-300"}>Return-Safe Score: {planning.riskScore}/100</p><ul className="list-disc pl-5">{planning.engine.scoreDrivers.map((d) => <li key={d}>{d}</li>)}</ul><p>Most fragile leg: {planning.engine.fragileLeg}</p><p>Fallback: {planning.engine.cutRecommendations[0]}</p><button onClick={planning.applyBestFix} className="h-11 rounded bg-cyan-500 px-3 text-sm font-semibold text-slate-900">Best Fix</button>{changeLog.length > 0 && <ul className="list-disc pl-5 text-xs text-slate-300">{changeLog.map((c) => <li key={c}>{c}</li>)}</ul>}</div>}
        </section>
      </div>

      {/* Mobile bottom action bar */}
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-slate-900/95 px-2 pb-[calc(env(safe-area-inset-bottom)+6px)] pt-2 md:hidden">
        <div className="grid grid-cols-5 gap-1">
          <button onClick={planning.autoOptimize} className="h-11 rounded bg-white/10 text-xs">⚙️{compactBar ? "" : " Optimize"}</button>
          <button onClick={() => setShowSim(true)} className="h-11 rounded bg-white/10 text-xs">⏱️{compactBar ? "" : " Simulate"}</button>
          <button onClick={() => setShowAdd(true)} className="h-11 rounded bg-white/10 text-xs">➕{compactBar ? "" : " Add"}</button>
          <button onClick={() => setShowExport(true)} className="h-11 rounded bg-white/10 text-xs">📤{compactBar ? "" : " Export"}</button>
          <button onClick={() => { setShowAI(true); setActiveTab("chat"); }} className="h-11 rounded bg-cyan-500 text-xs font-semibold text-slate-900">✨{compactBar ? "" : " AI"}</button>
        </div>
      </nav>

      {showWizard && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 p-4">
          <div className="mx-auto max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-4">
            <h2 className="text-lg font-semibold">Port Day Wizard</h2><p className="text-xs text-slate-300">Step {wizard.step}/5</p>
            <div className="mt-3 space-y-2">{wizard.step === 1 && <select value={wizard.port} onChange={(e) => setWizard({ ...wizard, port: e.target.value })} className="h-11 w-full rounded bg-slate-800 px-3">{Object.keys(portProfilesLite).map((p) => <option key={p}>{p}</option>)}</select>}{wizard.step === 2 && <div className="grid gap-2 sm:grid-cols-2"><input type="time" value={wizard.arrival} onChange={(e) => setWizard({ ...wizard, arrival: e.target.value })} className="h-11 rounded bg-slate-800 px-3" /><input type="time" value={wizard.allAboard} onChange={(e) => setWizard({ ...wizard, allAboard: e.target.value })} className="h-11 rounded bg-slate-800 px-3" /></div>}{wizard.step === 3 && <div className="flex gap-2">{(["balanced", "aggressive", "relaxed"] as const).map((m) => <button key={m} onClick={() => setWizard({ ...wizard, mode: m })} className={`h-11 rounded px-3 ${wizard.mode === m ? "bg-cyan-500 text-slate-900" : "bg-white/10"}`}>{m}</button>)}</div>}{wizard.step === 4 && <><input value={wizard.interests.join(", ")} onChange={(e) => setWizard({ ...wizard, interests: e.target.value.split(",").map((v) => v.trim()).filter(Boolean) })} className="h-11 w-full rounded bg-slate-800 px-3" /><select value={wizard.walking} onChange={(e) => setWizard({ ...wizard, walking: e.target.value as WalkingLevel })} className="h-11 w-full rounded bg-slate-800 px-3"><option value="low">Minimal</option><option value="moderate">Moderate</option><option value="high">Active</option></select><input type="number" value={wizard.budgetCap} onChange={(e) => setWizard({ ...wizard, budgetCap: Number(e.target.value) || 120 })} className="h-11 w-full rounded bg-slate-800 px-3" /></>}{wizard.step === 5 && <p className="rounded bg-white/10 p-3 text-sm">Generate complete plan now.</p>}</div>
            <div className="mt-3 flex justify-between"><button onClick={() => setWizard({ ...wizard, step: Math.max(1, wizard.step - 1) })} className="h-11 rounded bg-white/10 px-3">Back</button>{wizard.step < 5 ? <button onClick={() => setWizard({ ...wizard, step: wizard.step + 1 })} className="h-11 rounded bg-cyan-500 px-3 font-semibold text-slate-900">Next</button> : <button onClick={runWizard} className="h-11 rounded bg-cyan-500 px-3 font-semibold text-slate-900">Generate Plan</button>}</div>
          </div>
        </div>
      )}

      {showSim && <Sheet title="Simulate Reality" onClose={() => setShowSim(false)}><div className="flex flex-wrap gap-2">{(["tender20", "traffic25", "queue30", "lost15", "weatherPivot"] as DelayScenario[]).map((s) => <button key={s} onClick={() => runSimulation(s)} className="h-11 rounded bg-white/10 px-3 text-sm">{s}</button>)}</div>{simResult && <div className="mt-3 grid gap-2 sm:grid-cols-2 text-xs"><div className="rounded border border-white/10 p-2"><p className="font-semibold">Before</p>{simResult.before.slice(0,5).map((b)=><p key={b.id}>{b.startTime} {b.title}</p>)}</div><div className="rounded border border-white/10 p-2"><p className="font-semibold">After</p>{simResult.after.slice(0,5).map((a)=><p key={a.id}>{a.startTime} {a.title}</p>)}</div></div>}<button onClick={planning.applyBestFix} className="mt-3 h-11 rounded bg-cyan-500 px-3 text-sm font-semibold text-slate-900">Best Fix</button></Sheet>}
      {showExport && <Sheet title="Export" onClose={() => setShowExport(false)}><div className="space-y-2"><button onClick={() => window.print()} className="h-11 w-full rounded bg-white/10 px-3 text-left">Printable Day Sheet</button><button onClick={exportNotes} className="h-11 w-full rounded bg-white/10 px-3 text-left">Copy notes</button><button onClick={exportICS} className="h-11 w-full rounded bg-white/10 px-3 text-left">Download .ics</button></div></Sheet>}
      {showAdd && <Sheet title="Swipe to Decide" onClose={() => setShowAdd(false)}><SwipeDeck suggestions={suggestions} onAdd={(s)=>addSuggestion(s,"append")} onSkip={() => {}} onOptional={(s)=>addSuggestion(s,"optional")} /></Sheet>}
      {showAI && <Sheet title="AI Copilot" onClose={() => setShowAI(false)}><p className="text-sm text-slate-300">Use quick chips for one-hand control loop.</p><div className="mt-2 flex flex-wrap gap-2">{chips.map((chip) => <button key={chip} onClick={() => applyMutation(chip)} className="h-11 rounded bg-white/10 px-3 text-xs">{chip}</button>)}</div></Sheet>}
      {showTune && <Sheet title="Live Plan Tuning" onClose={() => setShowTune(false)}><TuningPanel tune={tune} onChange={applyTune} /></Sheet>}
      {showLate && <Sheet title="Running Late" onClose={() => setShowLate(false)}><div className="grid grid-cols-4 gap-2">{[10,20,30,45].map((m)=><button key={m} onClick={()=>applyRunningLate(m)} className="h-11 rounded bg-white/10 text-sm">+{m}</button>)}</div></Sheet>}
    </main>
  );
}

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return <div className="fixed inset-0 z-50 bg-slate-950/75 p-3"><div className="absolute inset-x-0 bottom-0 rounded-t-2xl border border-white/10 bg-slate-900 p-4"><div className="mb-2 flex items-center justify-between"><h3 className="text-sm font-semibold">{title}</h3><button onClick={onClose} className="h-11 rounded bg-white/10 px-3">Close</button></div>{children}</div></div>;
}

function SwipeDeck({ suggestions, onAdd, onSkip, onOptional }: { suggestions: PlannerSuggestion[]; onAdd: (s: PlannerSuggestion) => void; onSkip: (s: PlannerSuggestion) => void; onOptional: (s: PlannerSuggestion) => void }) {
  const [idx, setIdx] = useState(0);
  const current = suggestions[idx];
  if (!current) return <p className="text-sm text-slate-300">No more cards.</p>;
  const decide = (fn: (s: PlannerSuggestion) => void) => { fn(current); setIdx((i) => i + 1); };
  return <div className="rounded border border-white/10 bg-slate-800 p-3 text-sm"><p className="font-semibold">{current.title}</p><p className="text-xs text-slate-300">{current.why}</p><p className="text-xs text-slate-400">{current.durationMin}m • €{current.costEstimate}</p><div className="mt-3 grid grid-cols-3 gap-2"><button onClick={() => decide(onSkip)} className="h-11 rounded bg-white/10">← Skip</button><button onClick={() => decide(onOptional)} className="h-11 rounded bg-white/10">↑ Optional</button><button onClick={() => decide(onAdd)} className="h-11 rounded bg-cyan-500 font-semibold text-slate-900">→ Add</button></div></div>;
}

function TuningPanel({ tune, onChange }: { tune: { pace: number; walking: number; spend: number; crowd: number; photo: number }; onChange: (v: { pace: number; walking: number; spend: number; crowd: number; photo: number }) => void }) {
  const slider = (k: keyof typeof tune, label: string) => <label className="block text-xs">{label}<input type="range" min={0} max={100} value={tune[k]} onChange={(e)=>onChange({ ...tune, [k]: Number(e.target.value) })} className="mt-1 w-full" /></label>;
  return <div className="space-y-3">{slider("pace","Pace: Relaxed ↔ Aggressive")}{slider("walking","Walking: Minimal ↔ Active")}{slider("spend","Spend: Budget ↔ Comfort")}{slider("crowd","Crowd: Avoid ↔ Don’t care")}{slider("photo","Photo: Scenic ↔ Efficient")}</div>;
}
