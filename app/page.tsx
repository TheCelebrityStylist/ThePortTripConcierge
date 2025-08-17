"use client";
import { useEffect, useRef, useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };

export default function Home() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Hi! Tell me your port and time window (e.g., “Barcelona, 6 hours 9:00–15:00”)." }
  ]);
  const [input, setInput] = useState("");
  const [portHint, setPortHint] = useState("");
  const [loading, setLoading] = useState(false);
  const [showKeyFix, setShowKeyFix] = useState(false);
  const [tempKey, setTempKey] = useState("");

  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => { scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" }); }, [messages]);

  async function callApi(history: Msg[], key?: string) {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(key ? { "x-openai-key": key } : {}) },
      body: JSON.stringify({ history, portHint, fallbackGeneral: true })
    });
    return res;
  }

  async function send() {
    if (!input.trim() || loading) return;
    const user: Msg = { role: "user", content: input.trim() };
    setMessages(m => [...m, user, { role: "assistant", content: "" }]); // placeholder for streaming
    setInput("");
    setLoading(true);

    const idx = messages.length + 1; // index of placeholder we just pushed

    try {
      let res = await callApi([...messages, user]);

      const ct = res.headers.get("content-type") || "";
      if (!res.ok && ct.includes("application/json")) {
        const err = await res.json();
        if (err?.errorCode === "OPENAI_QUOTA" || err?.errorCode === "OPENAI_AUTH") {
          setShowKeyFix(true);
          setMessages(m => {
            const copy = [...m];
            copy[idx] = { role: "assistant", content: "Our server key hit a limit. Paste a temporary key below to keep testing, or try again later." };
            return copy;
          });
          setLoading(false);
          return;
        }
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No stream");
      const decoder = new TextDecoder();
      let acc = "";

      // show typing dots while streaming
      setTyping(true);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value);
        setMessages(m => {
          const copy = [...m];
          copy[idx] = { role: "assistant", content: acc };
          return copy;
        });
      }
    } catch (e: any) {
      setMessages(m => [...m, { role: "assistant", content: "Error: " + e.message }]);
    } finally {
      setTyping(false);
      setLoading(false);
    }
  }

  // typing indicator state
  const [typing, setTyping] = useState(false);

  function sendChip(text: string) {
    setInput(text);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#f3f6ff] flex flex-col">
      <header className="sticky top-0 z-10 bg-white/70 backdrop-blur border-b">
        <div className="max-w-3xl mx-auto px-5 py-3 flex items-center gap-2">
          <span className="text-2xl">🚢</span>
          <h1 className="text-xl sm:text-2xl font-semibold">PortTrip Concierge</h1>
          <span className="ml-auto text-sm text-gray-500">beta</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto w-full px-5 flex-1 flex flex-col">
        {/* chat window */}
        <div
          ref={scroller}
          className="mt-4 flex-1 bg-white border border-gray-200 rounded-2xl shadow-sm p-4 overflow-y-auto space-y-4"
          style={{ minHeight: "55vh" }}
        >
          {messages.map((m, i) => (
            <Bubble key={i} role={m.role} text={m.content} />
          ))}
          {typing && <TypingBubble />}
        </div>

        {/* port hint */}
        <div className="mt-3">
          <input
            value={portHint}
            onChange={(e) => setPortHint(e.target.value)}
            placeholder="Optional: Port hint (e.g., Barcelona)"
            className="w-full p-3 border rounded-xl bg-white"
          />
        </div>

        {/* composer */}
        <form
          onSubmit={(e) => { e.preventDefault(); send(); }}
          className="sticky bottom-0 bg-transparent"
        >
          <div className="mt-2 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder='Ask anything (e.g., “Best 6-hour plan from the cruise terminal?”)'
              className="flex-1 p-3 border rounded-xl bg-white"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? "Thinking…" : "Ask"}
            </button>
          </div>
        </form>

        {/* quick chips */}
        <div className="mt-2 flex flex-wrap gap-2">
          {[
            "Best 6-hour plan",
            "Top 3 sights, minimal walking",
            "Mobility-friendly loop",
            "Local food near the port"
          ].map((t) => (
            <button
              key={t}
              onClick={() => sendChip(t)}
              className="text-sm px-3 py-1.5 rounded-full border bg-white hover:bg-gray-50"
            >
              {t}
            </button>
          ))}
        </div>

        {/* temporary BYOK only shown on error */}
        {showKeyFix && (
          <div className="mt-3 p-3 rounded-xl border bg-amber-50 text-amber-900">
            <div className="text-sm font-semibold">Temporary testing key</div>
            <div className="text-sm opacity-80">
              Paste an OpenAI API key to continue testing while we update server billing. It’s only used for your browser session.
            </div>
            <div className="mt-2 flex gap-2">
              <input
                className="flex-1 p-2 border rounded bg-white"
                placeholder="sk-..."
                value={tempKey}
                onChange={(e) => setTempKey(e.target.value)}
              />
              <button
                onClick={async () => {
                  // stream a quick retry with the provided key
                  setShowKeyFix(false);
                  setLoading(true);
                  setMessages(m => [...m, { role: "assistant", content: "" }]);
                  const idx = messages.length;
                  try {
                    const res = await callApi(messages, tempKey.trim());
                    const reader = res.body?.getReader();
                    if (!reader) throw new Error("No stream");
                    const decoder = new TextDecoder();
                    let acc = "";
                    while (true) {
                      const { done, value } = await reader.read();
                      if (done) break;
                      acc += decoder.decode(value);
                      setMessages(m => {
                        const copy = [...m];
                        copy[idx] = { role: "assistant", content: acc };
                        return copy;
                      });
                    }
                  } catch (e: any) {
                    setMessages(m => [...m, { role: "assistant", content: "Error: " + e.message }]);
                  } finally {
                    setLoading(false);
                  }
                }}
                className="px-4 py-2 rounded bg-blue-600 text-white"
              >
                Use Key
              </button>
            </div>
          </div>
        )}
      </main>

      {/* tiny styles for typing dots */}
      <style jsx global>{`
        @keyframes blink {
          from { opacity: .25; transform: translateY(0px); }
          to   { opacity: 1;    transform: translateY(-2px); }
        }
      `}</style>
    </div>
  );
}

function Bubble({ role, text }: { role: "user" | "assistant"; text: string }) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] px-4 py-3 rounded-2xl shadow-sm whitespace-pre-wrap ${
          isUser
            ? "bg-blue-600 text-white rounded-br-sm"
            : "bg-gray-50 text-gray-900 border rounded-bl-sm"
        }`}
      >
        <div className="text-[10px] uppercase tracking-wide opacity-70 mb-1">
          {isUser ? "You" : "Concierge"}
        </div>
        {text}
      </div>
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="flex justify-start">
      <div className="max-w-[60%] px-4 py-3 rounded-2xl bg-gray-50 border rounded-bl-sm">
        <div className="text-[10px] uppercase tracking-wide opacity-70 mb-
