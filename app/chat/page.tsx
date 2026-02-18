"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePlanning, type PlanStop } from "../components/PlanningProvider";

type Plan = "free" | "pro" | "unlimited";
const LIMITS: Record<Plan, number> = { free: 3, pro: 25, unlimited: Infinity };
const PLAN_STORAGE_KEY = "pt.plan";
const USAGE_STORAGE_KEY = "pt.usage";

type Role = "user" | "assistant";
type ChatMsg = { role: Role; content: string };
type UserSession = { id: string; email: string } | null;
type SavedItinerary = { id: string; port: string; itinerary_json: { stops?: PlanStop[] }; updated_at: string };

type AgentResult = {
  action?: "create_plan" | "modify_plan" | "answer_only";
  updatedStops?: Array<Partial<PlanStop> & { name: string }>;
  reasoning?: string;
  riskFactors?: string[];
  answer?: string;
};

function ymKey(d = new Date()) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}
function getStoredPlan(): Plan {
  if (typeof window === "undefined") return "free";
  return (localStorage.getItem(PLAN_STORAGE_KEY) as Plan) || "free";
}
function setStoredPlan(p: Plan) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PLAN_STORAGE_KEY, p);
}
function getUsage(): { month: string; count: number } {
  if (typeof window === "undefined") return { month: ymKey(), count: 0 };
  const raw = localStorage.getItem(USAGE_STORAGE_KEY);
  if (!raw) return { month: ymKey(), count: 0 };
  try {
    const parsed = JSON.parse(raw) as { month: string; count: number };
    if (parsed.month !== ymKey()) return { month: ymKey(), count: 0 };
    return parsed;
  } catch {
    return { month: ymKey(), count: 0 };
  }
}
function setUsage(u: { month: string; count: number }) {
  if (typeof window === "undefined") return;
  localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(u));
}

async function startCheckout(plan: "pro" | "unlimited", setBanner: (s: string | null) => void) {
  try {
    const res = await fetch(`/api/stripe/checkout?plan=${plan}`, { method: "POST", credentials: "include" });
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      const j = await res.json();
      if (!res.ok || !j?.url) throw new Error(j?.error || "Checkout failed.");
      window.location.href = j.url;
      return;
    }
    if (res.status === 303) {
      const loc = res.headers.get("location");
      if (loc) window.location.href = loc;
      return;
    }
    throw new Error("Unexpected checkout response.");
  } catch (e: any) {
    setBanner(e?.message || "Could not start checkout.");
  }
}

function extractStops(content: string, fallbackTime: string): Omit<PlanStop, "id">[] {
  const lines = content
    .split("\n")
    .map((l) => l.replace(/^[-*\d.)\s]+/, "").trim())
    .filter((l) => l.length > 8)
    .slice(0, 5);

  const unique = Array.from(new Set(lines));
  return unique.map((name, i) => ({
    name: name.slice(0, 64),
    startTime: fallbackTime,
    endTime: fallbackTime,
    durationMinutes: 45,
    transitFromPrevious: { method: i % 2 ? "taxi" : "walk", durationMinutes: i % 2 ? 14 : 10, cost: i % 2 ? 16 : 0 },
    visitCost: 0,
    lat: 41.38 + i * 0.01,
    lng: 2.17 + i * 0.01,
    notes: "Added from assistant response",
  }));
}

