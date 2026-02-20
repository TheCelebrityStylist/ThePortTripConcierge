"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { usePlanning } from "../components/PlanningProvider";
import type { DelayScenario, ItineraryStop, PlannerSuggestion, StopType, TripMode } from "../lib/types";
import { minToTime, parseTimeToMin, stopTypeFromTitle } from "../lib/plannerUtils";

const LazyMap = dynamic(() => import("../components/planner/PlannerMapView"), { ssr: false });

type Role = "user" | "assistant";
type ChatMsg = { role: Role; content: string };

function asSuggestion(raw: Partial<PlannerSuggestion> & { title: string }): PlannerSuggestion {
  return {
    title: raw.title,
    durationMin: raw.durationMin ?? 45,
    costEstimate: raw.costEstimate ?? 0,
    location: raw.location ?? "Port area",
    type: raw.type ?? stopTypeFromTitle(raw.title),
    tags: raw.tags,
    priority: raw.priority ?? 2,
    notes: raw.notes,
  };
}

function fallbackSuggestions(port: string): PlannerSuggestion[] {
  return [
    asSuggestion({ title: `${port} terminal transfer`, durationMin: 30, costEstimate: 12, location: `${port} cruise terminal`, type: "transport", tags: { returnCorridor: true }, priority: 1 }),
    asSuggestion({ title: `Old town core walk`, durationMin: 75, costEstimate: 0, location: `${port} old town`, type: "attraction", tags: { highQueue: true, outdoor: true }, priority: 2 }),
    asSuggestion({ title: `Market food break`, durationMin: 50, costEstimate: 25, location: `${port} market`, type: "food", tags: { indoor: true }, priority: 3 }),
    asSuggestion({ title: `Return corridor reset`, durationMin: 35, costEstimate: 8, location: `${port} port corridor`, type: "buffer", tags: { returnCorridor: true }, priority: 1 }),
  ];
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

function toStop(s: PlannerSuggestion, source: "chat" | "manual", strategy: "append" | "optional" | "near-end"): Omit<ItineraryStop, "id"> {
  const base: Omit<ItineraryStop, "id"> = {
    title: s.title,
    type: s.type,
    startTime: "",
    endTime: "",
    durationMin: s.durationMin,
    location: { name: s.location },
    costEstimate: s.costEstimate,
    notes: s.notes || "",
    source,
    priority: s.priority ?? 2,
    flexibleMin: 20,
    optional: strategy === "optional",
    tags: s.tags,
  };
  if (strategy === "near-end") base.tags = { ...(base.tags || {}), returnCorridor: true };
  return base;
}

function riskColor(score: number) {
  return score >= 70 ? "text-rose-300" : score >= 40 ? "text-amber-300" : "text-emerald-300";
}


function parseCoords(value: string): { lat: number; lng: number } | null {
  const latLng = value.match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
  if (latLng) return { lat: Number(latLng[1]), lng: Number(latLng[2]) };
  const q = value.match(/q=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (q) return { lat: Number(q[1]), lng: Number(q[2]) };
  return null;
}

export default function ChatPage() {
  const planning = usePlanning();
  const [activeTab, setActiveTab] = useState<"chat" | "timeline" | "map" | "budget" | "risk">("chat");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([{ role: "assistant", content: "Add your brief: port, time in port, all-aboard, walking level, interests, and budget. I’ll give a narrative plan with structured cards." }]);
  const [suggestions, setSuggestions] = useState<PlannerSuggestion[]>(fallbackSuggestions(planning.port));
  const [dragId, setDragId] = useState<string | null>(null);

  const [brief, setBrief] = useState({
    port: planning.port,
    timeInPort: "7–9h",
    walking: "moderate",
    interests: "history, views, local food",
    budget: "120",
    withKids: false,
    mobility: false,
  });

  const savings = planning.shipExcursionBenchmark - planning.totalBudget;
  const costPerHour = planning.scheduledStops.length ? planning.totalBudget / Math.max(1, planning.scheduledStops.reduce((a, s) => a + s.durationMin, 0) / 60) : 0;

  const applyBrief = () => {
    planning.setPlanMeta({
      portSlug: brief.port,
      assumptions: [
        `Time window: ${brief.timeInPort}`,
        `Walking: ${brief.walking}`,
        `Interests: ${brief.interests}`,
        `Budget target: €${brief.budget}`,
        brief.withKids ? "Traveling with kids" : "Adult-focused pacing",
        brief.mobility ? "Mobility support needed" : "Standard mobility",
      ],
    });
  };

  const nextStartTime = () => {
    if (!planning.scheduledStops.length) return "";
    return planning.scheduledStops[planning.scheduledStops.length - 1].endTime;
  };

  const addSuggestion = (s: PlannerSuggestion, strategy: "append" | "optional" | "near-end") => {
    const stop = toStop(s, "chat", strategy);
    const start = strategy === "append" ? nextStartTime() : "";
    planning.addStop({ ...stop, startTime: start, endTime: start ? minToTime(parseTimeToMin(start) + stop.durationMin) : "" });
    planning.recalculate();
    setActiveTab("timeline");
  };

  const replaceLast = (s: PlannerSuggestion) => {
    const last = planning.scheduledStops[planning.scheduledStops.length - 1];
    if (!last) return addSuggestion(s, "append");
    planning.updateStop(last.id, { ...toStop(s, "chat", "append"), startTime: last.startTime, endTime: minToTime(parseTimeToMin(last.startTime) + s.durationMin) });
    planning.recalculate();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const user = input.trim();
    setInput("");
    setMessages((m) => [...m, { role: "user", content: user }]);
    setLoading(true);
    applyBrief();

    const systemPrompt = `You are PortTrip AI Copilot. If key info is missing ask at most one concise question then still provide a plan. Return narrative prose and a JSON fenced block with suggestions [{title,durationMin,costEstimate,location,type,tags:{highQueue,indoor,outdoor,highWalk,returnCorridor},priority,notes}]. Context: ${JSON.stringify(brief)}.`;

    try {
      const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: [{ role: "system", content: systemPrompt }, ...messages, { role: "user", content: user }] }) });
      const data = await res.json();
      const reply = data?.message || data?.answer || "Built a balanced return-safe plan with optional cuts.";
      const parsed = tryExtractStructured(reply);
      setSuggestions(parsed.length ? parsed : fallbackSuggestions(brief.port));
      setMessages((m) => [...m, { role: "assistant", content: cleanAssistantText(reply) }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Network hiccup. I built a deterministic fallback plan with one high-priority return corridor." }]);
      setSuggestions(fallbackSuggestions(brief.port));
    } finally {
      setLoading(false);
    }
  };

  const setMode = (mode: TripMode) => {
    planning.setTripMode(mode);
    planning.autoOptimize();
  };

  const simulate = (scenario: DelayScenario) => {
    planning.applyDelayScenario(scenario);
    planning.recalculate();
    setActiveTab("risk");
  };

  const onDrop = (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    const from = planning.stops.findIndex((s) => s.id === dragId);
    const to = planning.stops.findIndex((s) => s.id === targetId);
    if (from < 0 || to < 0) return;
    const arr = [...planning.stops];
    const [item] = arr.splice(from, 1);
    arr.splice(to, 0, item);
    planning.replaceStops(arr);
    planning.recalculate();
    setDragId(null);
  };

  const exportNotes = async () => {
    const text = planning.scheduledStops.map((s) => `${s.startTime}–${s.endTime} ${s.title} (${s.location.name})`).join("\n");
    await navigator.clipboard.writeText(text || "No scheduled stops yet.");
  };

  const exportIcs = () => {
    const d = planning.plan.date.replace(/-/g, "");
    const events = planning.scheduledStops.map((s) => `BEGIN:VEVENT\nDTSTART:${d}T${s.startTime.replace(":", "")}00\nDTEND:${d}T${s.endTime.replace(":", "")}00\nSUMMARY:${s.title}\nLOCATION:${s.location.name}\nEND:VEVENT`).join("\n");
    const ics = `BEGIN:VCALENDAR\nVERSION:2.0\n${events}\nEND:VCALENDAR`;
    const blob = new Blob([ics], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `porttrip-${planning.port}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const budgetRows = useMemo(() => [
    { label: "Attractions", value: planning.budgetByType.attraction },
    { label: "Food", value: planning.budgetByType.food },
    { label: "Transport", value: planning.budgetByType.transport },
    { label: "Buffers", value: planning.budgetByType.buffer },
  ], [planning.budgetByType]);

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-slate-100">
      <div className="mx-auto max-w-7xl space-y-4">
        <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <input value={planning.port} onChange={(e) => planning.setPlanMeta({ portSlug: e.target.value })} className="rounded bg-slate-900 px-2 py-1" />
            <span>Must return by</span>
            <input type="time" value={planning.safeReturnTime} onChange={(e) => planning.setPlanMeta({ mustReturnByTime: e.target.value })} className="rounded bg-slate-900 px-2 py-1" />
            <span>Buffer</span>
            <input type="number" value={planning.plan.bufferMinutes} onChange={(e) => planning.setPlanMeta({ bufferMinutes: Number(e.target.value) || 60 })} className="w-16 rounded bg-slate-900 px-2 py-1" />
            <span className={`${riskColor(planning.riskScore)} font-semibold`}>Risk {planning.riskScore}/100</span>
            <button onClick={planning.autoOptimize} className="rounded bg-cyan-500 px-3 py-1 font-semibold text-slate-900">Auto-Optimize</button>
            <button onClick={() => simulate("traffic25")} className="rounded bg-white/10 px-3 py-1">Simulate Delay</button>
            <button onClick={() => window.print()} className="rounded bg-white/10 px-3 py-1">Export</button>
            <button onClick={exportNotes} className="rounded bg-white/10 px-3 py-1">Save</button>
          </div>
          <p className="mt-2 text-sm text-slate-300">{planning.commandBanner}</p>
          <div className="mt-2 flex gap-2 text-xs">
            <button onClick={() => setMode("balanced")} className="rounded bg-white/10 px-2 py-1">Balanced</button>
            <button onClick={() => setMode("aggressive")} className="rounded bg-white/10 px-2 py-1">Aggressive</button>
            <button onClick={() => setMode("relaxed")} className="rounded bg-white/10 px-2 py-1">Relaxed</button>
            <button onClick={exportIcs} className="rounded bg-white/10 px-2 py-1">Calendar .ics</button>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <h2 className="text-sm font-semibold uppercase text-slate-300">Brief Builder</h2>
          <div className="mt-2 grid gap-2 md:grid-cols-3">
            <input value={brief.port} onChange={(e) => setBrief({ ...brief, port: e.target.value })} className="rounded bg-slate-900 px-3 py-2 text-sm" placeholder="Port" />
            <input value={brief.timeInPort} onChange={(e) => setBrief({ ...brief, timeInPort: e.target.value })} className="rounded bg-slate-900 px-3 py-2 text-sm" placeholder="Time in port" />
            <input value={brief.walking} onChange={(e) => setBrief({ ...brief, walking: e.target.value })} className="rounded bg-slate-900 px-3 py-2 text-sm" placeholder="Walking level" />
            <input value={brief.interests} onChange={(e) => setBrief({ ...brief, interests: e.target.value })} className="rounded bg-slate-900 px-3 py-2 text-sm" placeholder="Interests" />
            <input value={brief.budget} onChange={(e) => setBrief({ ...brief, budget: e.target.value })} className="rounded bg-slate-900 px-3 py-2 text-sm" placeholder="Budget" />
            <div className="flex items-center gap-3 text-sm"><label><input type="checkbox" checked={brief.withKids} onChange={(e) => setBrief({ ...brief, withKids: e.target.checked })} /> with kids</label><label><input type="checkbox" checked={brief.mobility} onChange={(e) => setBrief({ ...brief, mobility: e.target.checked })} /> mobility</label></div>
          </div>
        </section>

        <div className="flex flex-wrap gap-2">
          {(["chat", "timeline", "map", "budget", "risk"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`rounded-full px-3 py-1 text-sm ${activeTab === tab ? "bg-cyan-500 text-slate-900" : "bg-white/10"}`}>{tab.toUpperCase()}</button>
          ))}
        </div>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
          {activeTab === "chat" && (
            <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
              <div>
                <div className="h-[300px] space-y-2 overflow-auto rounded-lg bg-slate-900/80 p-3">
                  {messages.map((m, i) => <p key={`${m.role}-${i}`} className={`rounded-lg p-2 text-sm whitespace-pre-wrap ${m.role === "user" ? "bg-cyan-500 text-slate-900" : "bg-white/10"}`}>{m.content}</p>)}
                </div>
                <form onSubmit={submit} className="mt-3 flex gap-2">
                  <input value={input} onChange={(e) => setInput(e.target.value)} className="flex-1 rounded bg-slate-900 px-3 py-2 text-sm" placeholder="Ask for a plan" />
                  <button type="submit" className="rounded bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-900">Send</button>
                </form>
              </div>
              <div className="space-y-2">
                {suggestions.map((s, i) => (
                  <div key={`${s.title}-${i}`} className="rounded-lg border border-white/10 bg-slate-900/80 p-3 text-sm">
                    <p className="font-semibold">{s.title}</p>
                    <p className="text-slate-300">{s.durationMin}m • €{s.costEstimate} • {s.location}</p>
                    <p className="text-xs text-slate-400">tags: {Object.entries(s.tags || {}).filter(([,v]) => v).map(([k]) => k).join(", ") || "none"} • priority {s.priority ?? 2}</p>
                    <div className="mt-2 flex flex-wrap gap-1 text-xs">
                      <button onClick={() => addSuggestion(s, "append")} className="rounded bg-cyan-500 px-2 py-1 font-semibold text-slate-900">Add</button>
                      <button onClick={() => addSuggestion(s, "optional")} className="rounded bg-white/10 px-2 py-1">Add as Optional</button>
                      <button onClick={() => addSuggestion(s, "near-end")} className="rounded bg-white/10 px-2 py-1">Add near End</button>
                      <button onClick={() => replaceLast(s)} className="rounded bg-white/10 px-2 py-1">Replace Stop</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "timeline" && (
            <div className="space-y-3">
              <div className="grid gap-2 md:grid-cols-3">
                {planning.checkpoints.map((c) => <div key={c.label} className={`rounded border px-3 py-2 text-sm ${c.status === "ok" ? "border-emerald-500/40" : c.status === "warn" ? "border-amber-500/40" : "border-rose-500/40"}`}>{c.label}: {c.time}</div>)}
              </div>
              {planning.scheduledStops.map((s) => (
                <div key={s.id} draggable onDragStart={() => setDragId(s.id)} onDragOver={(e) => e.preventDefault()} onDrop={() => onDrop(s.id)} className="rounded-lg border border-white/10 bg-slate-900/80 p-3 text-sm">
                  <div className="grid gap-2 md:grid-cols-[28px_1fr_90px_90px_80px_95px_auto]">
                    <span className="cursor-move">⋮⋮</span>
                    <input value={s.title} onChange={(e) => planning.updateStop(s.id, { title: e.target.value })} className="rounded bg-slate-800 px-2 py-1" />
                    <input type="time" value={s.startTime} onChange={(e) => planning.updateStop(s.id, { startTime: e.target.value })} className="rounded bg-slate-800 px-2 py-1" />
                    <input type="time" value={s.endTime} onChange={(e) => planning.updateStop(s.id, { endTime: e.target.value })} className="rounded bg-slate-800 px-2 py-1" />
                    <input type="number" value={s.durationMin} onChange={(e) => planning.updateStop(s.id, { durationMin: Number(e.target.value) || 0 })} className="rounded bg-slate-800 px-2 py-1" />
                    <select value={s.type} onChange={(e) => planning.updateStop(s.id, { type: e.target.value as StopType })} className="rounded bg-slate-800 px-2 py-1"><option value="attraction">attraction</option><option value="food">food</option><option value="transport">transport</option><option value="buffer">buffer</option></select>
                    <input placeholder="lat" value={typeof s.location.lat === "number" ? String(s.location.lat) : ""} onChange={(e) => planning.updateStop(s.id, { location: { ...s.location, lat: e.target.value ? Number(e.target.value) : undefined } })} className="rounded bg-slate-800 px-2 py-1" />
                    <input placeholder="lng" value={typeof s.location.lng === "number" ? String(s.location.lng) : ""} onChange={(e) => planning.updateStop(s.id, { location: { ...s.location, lng: e.target.value ? Number(e.target.value) : undefined } })} className="rounded bg-slate-800 px-2 py-1" />
                    <div className="flex gap-1"><button onClick={() => planning.updateStop(s.id, { type: "buffer" })} className="rounded bg-white/10 px-2">Buffer</button><button onClick={() => planning.updateStop(s.id, { optional: true, startTime: "", endTime: "" })} className="rounded bg-white/10 px-2">Optional</button><button onClick={() => planning.deleteStop(s.id)} className="rounded bg-rose-500/20 px-2">✕</button></div>
                    <input onBlur={(e) => { const c = parseCoords(e.target.value); if (c) planning.updateStop(s.id, { location: { ...s.location, lat: c.lat, lng: c.lng } }); }} placeholder="Paste map link or lat,lng" className="mt-2 w-full rounded bg-slate-800 px-2 py-1 text-xs" />
                  </div>
                </div>
              ))}
              {planning.unscheduledStops.length > 0 && <div className="rounded border border-dashed border-white/20 p-3 text-sm"><p className="font-semibold">Optional / Unscheduled</p><ul className="mt-2 list-disc pl-5 text-slate-300">{planning.unscheduledStops.map((s) => <li key={s.id}>{s.title} ({s.durationMin}m)</li>)}</ul></div>}
            </div>
          )}

          {activeTab === "map" && <LazyMap stops={planning.scheduledStops} port={planning.port} mustReturnByTime={planning.safeReturnTime} />}

          {activeTab === "budget" && (
            <div className="space-y-2 text-sm">
              {budgetRows.map((r) => <p key={r.label}>{r.label}: €{r.value.toFixed(0)}</p>)}
              <p>Time wasted estimate (queues + transfers): {planning.wastedMinutes}m</p>
              <p className="font-semibold">DIY total: €{planning.totalBudget.toFixed(0)}</p>
              <div className="flex items-center gap-2"><span>Ship excursion benchmark</span><input type="number" value={planning.shipExcursionBenchmark} onChange={(e) => planning.setPlanMeta({ shipExcursionBenchmark: Number(e.target.value) || 0 })} className="w-24 rounded bg-slate-900 px-2 py-1" /></div>
              <p className={savings >= 0 ? "text-emerald-300" : "text-rose-300"}>Savings: €{savings.toFixed(0)}</p>
              <p>Cost per hour: €{costPerHour.toFixed(1)}</p>
              {planning.budgetByType.transport > planning.totalBudget * 0.45 && <p className="rounded bg-amber-500/20 px-3 py-2">Budget risk: transport is dominating spend. Consider fewer transfers.</p>}
              {savings < 0 && <p className="rounded bg-rose-500/20 px-3 py-2">Consider ship excursion for reliability; DIY currently costs more and holds less margin.</p>}
            </div>
          )}

          {activeTab === "risk" && (
            <div className="space-y-3 text-sm">
              <p className={`${riskColor(planning.riskScore)} font-semibold`}>Current risk score: {planning.riskScore}/100 ({planning.riskLevel})</p>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => simulate("tender20")} className="rounded bg-white/10 px-3 py-1">Tender delay +20</button>
                <button onClick={() => simulate("traffic25")} className="rounded bg-white/10 px-3 py-1">Traffic spike +25</button>
                <button onClick={() => simulate("queue30")} className="rounded bg-white/10 px-3 py-1">Attraction queue +30</button>
                <button onClick={() => simulate("lost15")} className="rounded bg-white/10 px-3 py-1">Lost time +15</button>
              </div>
              <ul className="list-disc pl-5 text-slate-300">{planning.cutSuggestions.map((s) => <li key={s}>{s}</li>)}</ul>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
