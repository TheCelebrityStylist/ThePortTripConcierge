"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Role = "user" | "assistant";
type ChatMsg = { role: Role; content: string };

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

  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

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

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setBanner(null);
    const history = [...messages, { role: "user" as const, content: text }];
    setMessages(history);
    setInput("");
    setLoading(true);

    const idx = history.length;
    setMessages([...history, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, history, fallbackGeneral: true })
      });

      const ct = res.headers.get("content-type") || "";
      if (!res.ok && ct.includes("application/json")) {
        const err = await res.json().catch(() => ({}));
        const msg = err?.message || err?.error || "The server rejected the request.";
        setMessages((m) => {
          const copy = [...m];
          copy[idx] = { role: "assistant", content: `⚠️ ${msg}` };
          return copy;
        });
        setLoading(false);
        return;
      }

      if (!ct.includes("application/json") && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let acc = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          acc += decoder.decode(value);
          setMessages((m) => {
            const copy = [...m];
            copy[idx] = { role: "assistant", content: acc };
            return copy;
          });
        }
      } else {
        const data = await res.json().catch(() => ({}));
        const reply = data?.reply || data?.answer || data?.content || "Sorry — I couldn’t generate a reply.";
        setMessages((m) => {
          const copy = [...m];
          copy[idx] = { role: "assistant", content: reply };
          return copy;
        });
      }
    } catch {
      setBanner("Network hiccup. Please try again.");
      setMessages((m) => {
        const copy = [...m];
        copy[idx] = { role: "assistant", content: "I hit a network error. Try again shortly." };
        return copy;
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      {/* deco gradients */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 w-[48rem] h-[48rem] rounded-full bg-[radial-gradient(circle_at_center,_rgba(56,189,248,0.18),_transparent_60%)] blur-2xl" />
        <div className="absolute -bottom-40 -right-40 w-[52rem] h-[52rem] rounded-full bg-[radial-gradient(circle_at_center,_rgba(99,102,241,0.18),_transparent_60%)] blur-2xl" />
      </div>

      <div className="mx-auto max-w-6xl px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🚢</span>
            <div className="text-xl sm:text-2xl font-semibold tracking-tight">PortTrip Concierge</div>
          </div>
          <a href="/" className="text-sm text-slate-300 hover:text-white/90">Back to site</a>
        </div>

        {banner && (
          <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200 mb-3">
            {banner}
          </div>
        )}

        <div
          ref={scrollerRef}
          className="min-h-[60vh] rounded-[24px] border border-white/15 bg-white/5 shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl p-4 sm:p-6 space-y-5"
        >
          {messages.map((m, i) => <Bubble key={i} role={m.role} content={m.content} />)}
          {loading && <TypingBubble />}
        </div>

        <div className="flex flex-wrap gap-2 mt-3">
          {chips.map((c) => (
            <button key={c} onClick={() => setInput(c)}
              className="text-sm px-3 py-1.5 rounded-full border border-white/15 bg-white/10 hover:bg-white/15">
              {c}
            </button>
          ))}
        </div>

        <form onSubmit={handleSend} className="sticky bottom-0">
          <div className="mt-2 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder='Ask anything (e.g., “Barcelona · 6 hours · best plan from the cruise terminal?”)'
              className="flex-1 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 shadow-inner placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40"
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 px-6 py-3 font-medium text-white shadow-lg shadow-indigo-900/30 hover:from-sky-400 hover:to-indigo-500 disabled:opacity-60"
            >
              {loading ? "Planning…" : "Ask"}
            </button>
          </div>
          <p className="mt-2 text-[11px] text-slate-300">
            Tip: include **arrival → all-aboard** time + preferences (kids, mobility, budget) for a sharper plan.
          </p>
        </form>
      </div>
    </div>
  );
}

/* UI pieces */

function Bubble({ role, content }: { role: Role; content: string }) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} w-full`}>
      <div className="flex items-start gap-3 max-w-[85%]">
        {!isUser && (
          <div className="h-9 w-9 select-none rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-lg shadow-indigo-900/30 flex items-center justify-center text-xs font-semibold">
            PT
          </div>
        )}
        <div
          className={`whitespace-pre-wrap rounded-2xl px-4 py-3 leading-relaxed ${
            isUser
              ? "bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-lg shadow-indigo-900/30 rounded-br-sm"
              : "bg-white/8 text-slate-100 border border-white/15 shadow-sm backdrop-blur-md rounded-bl-sm"
          }`}
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
        <div className="h-9 w-9 select-none rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-lg shadow-indigo-900/30 flex items-center justify-center text-xs font-semibold">
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

/* Minimal Markdown renderer (bold, italic, lists, paragraphs) */
function Markdown({ text }: { text: string }) {
  const html = useMemo(() => {
    if (!text) return "";
    let t = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    t = t.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    t = t.replace(/\*(.+?)\*/g, "<em>$1</em>");

    const lines = t.split(/\n/);
    const out: string[] = [];
    let ul = false, ol = false;
    const close = () => { if (ul) out.push("</ul>"), ul = false; if (ol) out.push("</ol>"), ol = false; };

    for (const line of lines) {
      const mUL = line.match(/^\s*(?:-|\u2022)\s+(.*)$/);
      const mOL = line.match(/^\s*(\d+)\.\s+(.*)$/);
      if (mUL) {
        if (!ul) close(), out.push("<ul class='list-disc pl-5 space-y-1'>"), ul = true;
        out.push(`<li>${mUL[1]}</li>`);
      } else if (mOL) {
        if (!ol) close(), out.push("<ol class='list-decimal pl-5 space-y-1'>"), ol = true;
        out.push(`<li>${mOL[2]}</li>`);
      } else if (line.trim() === "") {
        close(); out.push("<br/>");
      } else {
        close(); out.push(`<p>${line}</p>`);
      }
    }
    close();
    return out.join("\n");
  }, [text]);

  // eslint-disable-next-line react/no-danger
  return <div className="space-y-2" dangerouslySetInnerHTML={{ __html: html }} />;
}

