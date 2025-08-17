"use client";
import { useEffect, useRef, useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };

export default function Home() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Hi! Ask about your port day (e.g., \"Best 6-hour plan in Athens?\")." }
  ]);
  const [input, setInput] = useState("");
  const [portHint, setPortHint] = useState("");
  const [loading, setLoading] = useState(false);
  const outRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    outRef.current?.scrollTo({ top: outRef.current.scrollHeight });
  }, [messages]);

  async function send() {
    if (!input.trim() || loading) return;
    const user: Msg = { role: "user", content: input.trim() };
    setMessages((m) => [...m, user]);
    setInput("");
    setLoading(true);

    // create placeholder assistant message for streaming
    const idx = messages.length + 1;
    setMessages((m) => [...m, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history: [...messages, user],
          portHint: portHint || "",
          fallbackGeneral: true
        })
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No stream");

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
    } catch (e: any) {
      setMessages((m) => [...m, { role: "assistant", content: "Error: " + e.message }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex justify-center">
      <div className="w-full max-w-2xl p-6">
        <div className="flex items-center gap-2">
          <span>🚢</span>
          <h1 className="text-2xl font-semibold">PortTrip Concierge</h1>
        </div>
        <p className="text-gray-600 mt-1">Interactive, context-aware answers grounded in your port data.</p>

        <div ref={outRef} className="mt-4 bg-white border rounded p-3 h-[46vh] overflow-auto space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "text-gray-900" : "bg-blue-50 border border-blue-100 p-3 rounded"}>
              <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">{m.role === "user" ? "You" : "Concierge"}</div>
              <div className="whitespace-pre-wrap">{m.content}</div>
            </div>
          ))}
        </div>

        <div className="mt-3 flex gap-2">
          <input
            className="p-3 border rounded flex-1"
            placeholder="Optional: Port hint (e.g., Barcelona)"
            value={portHint}
            onChange={(e) => setPortHint(e.target.value)}
          />
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); send(); }}
          className="mt-2 flex gap-2"
        >
          <input
            className="flex-1 p-3 border rounded bg-white"
            placeholder='Ask anything (e.g., "Best kid-friendly plan near the port?")'
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-3 rounded bg-blue-600 text-white disabled:opacity-60"
          >
            {loading ? "Thinking…" : "Ask"}
          </button>
        </form>
      </div>
    </main>
  );
}
