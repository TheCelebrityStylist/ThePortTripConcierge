"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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

  const scrollerRef = useRef<HTMLDivElement>(null);

  /* Auto-scroll on new content */
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

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

  /* Send handler */
  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setBanner(null);

    const nextHistory = [...messages, { role: "user" as const, content: text }];
    setMessages(nextHistory);
    setInput("");
    setLoading(true);

    // reserve a slot for the assistant reply
    const replyIndex = nextHistory.length;
    setMessages([...nextHistory, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextHistory,
          history: nextHistory,
          fallbackGeneral: true
        })
      });

      const contentType = res.headers.get("content-type") || "";

      // Error payload (JSON)
      if (!res.ok && contentType.includes("application/json")) {
        const err = await res.json().catch(() => ({}));
        const msg =
          err?.message || err?.error || "The server rejected the request.";
        setMessages((m) => {
          const copy = [...m];
          copy[replyIndex] = { role: "assistant", content: `⚠️ ${msg}` };
          return copy;
        });
        setLoading(false);
        return;
      }

      // Streaming (text/plain) path
      if (!contentType.includes("application/json") && res.body) {
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
        // Non-stream JSON path
        const data = await res.json().catch(() => ({}));
        const reply =
          data?.reply ||
          data?.answer ||
          data?.content ||
          "Sorry — I couldn’t generate a reply.";
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
        copy[replyIndex] = {
          role: "assistant",
          content: "I hit a network error. Try again shortly."
        };
        return copy;
      });
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
          <a
            href="/"
            className="text-sm text-slate-300 hover:text-white/90"
          >
            Back to site
          </a>
        </div>

        {/* Banner */}
        {banner && (
          <div className="mb-3 rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
            {banner}
          </div>
        )}

        {/* Chat area (tighter vertical rhythm) */}
        <div
          ref={scrollerRef}
          className="min-h-[60vh] space-y-3 rounded-[24px] border border-white/15 bg-white/5 p-4 shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-6"
        >
          {messages.map((m, i) => (
            <Bubble key={i} role={m.role} content={m.content} />
          ))}
          {loading && <TypingBubble />}
        </div>

        {/* Chips */}
        <div className="mt-3 flex flex-wrap gap-2">
          {chips.map((c) => (
            <button
              key={c}
              onClick={() => setInput(c)}
              className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm hover:bg-white/15"
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
            Tip: include <strong>arrival → all-aboard</strong> time + preferences
            (kids, mobility, budget) for a sharper plan.
          </p>
        </form>
      </div>
    </div>
  );
}

/* ---------- UI Pieces ---------- */

function Bubble(props: { role: Role; content: string }) {
  const { role, content } = props;
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

    // Escape HTML
    let t = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");

    // Normalize spacing: collapse 2+ blank lines → a single blank line
    t = t.replace(/\n{2,}/g, "\n\n");

    // Bold / italics
    t = t.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    t = t.replace(/\*(.+?)\*/g, "<em>$1</em>");

    const lines = t.split("\n");
    const out: string[] = [];
    let ul = false;
    let ol = false;
    let lastWasBreak = false;

    const closeLists = () => {
      if (ul) out.push("</ul>"), (ul = false);
      if (ol) out.push("</ol>"), (ol = false);
    };

    for (const line of lines) {
      const mUL = line.match(/^\s*(?:-|•)\s+(.*)$/);
      const mOL = line.match(/^\s*(\d+)\.\s+(.*)$/);

      if (mUL) {
        if (!ul) {
          closeLists();
          out.push("<ul class='pl-5 list-disc'>");
          ul = true;
        }
        out.push(`<li>${mUL[1]}</li>`);
        lastWasBreak = false;
        continue;
      }

      if (mOL) {
        if (!ol) {
          closeLists();
          out.push("<ol class='pl-5 list-decimal'>");
          ol = true;
        }
        out.push(`<li>${mOL[2]}</li>`);
        lastWasBreak = false;
        continue;
      }

      // Blank line ⇒ a very small break (no big vertical gaps)
      if (line.trim() === "") {
        closeLists();
        if (!lastWasBreak) {
          out.push("<br/>");
          lastWasBreak = true;
        }
        continue;
      }

      closeLists();
      out.push(`<p>${line}</p>`);
      lastWasBreak = false;
    }

    closeLists();
    return out.join("");
  }, [text]);

  // eslint-disable-next-line react/no-danger
  return (
    <div
      className="
        chat-md
        [&>p]:my-1
        [&_ul]:my-1 [&_ol]:my-1
        [&_li]:my-0.5
        [&_strong]:font-semibold
      "
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

