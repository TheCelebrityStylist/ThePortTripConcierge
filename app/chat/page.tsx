"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { usePlanning } from "../components/PlanningProvider";
import type { DelayScenario, ItineraryStop, PlannerSuggestion, StopType } from "../lib/types";
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
    notes: raw.notes,
  };
}

function fallbackSuggestions(port: string): PlannerSuggestion[] {
  return [
    asSuggestion({ title: `${port} terminal exit + transfer`, durationMin: 30, costEstimate: 12, location: `${port} cruise terminal`, type: "transport", notes: "First corridor setup" }),
    asSuggestion({ title: `Old town orientation walk`, durationMin: 70, costEstimate: 0, location: `${port} old town`, type: "attraction" }),
    asSuggestion({ title: `Local food stop`, durationMin: 55, costEstimate: 22, location: `${port} market district`, type: "food" }),
    asSuggestion({ title: `Return buffer + port re-entry`, durationMin: 40, costEstimate: 8, location: `${port} return corridor`, type: "buffer" }),
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

function cleanAssistantText(content: string) {
  return content.replace(/```json[\s\S]*?```/gi, "").trim();
}

function nextStartTime(stops: ItineraryStop[]) {
  const scheduled = stops.filter((s) => s.startTime).sort((a, b) => parseTimeToMin(a.startTime) - parseTimeToMin(b.startTime));
  if (!scheduled.length) return "";
  return scheduled[scheduled.length - 1].endTime;
}

export default function ChatPage() {
  const planning = usePlanning();
  const [activeTab, setActiveTab] = useState<"chat" | "timeline" | "map" | "budget">("chat");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: "assistant", content: "Tell me your port, arrival time, all-aboard time, walking tolerance, interests, and budget. I’ll draft a return-safe day plan." },
  ]);
  const [suggestions, setSuggestions] = useState<PlannerSuggestion[]>(fallbackSuggestions(planning.port));

  const [portSlug, setPortSlug] = useState(planning.port);
  const [arrivalTime, setArrivalTime] = useState("09:00");
  const [allAboardTime, setAllAboardTime] = useState(planning.allAboardTime);
  const [mustReturnByTime, setMustReturnByTime] = useState(planning.safeReturnTime);
  const [walking, setWalking] = useState("moderate");
  const [interests, setInterests] = useState("old town, viewpoints, local food");
  const [budget, setBudget] = useState("120");

  const savings = planning.shipExcursionBenchmark - planning.totalBudget;

  const applyMeta = () => {
    planning.setPlanMeta({
      portSlug,
      allAboardTime,
      mustReturnByTime,
      assumptions: [
        `Walking tolerance: ${walking}`,
        `Interests: ${interests}`,
        `DIY budget target: ${budget}`,
      ],
    });
  };

  const addSuggestionToPlan = (s: PlannerSuggestion) => {
    const start = nextStartTime(planning.stops);
    planning.addStop({
      title: s.title,
      type: s.type,
      startTime: start,
      endTime: start ? minToTime(parseTimeToMin(start) + s.durationMin) : "",
      durationMin: s.durationMin,
      location: { name: s.location },
      costEstimate: s.costEstimate,
      notes: s.notes || "Added from chat suggestion",
      source: "chat",
    });
    planning.recalculate();
    setActiveTab("timeline");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const user = input.trim();
    setInput("");
    setMessages((m) => [...m, { role: "user", content: user }]);
    applyMeta();
    setLoading(true);

    const systemPrompt = `You are PortTrip planner AI. Reply with a vivid narrative plan and include JSON in a fenced block under key suggestions: [{title,durationMin,costEstimate,location,type,notes}]. Context: port=${portSlug}, arrival=${arrivalTime}, allAboard=${allAboardTime}, mustReturnBy=${mustReturnByTime}, walking=${walking}, interests=${interests}, budget=${budget}.`;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "system", content: systemPrompt }, ...messages, { role: "user", content: user }] }),
      });
      const data = await res.json();
      const reply = data?.message || data?.answer || "I built a conservative plan with buffers and a simple return corridor.";
      const extracted = tryExtractStructured(reply);
      setSuggestions(extracted.length ? extracted : fallbackSuggestions(portSlug));
      setMessages((m) => [...m, { role: "assistant", content: cleanAssistantText(reply) }]);
    } catch {
      const narrative = `Great brief. Start by protecting your return corridor in ${portSlug}, keep one optional stop, and lock a hard cut point 90 minutes before must-return. I generated structured suggestions below so you can add them with one click.`;
      setMessages((m) => [...m, { role: "assistant", content: narrative }]);
      setSuggestions(fallbackSuggestions(portSlug));
    } finally {
      setLoading(false);
    }
  };

  const budgetRows = useMemo(
    () => [
      { label: "Attractions", value: planning.budgetByType.attraction },
      { label: "Food", value: planning.budgetByType.food },
      { label: "Transport", value: planning.budgetByType.transport },
      { label: "Buffer/Misc", value: planning.budgetByType.buffer },
    ],
    [planning.budgetByType]
  );

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-slate-100">
      <div className="mx-auto max-w-7xl space-y-4">
        <header className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <h1 className="text-2xl font-semibold">Cruise Day Planner Workspace</h1>
          <p className="text-sm text-slate-300">Chat to plan, convert suggestions in one click, then tune timeline, map, budget, and delay simulation.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <input value={portSlug} onChange={(e) => setPortSlug(e.target.value)} className="rounded-lg bg-slate-900 px-3 py-2 text-sm" placeholder="port slug" />
            <input type="time" value={arrivalTime} onChange={(e) => setArrivalTime(e.target.value)} className="rounded-lg bg-slate-900 px-3 py-2 text-sm" />
            <input type="time" value={allAboardTime} onChange={(e) => setAllAboardTime(e.target.value)} className="rounded-lg bg-slate-900 px-3 py-2 text-sm" />
            <input type="time" value={mustReturnByTime} onChange={(e) => setMustReturnByTime(e.target.value)} className="rounded-lg bg-slate-900 px-3 py-2 text-sm" />
            <input value={walking} onChange={(e) => setWalking(e.target.value)} className="rounded-lg bg-slate-900 px-3 py-2 text-sm" placeholder="walking tolerance" />
            <input value={interests} onChange={(e) => setInterests(e.target.value)} className="rounded-lg bg-slate-900 px-3 py-2 text-sm" placeholder="interests" />
            <input value={budget} onChange={(e) => setBudget(e.target.value)} className="rounded-lg bg-slate-900 px-3 py-2 text-sm" placeholder="budget" />
            <button onClick={applyMeta} className="rounded-lg bg-cyan-500 px-3 py-2 text-sm font-semibold text-slate-900">Update planner context</button>
          </div>
        </header>

        <div className="flex flex-wrap gap-2">
          {(["chat", "timeline", "map", "budget"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`rounded-full px-3 py-1 text-sm ${activeTab === tab ? "bg-cyan-500 text-slate-900" : "bg-white/10"}`}>
              {tab === "chat" ? "Tab 1 Chat" : tab === "timeline" ? "Tab 2 Timeline" : tab === "map" ? "Tab 3 Map" : "Tab 4 Budget"}
            </button>
          ))}
        </div>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
          {activeTab === "chat" && (
            <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr]">
              <div>
                <div className="h-[360px] space-y-2 overflow-auto rounded-lg bg-slate-900/80 p-3">
                  {messages.map((m, i) => (
                    <div key={`${m.role}-${i}`} className={`rounded-lg p-2 text-sm whitespace-pre-wrap ${m.role === "user" ? "bg-cyan-500 text-slate-900" : "bg-white/10"}`}>
                      {m.content}
                    </div>
                  ))}
                  {loading && <p className="text-sm text-slate-400">Thinking…</p>}
                </div>
                <form onSubmit={submit} className="mt-3 flex gap-2">
                  <input value={input} onChange={(e) => setInput(e.target.value)} className="flex-1 rounded-lg bg-slate-900 px-3 py-2 text-sm" placeholder="Ask for a return-safe plan with specifics" />
                  <button type="submit" className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-900">Send</button>
                </form>
              </div>
              <div>
                <h2 className="text-sm font-semibold uppercase text-slate-300">Structured suggestions</h2>
                <div className="mt-2 space-y-2">
                  {suggestions.map((s, idx) => (
                    <div key={`${s.title}-${idx}`} className="rounded-lg border border-white/10 bg-slate-900/80 p-3 text-sm">
                      <p className="font-semibold">{s.title}</p>
                      <p className="text-slate-300">{s.durationMin}m · €{s.costEstimate} · {s.location}</p>
                      <button onClick={() => addSuggestionToPlan(s)} className="mt-2 rounded bg-cyan-500 px-3 py-1 text-xs font-semibold text-slate-900">Add to plan</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "timeline" && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <button onClick={planning.autoSequence} className="rounded bg-cyan-500 px-3 py-1 text-sm font-semibold text-slate-900">Auto-sequence + buffers</button>
                <button onClick={planning.recalculate} className="rounded bg-white/10 px-3 py-1 text-sm">Recalculate risk</button>
                <button onClick={() => planning.addStop({ title: "Manual stop", type: "attraction", startTime: "", endTime: "", durationMin: 45, location: { name: "Choose location" }, costEstimate: 0, notes: "", source: "manual" })} className="rounded bg-white/10 px-3 py-1 text-sm">Add stop</button>
              </div>

              <div className="rounded-xl border border-white/10 bg-slate-900/70 p-3">
                <p className="text-sm font-semibold">Return-safe simulator</p>
                <div className="mt-2 flex flex-wrap gap-2 text-sm">
                  <button onClick={() => planning.applyDelayScenario("tender20")} className="rounded bg-white/10 px-3 py-1">Tender delay +20m</button>
                  <button onClick={() => planning.applyDelayScenario("taxi15")} className="rounded bg-white/10 px-3 py-1">Taxi delay +15m</button>
                  <button onClick={() => planning.applyDelayScenario("queue25")} className="rounded bg-white/10 px-3 py-1">Queue at attraction +25m</button>
                </div>
                <div className="mt-2 text-sm">
                  <p>Risk: <span className={planning.riskScore === "high" ? "text-rose-300" : planning.riskScore === "amber" ? "text-amber-300" : "text-emerald-300"}>{planning.riskScore}</span> · Must return by {planning.safeReturnTime}</p>
                  <ul className="mt-1 list-disc pl-5 text-slate-300">{planning.cutSuggestions.map((s) => <li key={s}>{s}</li>)}</ul>
                </div>
              </div>

              <div className="grid gap-2 md:grid-cols-3">
                {planning.checkpoints.map((c) => (
                  <div key={c.label} className={`rounded border px-3 py-2 text-sm ${c.status === "ok" ? "border-emerald-500/40" : c.status === "warn" ? "border-amber-500/40" : "border-rose-500/40"}`}>
                    <p className="font-semibold">{c.label}</p>
                    <p>{c.time}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                {planning.stops.filter((s) => s.startTime).sort((a, b) => parseTimeToMin(a.startTime) - parseTimeToMin(b.startTime)).map((s) => (
                  <div key={s.id} className="rounded-lg border border-white/10 bg-slate-900/80 p-3 text-sm">
                    <div className="grid gap-2 md:grid-cols-[1fr_90px_90px_90px_110px_auto]">
                      <input value={s.title} onChange={(e) => planning.updateStop(s.id, { title: e.target.value })} className="rounded bg-slate-800 px-2 py-1" />
                      <input type="time" value={s.startTime} onChange={(e) => planning.updateStop(s.id, { startTime: e.target.value })} className="rounded bg-slate-800 px-2 py-1" />
                      <input type="time" value={s.endTime} onChange={(e) => planning.updateStop(s.id, { endTime: e.target.value })} className="rounded bg-slate-800 px-2 py-1" />
                      <input type="number" value={s.durationMin} onChange={(e) => planning.updateStop(s.id, { durationMin: Number(e.target.value) || 0 })} className="rounded bg-slate-800 px-2 py-1" />
                      <select value={s.type} onChange={(e) => planning.updateStop(s.id, { type: e.target.value as StopType })} className="rounded bg-slate-800 px-2 py-1">
                        <option value="attraction">attraction</option><option value="food">food</option><option value="transport">transport</option><option value="buffer">buffer</option>
                      </select>
                      <div className="flex gap-1">
                        <button onClick={() => planning.reorderStops(s.id, "up")} className="rounded bg-white/10 px-2">↑</button>
                        <button onClick={() => planning.reorderStops(s.id, "down")} className="rounded bg-white/10 px-2">↓</button>
                        <button onClick={() => planning.deleteStop(s.id)} className="rounded bg-rose-500/20 px-2">✕</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {planning.unscheduledStops.length > 0 && (
                <div className="rounded-lg border border-dashed border-white/20 p-3 text-sm">
                  <p className="font-semibold">Unscheduled</p>
                  <ul className="mt-2 list-disc pl-5 text-slate-300">{planning.unscheduledStops.map((s) => <li key={s.id}>{s.title} ({s.durationMin}m)</li>)}</ul>
                </div>
              )}
            </div>
          )}

          {activeTab === "map" && <LazyMap stops={planning.stops.filter((s) => s.startTime)} port={planning.port} mustReturnByTime={planning.safeReturnTime} />}

          {activeTab === "budget" && (
            <div className="space-y-2 text-sm">
              {budgetRows.map((r) => <p key={r.label}>{r.label}: €{r.value.toFixed(0)}</p>)}
              <p className="font-semibold">DIY total: €{planning.totalBudget.toFixed(0)}</p>
              <div className="flex items-center gap-2">
                <span>Ship excursion benchmark:</span>
                <input type="number" value={planning.shipExcursionBenchmark} onChange={(e) => planning.setPlanMeta({ shipExcursionBenchmark: Number(e.target.value) || 0 })} className="w-24 rounded bg-slate-900 px-2 py-1" />
              </div>
              <p className={savings >= 0 ? "text-emerald-300" : "text-rose-300"}>Estimated savings: €{savings.toFixed(0)}</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
