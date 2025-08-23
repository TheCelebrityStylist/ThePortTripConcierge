"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/* ---------- Plans & Limits ---------- */
type Plan = "free" | "pro" | "unlimited";
const LIMITS: Record<Plan, number> = { free: 3, pro: 25, unlimited: Infinity };

const PLAN_STORAGE_KEY = "pt.plan";
const USAGE_STORAGE_KEY = "pt.usage";

function ymKey(d = new Date()) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Local fallback so the app still behaves without auth/server. */
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

/* ---------- Types ---------- */
type Role = "user" | "assistant";
type ChatMsg = { role: Role; content: string };

/* ---------- Page ---------- */
export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      role: "assistant",
      content:
        "Welcome aboard 👋 I’m your **PortTrip Concierge**.\n\nTell me your **port** and **time window** (e.g., *Barcelona · 6 hours · 09:00–15:00*) plus any preferences (kids, mobility, budget)."
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);

  /* Plan & usage state */
  const [plan, setPlan] = useState<Plan>(getStoredPlan());
  const [{ month, count }, setUsageState] = useState(getUsage());

  const scrollerRef = useRef<HTMLDivElement>(null);

  /* Auto-scroll on new content */
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  /* Reset local usage each calendar month */
  useEffect(() => {
    const current = ymKey();
    if (month !== current) {
      const fresh = { month: current, count: 0 };
      setUsageState(fresh);
      setUsage(fresh);
    }
  }, [month]);

  /* Prefer plan from your server (if available) */
  useEffect(() => {
    (async () => {
      try {
        const url = new URL(window.location.href);
        const status = url.searchParams.get("status");
        if (status) {
          url.searchParams.delete("status");
          url.searchParams.delete("plan");
          url.searchParams.delete("session_id");
          window.history.replaceState({}, "", url.toString());
        }

        const res = await fetch("/api/me/plan", { credentials: "include" });
        if (res.ok) {
          const data = (await res.json()) as { plan?: string };
          const serverPlan = (data.plan || "free").toLowerCase() as Plan;
          if (serverPlan === "free" || serverPlan === "pro" || serverPlan === "unlimited") {
            setPlan(serverPlan);
            setStoredPlan(serverPlan);
          }
        }
      } catch {
        /* fall back to local plan */
      }
    })();
  }, []);

  /* Quick chips */
  const chips = useMemo(
    () => [
      "Best 6-hour plan from the cruise terminal",
      "Top 3 sights with minimal walking",
      "Mobility-friendly loop with rest stops",
      "Local food near the port",
      "Kid-friendly afternoon plan"
    ],
    []
  );

  const limit = LIMITS[plan];
  const remaining = Math.max(0, limit - count);
  const atLimit = remaining <= 0;

  /* Start Stripe Checkout (your server does 303 redirect or returns a JSON url) */
  async function startCheckout(planName: "pro" | "unlimited") {
    try {
      // Use the method you implemented. Two common patterns:

      // A) Server returns a JSON {url}; then navigate:
      const res = await fetch(`/api/stripe/checkout?plan=${planName}`, {
        method: "POST",
        credentials: "include",
      });
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        const j = await res.json();
        if (!res.ok || !j?.url) throw new Error(j?.error || "Checkout failed.");
        window.location.href = j.url;
        return;
      }

      // B) Server answers 303 Location (Edge-friendly). Just follow:
      if (res.status === 303) {
        const loc = res.headers.get("location");
        if (loc) window.location.href = loc;
        else throw new Error("Missing redirect location.");
        return;
      }

      throw new Error("Unexpected checkout response.");
    } catch (e: any) {
      setBanner(e?.message || "Could not start checkout.");
    }
  }

  /* Send handler (counts user prompts) */
  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading || atLimit) return;

    setBanner(null);

    // Optimistically bump usage
    const next = { month: ymKey(), count: count + 1 };
    setUsageState(next);
    setUsage(next);

    const nextHistory = [...messages, { role: "user" as const, content: text }];
    setMessages(nextHistory);
    setInput("");
    setLoading(true);

    const replyIndex = nextHistory.length;
    setMessages([...nextHistory, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Send plan & usage for optional server enforcement/logging
        body: JSON.stringify({
          plan,
          usage: next,
          messages: nextHistory,
          history: nextHistory
        }),
        credentials: "include"
      });

      const ct = res.headers.get("content-type") || "";

      // ---- NEW: handle upgrade-required path (HTTP 402 + code) ----
      if (res.status === 402 && ct.includes("application/json")) {
        const err = await res.json().catch(() => ({}));
        const code = (err?.code || "").toString();
        if (code === "FREE_LIMIT_REACHED" || code === "LIMIT_REACHED") {
          setMessages((m) => {
            const copy = [...m];
            copy[replyIndex] = {
              role: "assistant",
              content:
                "You’ve reached your plan’s monthly limit. Upgrade to keep planning — Pro raises the cap to **25 chats/month**, and Unlimited removes the cap."
            };
            return copy;
          });
          // roll back the optimistic count
          const rollback = { month: ymKey(), count };
          setUsageState(rollback);
          setUsage(rollback);
          setLoading(false);
          return;
        }
      }

      // Regular error (JSON body)
      if (!res.ok && ct.includes("application/json")) {
        const err = await res.json().catch(() => ({}));
        const msg = err?.message || err?.error || "The server rejected the request.";
        setMessages((m) => {
          const copy = [...m];
          copy[replyIndex] = { role: "assistant", content: `⚠️ ${msg}` };
          return copy;
        });
        // roll back usage
        const rollback = { month: ymKey(), count };
        setUsageState(rollback);
        setUsage(rollback);
        setLoading(false);
        return;
      }

      // Streaming (text/plain)
      if (!ct.includes("application/json") && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let acc = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          acc += decoder.decode(value, { stream: true });
          setMessages((m) => {
            const copy = [...m];
            copy[replyIndex] = { role: "assistant", content: acc };
            return copy;
          });
        }
      } else {
        // Non-stream JSON
        const data = await res.json().catch(() => ({}));
        const reply =
          data?.reply || data?.answer || data?.content || "Sorry — I couldn’t generate a reply.";
        setMessages((m) => {
          const copy = [...m];
          copy[replyIndex] = { role: "assistant", content: reply };
          return copy;
        });
      }
    } catch {
      setBanner("Network hiccup. Please try again.");
      setMessages((m) => {
        const copy = [...m];
        copy[replyIndex] = { role: "assistant", content: "I hit a network error. Try again shortly." };
        return copy;
      });
      // roll back usage on hard error
      const rollback = { month: ymKey(), count };
      setUsageState(rollback);
      setUsage(rollback);
    } finally {
      setLoading(false);
    }
  }

  /* ---------- UI ---------- */
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      {/* Ambient gradients */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 h-[48rem] w-[48rem] rounded-full bg-[radial-gradient(circle_at_center,_rgba(56,189,248,0.18),_transparent_60%)] blur-2xl" />
        <div className="absolute -bottom-40 -right-40 h-[52rem] w-[52rem] rounded-full bg-[radial-gradient(circle_at_center,_rgba(99,102,241,0.18),_transparent_60%)] blur-2xl" />
      </div>

      <div className="mx-auto max-w-6xl px-6 py-6">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🚢</span>
            <div className="text-xl font-semibold tracking-tight sm:text-2xl">
              PortTrip Concierge
            </div>
          </div>

          {/* Working buttons */}
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <span className="opacity-80">Plan:</span>
            <span className="rounded-full bg-white/10 px-2 py-0.5">{plan}</span>
            <button
              onClick={() => { setStoredPlan("free"); setPlan("free"); }}
              className="rounded px-2 py-0.5 hover:bg-white/10"
            >
              Start free
            </button>
            <button
              onClick={() => startCheckout("pro")}
              className="rounded px-2 py-0.5 hover:bg-white/10"
            >
              Upgrade to Pro
            </button>
            <button
              onClick={() => startCheckout("unlimited")}
              className="rounded px-2 py-0.5 hover:bg-white/10"
            >
              Go Unlimited
            </button>
          </div>
        </div>

        {/* Banner */}
        {banner && (
          <div className="mb-3 rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
            {banner}
          </div>
        )}

        {/* Usage */}
        <div className="mb-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300">
          {isFinite(limit) ? (
            <>Usage: <strong>{count}</strong> / {limit} this month ({Math.max(0, limit - count)} left)</>
          ) : (
            <>Usage: <strong>{count}</strong> / ∞</>
          )}
        </div>

        {/* Chat area */}
        <div
          ref={scrollerRef}
          className="min-h-[60vh] space-y-3 rounded-[24px] border border-white/15 bg-white/5 p-4 shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-6"
        >
          {messages.map((m, i) => <Bubble key={i} role={m.role} content={m.content} />)}
          {loading && <TypingBubble />}

          {atLimit && (
            <UpgradePrompt onPro={() => startCheckout("pro")} onUnlimited={() => startCheckout("unlimited")} />
          )}
        </div>

        {/* Chips */}
        <div className="mt-3 flex flex-wrap gap-2">
          {chips.map((c) => (
            <button
              key={c}
              onClick={() => setInput(c)}
              disabled={atLimit}
              className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm hover:bg-white/15 disabled:opacity-60"
            >
              {c}
            </button>
          ))}
        </div>

        {/* Composer */}
        <form onSubmit={handleSend} className="sticky bottom-0">
          <div className="mt-2 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder='Ask anything (e.g., “Barcelona · 6 hours · best plan from the cruise terminal?”)'
              disabled={atLimit}
              className="flex-1 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 shadow-inner placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={loading || atLimit}
              className="rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 px-6 py-3 font-medium text-white shadow-lg shadow-indigo-900/30 hover:from-sky-400 hover:to-indigo-500 disabled:opacity-60"
            >
              {atLimit ? "Limit reached" : loading ? "Planning…" : "Ask"}
            </button>
          </div>
          <p className="mt-2 text-[11px] text-slate-300">
            Tip: include <strong>arrival → all-aboard</strong> time + preferences
            (kids, mobility, budget) for a sharper plan.
          </p>
        </form>
      </div>
    </div>
  );
}