export default function ChatPage() {
  const planning = usePlanning();
  const [messages, setMessages] = useState<ChatMsg[]>([{ role: "assistant", content: "Cruise Day Operating System online. Share your port goal and time window." }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"chat" | "timeline" | "map" | "budget">("chat");
  const [newStopName, setNewStopName] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [plan, setPlan] = useState<Plan>(getStoredPlan());
  const [{ month, count }, setUsageState] = useState(getUsage());

  const [session, setSession] = useState<UserSession>(null);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [savedPlans, setSavedPlans] = useState<SavedItinerary[]>([]);

  const scrollerRef = useRef<HTMLDivElement>(null);
  const limit = LIMITS[plan];
  const atLimit = Math.max(0, limit - count) <= 0;

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (month !== ymKey()) {
      const fresh = { month: ymKey(), count: 0 };
      setUsageState(fresh);
      setUsage(fresh);
    }
  }, [month]);

  useEffect(() => {
    (async () => {
      try {
        const me = await fetch("/api/auth/me", { credentials: "include" }).then((r) => r.json());
        if (me.user) setSession(me.user);
      } catch {}

      try {
        const res = await fetch("/api/me", { credentials: "include" });
        if (!res.ok) return;
        const data = await res.json();
        const p = (data.plan || "free").toLowerCase() as Plan;
        if (p === "free" || p === "pro" || p === "unlimited") {
          setPlan(p);
          setStoredPlan(p);
        }
      } catch {}
    })();
  }, []);

  useEffect(() => {
    if (!session) return;
    (async () => {
      const rows = await fetch("/api/itineraries", { credentials: "include" }).then((r) => r.json()).catch(() => []);
      setSavedPlans(rows.filter((row: any) => row.user_id === session.id));
    })();
  }, [session]);

  async function loginOrSignup() {
    const endpoint = authMode === "login" ? "/api/auth/login" : "/api/auth/signup";
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      setBanner(data.error || "Auth failed.");
      return;
    }
    setSession(data);
    setBanner(`Signed in as ${data.email}`);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setSession(null);
  }

  async function savePlan(mode: "save" | "duplicate" = "save") {
    if (!session) {
      setBanner("Login required to save plans.");
      return;
    }

    const payload = {
      user_id: session.id,
      port: planning.port,
      ship_name: "PortTrip Planner",
      arrival_time: planning.arrivalTime,
      all_aboard_time: planning.allAboardTime,
      safety_buffer: 75,
      risk_score: planning.riskScore === "high" ? 85 : planning.riskScore === "amber" ? 60 : 25,
      itinerary_json: { stops: planning.stops, mode },
    };

    const res = await fetch("/api/itineraries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      setBanner("Could not save plan.");
      return;
    }
    const row = await res.json();
    setSavedPlans((prev) => [row, ...prev]);
    setBanner("Plan saved.");
  }

  async function renamePlan(id: string) {
    const name = prompt("Rename saved plan (port label):");
    if (!name) return;
    const res = await fetch(`/api/itineraries/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ port: name }),
    });
    if (!res.ok) return setBanner("Rename failed.");
    const updated = await res.json();
    setSavedPlans((prev) => prev.map((p) => (p.id === id ? updated : p)));
  }

  async function deletePlan(id: string) {
    const res = await fetch(`/api/itineraries/${id}`, { method: "DELETE", credentials: "include" });
    if (!res.ok) return setBanner("Delete failed.");
    setSavedPlans((prev) => prev.filter((p) => p.id !== id));
  }

  function loadPlan(row: SavedItinerary) {
    const stops = row.itinerary_json?.stops || [];
    if (Array.isArray(stops)) {
      planning.replaceStops(stops);
      planning.setPlanMeta({ port: row.port });
      planning.recalculate();
      setActiveTab("timeline");
      setBanner(`Loaded ${row.port}`);
    }
  }

  async function applyAgentResult(r: AgentResult, rawAnswer: string) {
    if (r.updatedStops?.length) {
      const mapped: PlanStop[] = r.updatedStops.map((s, i) => ({
        id: `ai_${Math.random().toString(36).slice(2, 8)}_${i}`,
        name: s.name,
        startTime: (s.startTime as string) || planning.arrivalTime,
        endTime: (s.endTime as string) || planning.arrivalTime,
        durationMinutes: Number(s.durationMinutes || 60),
        transitFromPrevious: s.transitFromPrevious || { method: "taxi", durationMinutes: 15, cost: 18 },
        visitCost: Number(s.visitCost || 0),
        lat: Number(s.lat || 41.38),
        lng: Number(s.lng || 2.17),
        notes: s.notes || "Route optimized for crowd avoidance and return safety.",
      }));
      planning.replaceStops(mapped);
      planning.recalculate();
      setActiveTab("timeline");
    }

    const text = r.reasoning || r.answer || rawAnswer;
    setMessages((m) => [...m, { role: "assistant", content: text || "Route updated." }]);
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading || atLimit) return;

    setInput("");
    setLoading(true);
    const nextUsage = { month: ymKey(), count: count + 1 };
    setUsageState(nextUsage);
    setUsage(nextUsage);
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          messages: next,
          query: text,
          cruiseContext: {
            cruiseLine: "Royal Caribbean",
            shipName: "Icon of the Seas",
            arrivalTime: planning.arrivalTime,
            allAboardTime: planning.allAboardTime,
            dockType: planning.port.toLowerCase().includes("santorini") ? "tender" : "dock",
            terminalName: `${planning.port} Cruise Terminal`,
          },
          personalization: { walking: planning.walkingPreference },
        }),
      });

      const ct = res.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        const data = await res.json();
        await applyAgentResult(data, JSON.stringify(data));
      } else {
        const reply = await res.text();
        try {
          const parsed = JSON.parse(reply) as AgentResult;
          await applyAgentResult(parsed, reply);
        } catch {
          setMessages((m) => [...m, { role: "assistant", content: reply }]);
        }
      }
    } catch {
      setBanner("Network issue. Retry.");
    } finally {
      setLoading(false);
    }
  }

  const riskClass = planning.riskScore === "high" ? "bg-rose-500/30 animate-pulse" : planning.riskScore === "amber" ? "bg-amber-500/30" : "bg-emerald-500/30";
  const transportTotal = planning.stops.reduce((sum, stop) => sum + (stop.transitFromPrevious.cost || 0), 0);
  const ticketsTotal = planning.stops.reduce((sum, stop) => sum + (stop.visitCost || 0), 0);
  const foodTotal = Math.max(0, planning.stops.length - 1) * 12;
  const miscTotal = Math.max(10, planning.stops.length * 4);
  const diyTotal = transportTotal + ticketsTotal + foodTotal + miscTotal;
  const savings = planning.shipExcursionBenchmark - diyTotal;

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-6 text-slate-100">
      <div className="mx-auto max-w-6xl">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
          <span className={`rounded-full px-3 py-1 ${riskClass}`}>Risk: {planning.riskScore}</span>
          <span className="rounded-full bg-white/10 px-3 py-1">Safe return target: {planning.safeReturnTime}</span>
          <SafeReturnCountdown safeReturnTime={planning.safeReturnTime} />
          <button onClick={() => startCheckout("pro", setBanner)} className="rounded bg-white/10 px-3 py-1">Upgrade Pro</button>
          <button onClick={() => savePlan("save")} className="rounded bg-cyan-500 px-3 py-1 text-slate-900">Save This Plan</button>
          <button onClick={() => savePlan("duplicate")} className="rounded bg-white/10 px-3 py-1">Duplicate Plan</button>
        </div>

        {banner && <div className="mb-3 rounded border border-amber-300/20 bg-amber-500/10 px-3 py-2 text-sm">{banner}</div>}

        <div className="mb-3 grid grid-cols-1 gap-2 rounded-xl border border-white/10 bg-white/5 p-3 md:grid-cols-4">
          <label className="text-xs">Port<input value={planning.port} onChange={(e) => planning.setPlanMeta({ port: e.target.value })} className="mt-1 w-full rounded bg-white/10 px-2 py-1" /></label>
          <label className="text-xs">Arrival<input type="time" value={planning.arrivalTime} onChange={(e) => planning.setPlanMeta({ arrivalTime: e.target.value })} className="mt-1 w-full rounded bg-white/10 px-2 py-1" /></label>
          <label className="text-xs">All aboard<input type="time" value={planning.allAboardTime} onChange={(e) => planning.setPlanMeta({ allAboardTime: e.target.value })} className="mt-1 w-full rounded bg-white/10 px-2 py-1" /></label>
          <label className="text-xs">Walking
            <select value={planning.walkingPreference} onChange={(e) => planning.setPlanMeta({ walkingPreference: e.target.value as any })} className="mt-1 w-full rounded bg-white/10 px-2 py-1">
              <option value="minimal">minimal</option><option value="moderate">moderate</option><option value="active">active</option>
            </select>
          </label>
        </div>

        <div className="mb-3 rounded-xl border border-white/10 bg-white/5 p-3">
          {session ? (
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <p>Signed in as <span className="font-semibold">{session.email}</span></p>
              <button onClick={logout} className="rounded bg-white/10 px-3 py-1">Logout</button>
            </div>
          ) : (
            <div className="grid gap-2 md:grid-cols-[auto_1fr_1fr_auto_auto]">
              <select value={authMode} onChange={(e) => setAuthMode(e.target.value as "login" | "signup")} className="rounded bg-white/10 px-2 py-1 text-sm">
                <option value="login">Login</option>
                <option value="signup">Sign up</option>
              </select>
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email" className="rounded bg-white/10 px-2 py-1 text-sm" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password" className="rounded bg-white/10 px-2 py-1 text-sm" />
              <button onClick={loginOrSignup} className="rounded bg-cyan-500 px-3 py-1 text-sm text-slate-900">Continue</button>
              <span className="text-xs text-slate-300">Login required to save plans</span>
            </div>
          )}

          {session && savedPlans.length > 0 ? (
            <div className="mt-3 space-y-2">
              <p className="text-xs uppercase text-slate-300">Saved plans</p>
              {savedPlans.slice(0, 6).map((row) => (
                <div key={row.id} className="flex flex-wrap items-center gap-2 rounded border border-white/10 bg-slate-900/60 px-3 py-2 text-sm">
                  <span className="font-medium">{row.port}</span>
                  <span className="text-xs text-slate-400">{new Date(row.updated_at).toLocaleString()}</span>
                  <button onClick={() => loadPlan(row)} className="rounded bg-white/10 px-2 py-1">Load</button>
                  <button onClick={() => renamePlan(row.id)} className="rounded bg-white/10 px-2 py-1">Rename</button>
                  <button onClick={() => savePlan("duplicate")} className="rounded bg-white/10 px-2 py-1">Duplicate</button>
                  <button onClick={() => deletePlan(row.id)} className="rounded bg-rose-500/30 px-2 py-1">Delete</button>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="mb-3 flex flex-wrap gap-2">
          {(["chat", "timeline", "map", "budget"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`rounded-full px-3 py-1 text-sm transition ${activeTab === tab ? "bg-cyan-500 text-slate-900" : "bg-white/10"}`}>
              {tab === "chat" ? "Tab 1 – Chat" : tab === "timeline" ? "Tab 2 – Timeline Builder" : tab === "map" ? "Tab 3 – Map View" : "Tab 4 – Budget"}
            </button>
          ))}
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-white/5 p-4 transition-all duration-300">
          {activeTab === "chat" && (
            <>
              <div ref={scrollerRef} className="min-h-[50vh] space-y-3">
                {messages.map((m, i) => (
                  <Bubble
                    key={i}
                    role={m.role}
                    content={m.content}
                    onAddStop={(content) => {
                      const stops = extractStops(content, planning.arrivalTime);
                      stops.forEach((stop) => planning.addStop(stop));
                      planning.recalculate();
                      setBanner(`${stops.length} stop(s) added to itinerary.`);
                      setActiveTab("timeline");
                    }}
                  />
                ))}
                {loading && <p className="text-sm text-slate-300">Planning…</p>}
              </div>
              <form onSubmit={handleSend} className="mt-3 flex gap-2">
                <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask: 6 hour plan Barcelona 09:00–15:00" className="flex-1 rounded-xl bg-white/10 px-3 py-2" />
                <button disabled={atLimit || loading} className="rounded-xl bg-cyan-500 px-4 py-2 font-medium text-slate-900">Ask</button>
              </form>
            </>
          )}

          {activeTab === "timeline" && (
            <>
              <div className="space-y-3">
                {planning.stops.map((s) => (
                  <div key={s.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-6">
                      <input value={s.startTime} onChange={(e) => planning.updateStop(s.id, { startTime: e.target.value })} className="rounded bg-white/10 px-2 py-1" />
                      <input value={s.endTime} onChange={(e) => planning.updateStop(s.id, { endTime: e.target.value })} className="rounded bg-white/10 px-2 py-1" />
                      <input value={s.name} onChange={(e) => planning.updateStop(s.id, { name: e.target.value })} className="rounded bg-white/10 px-2 py-1" />
                      <input value={s.durationMinutes} onChange={(e) => planning.updateStop(s.id, { durationMinutes: Number(e.target.value || 0) })} className="rounded bg-white/10 px-2 py-1" />
                      <input value={s.visitCost} onChange={(e) => planning.updateStop(s.id, { visitCost: Number(e.target.value || 0) })} className="rounded bg-white/10 px-2 py-1" />
                      <div className="flex gap-1">
                        <button onClick={() => planning.reorderStops(s.id, "up")} className="rounded bg-white/10 px-2">↑</button>
                        <button onClick={() => planning.reorderStops(s.id, "down")} className="rounded bg-white/10 px-2">↓</button>
                        <button onClick={() => planning.deleteStop(s.id)} className="rounded bg-rose-500/30 px-2">✕</button>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-slate-300">{s.startTime} – {s.endTime} {emojiForTransit(s.transitFromPrevious.method)} {s.transitFromPrevious.method} to {s.name}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <button onClick={() => setShowAdd(true)} className="rounded bg-white/10 px-3 py-1">Add stop</button>
                <button onClick={planning.recalculate} className="rounded bg-cyan-500 px-3 py-1 text-slate-900">Recalculate</button>
              </div>
              {showAdd && (
                <div className="mt-3 rounded-xl border border-white/10 bg-slate-900/90 p-3">
                  <input value={newStopName} onChange={(e) => setNewStopName(e.target.value)} placeholder="Stop name" className="rounded bg-white/10 px-2 py-1" />
                  <button onClick={() => { planning.addStop({ name: newStopName || "Custom stop", startTime: planning.arrivalTime, endTime: planning.arrivalTime, durationMinutes: 45, transitFromPrevious: { method: "taxi", durationMinutes: 12, cost: 14 }, visitCost: 10, lat: 41.39, lng: 2.17, notes: "" }); setShowAdd(false); setNewStopName(""); planning.recalculate(); }} className="ml-2 rounded bg-cyan-500 px-3 py-1 text-slate-900">Save</button>
                </div>
              )}
            </>
          )}

          {activeTab === "map" && <MapView stops={planning.stops} port={planning.port} safeReturnTime={planning.safeReturnTime} />}

          {activeTab === "budget" && (
            <div className="space-y-2 text-sm">
              <p>Transport: €{transportTotal.toFixed(0)}</p>
              <p>Tickets: €{ticketsTotal.toFixed(0)}</p>
              <p>Food: €{foodTotal.toFixed(0)}</p>
              <p>Misc: €{miscTotal.toFixed(0)}</p>
              <p className="font-semibold">DIY Total: €{diyTotal.toFixed(0)}</p>
              <p>Ship Excursion Benchmark: €{planning.shipExcursionBenchmark.toFixed(0)}</p>
              <p className={savings >= 0 ? "text-emerald-300" : "text-rose-300"}>Savings: €{savings.toFixed(0)}</p>
              {savings < 0 && <p className="rounded bg-rose-500/20 px-3 py-2">DIY currently exceeds ship benchmark. Reduce paid transfers or optional entries.</p>}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function Bubble({ role, content, onAddStop }: { role: Role; content: string; onAddStop: (c: string) => void }) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`${isUser ? "bg-cyan-500 text-slate-900" : "bg-white/10"} max-w-[85%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap`}>
        {content}
        {!isUser && (
          <button onClick={() => onAddStop(content)} className="mt-2 block text-xs underline text-cyan-300">➕ Add to itinerary</button>
        )}
      </div>
    </div>
  );
}

function emojiForTransit(m: string) {
  if (m === "taxi") return "🚖";
  if (m === "walk") return "🚶";
  if (m === "metro") return "🚇";
  return "🚌";
}

function SafeReturnCountdown({ safeReturnTime }: { safeReturnTime: string }) {
  const [txt, setTxt] = useState("");
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const [h, m] = safeReturnTime.split(":").map(Number);
      const t = new Date();
      t.setHours(h, m, 0, 0);
      const diff = t.getTime() - now.getTime();
      const mins = Math.max(0, Math.floor(diff / 60000));
      setTxt(`T-${mins}m to safe return`);
    }, 1000);
    return () => clearInterval(timer);
  }, [safeReturnTime]);
  return <span className="rounded-full bg-white/10 px-3 py-1">{txt}</span>;
}

function MapView({ stops, port, safeReturnTime }: { stops: PlanStop[]; port: string; safeReturnTime: string }) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!key || !mapRef.current) return;
    const id = "pt-gmaps";
    const init = () => {
      // @ts-ignore
      const g = window.google;
      if (!g || !mapRef.current) return;
      const center = stops[0] ? { lat: stops[0].lat, lng: stops[0].lng } : { lat: 41.385, lng: 2.173 };
      const map = new g.maps.Map(mapRef.current, { center, zoom: 12 });
      const terminal = new g.maps.Marker({ position: center, map, label: "T" });
      const pts = [center];
      stops.forEach((s, i) => {
        const p = { lat: s.lat, lng: s.lng };
        pts.push(p);
        new g.maps.Marker({ position: p, map, label: String(i + 1) });
      });
      new g.maps.Polyline({ path: pts, map, strokeColor: "#22d3ee", strokeWeight: 3 });
      if (pts.length > 1) new g.maps.Polyline({ path: [pts[pts.length - 1], center], map, strokeColor: "#ef4444", strokeWeight: 4 });
      terminal.setMap(map);
    };
    // @ts-ignore
    if (window.google?.maps) return init();
    if (!document.getElementById(id)) {
      const sc = document.createElement("script");
      sc.id = id;
      sc.src = `https://maps.googleapis.com/maps/api/js?key=${key}`;
      sc.async = true;
      sc.onload = init;
      document.body.appendChild(sc);
    }
  }, [stops, port]);

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-300">Route summary for {port}. Safe return target: {safeReturnTime}.</p>
      <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-200">
        {stops.length ? stops.map((stop) => <li key={stop.id}>{stop.startTime} {emojiForTransit(stop.transitFromPrevious.method)} {stop.name} ({stop.durationMinutes}m)</li>) : <li>No stops yet. Add from chat or timeline.</li>}
      </ol>
      <div ref={mapRef} className="h-[320px] w-full rounded-xl bg-slate-900/80" />
      {!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && (
        <div className="rounded bg-amber-500/20 px-3 py-2 text-sm">Map key not configured. Using route list mode as primary map view.</div>
      )}
    </div>
  );
}