/* ---------- UI Pieces ---------- */

function UpgradePrompt({ onPro, onUnlimited }: { onPro: () => void; onUnlimited: () => void }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/8 p-4 text-sm text-slate-200">
      You’ve reached your plan’s chat limit. Upgrade to continue:
      <div className="mt-2 flex gap-2">
        <button
          onClick={onPro}
          className="rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600 px-3 py-2 text-sm font-medium"
        >
          Upgrade to Pro (25/month)
        </button>
        <button
          onClick={onUnlimited}
          className="rounded-lg bg-white/10 px-3 py-2 text-sm font-medium hover:bg-white/15"
        >
          Go Unlimited
        </button>
      </div>
    </div>
  );
}

function Bubble({ role, content }: { role: Role; content: string }) {
  const isUser = role === "user";
  const rowJustify = isUser ? "justify-end" : "justify-start";

  return (
    <div className={`flex w-full ${rowJustify}`}>
      <div className="flex max-w-[85%] items-start gap-3">
        {!isUser && (
          <div className="flex h-9 w-9 select-none items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 text-xs font-semibold text-white shadow-lg shadow-indigo-900/30">
            PT
          </div>
        )}
        <div
          className={
            isUser
              ? "whitespace-pre-wrap rounded-2xl rounded-br-sm bg-gradient-to-br from-sky-500 to-indigo-600 px-4 py-3 leading-relaxed text-white shadow-lg shadow-indigo-900/30"
              : "whitespace-pre-wrap rounded-2xl rounded-bl-sm border border-white/15 bg-white/8 px-4 py-3 leading-relaxed text-slate-100 shadow-sm backdrop-blur-md"
          }
          style={{ wordBreak: "break-word" }}
        >
          <Markdown text={content} />
        </div>
      </div>
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="flex justify-start">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 select-none items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 text-xs font-semibold text-white shadow-lg shadow-indigo-900/30">
          PT
        </div>
        <div className="rounded-2xl border border-white/15 bg-white/8 px-4 py-3 backdrop-blur-md">
          <Dots />
        </div>
      </div>
    </div>
  );
}

function Dots() {
  return (
    <div className="flex items-center gap-1">
      <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-sky-400 [animation-delay:-0.2s]" />
      <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-sky-300 [animation-delay:-0.1s]" />
      <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-sky-200" />
    </div>
  );
}

/* ---------- Minimal Markdown (tight spacing, correct lists) ---------- */
function Markdown({ text }: { text: string }) {
  const html = useMemo(() => {
    if (!text) return "";
    let t = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    t = t.replace(/\n{2,}/g, "\n\n");            // compact blank lines
    t = t.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    t = t.replace(/\*(.+?)\*/g, "<em>$1</em>");

    const lines = t.split("\n");
    const out: string[] = [];
    let ul = false, ol = false, justBroke = false;
    const close = () => { if (ul) out.push("</ul>"), ul = false; if (ol) out.push("</ol>"), ol = false; };

    for (const line of lines) {
      const mUL = line.match(/^\s*(?:-|•)\s+(.*)$/);
      const mOL = line.match(/^\s*\d+\.\s+(.*)$/);

      if (mUL) {
        if (!ul) { close(); out.push("<ul class='pl-5 list-disc'>"); ul = true; }
        out.push(`<li>${mUL[1]}</li>`); justBroke = false; continue;
      }
      if (mOL) {
        if (!ol) { close(); out.push("<ol class='pl-5 list-decimal'>"); ol = true; }
        out.push(`<li>${mOL[1]}</li>`); justBroke = false; continue;
      }
      if (line.trim() === "") {
        close();
        if (!justBroke) out.push("<br/>");
        justBroke = true;
        continue;
      }
      close();
      out.push(`<p>${line}</p>`); justBroke = false;
    }
    close();
    return out.join("");
  }, [text]);

  // eslint-disable-next-line react/no-danger
  return <div className="chat-md [&>p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5" dangerouslySetInnerHTML={{ __html: html }} />;
}

