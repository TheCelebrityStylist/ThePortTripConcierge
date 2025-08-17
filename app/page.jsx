"use client";
import { useState } from "react";

export default function Home() {
  const [port, setPort] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setAnswer("");

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ port, question })
    });

    const data = await res.json();
    setAnswer(data.answer || data.error);
    setLoading(false);
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8 bg-gray-50">
      <h1 className="text-3xl font-bold mb-6">🚢 PortTrip Concierge</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-md">
        <input
          type="text"
          placeholder="Enter port (e.g., Athens, Barcelona)"
          value={port}
          onChange={(e) => setPort(e.target.value)}
          className="p-3 border rounded"
          required
        />
        <textarea
          placeholder="Ask your question (e.g., What can I do in 6 hours?)"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="p-3 border rounded"
          rows={3}
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white p-3 rounded hover:bg-blue-700"
        >
          {loading ? "Thinking..." : "Ask Concierge"}
        </button>
      </form>

      {answer && (
        <div className="mt-6 p-4 bg-white border rounded shadow max-w-md w-full">
          <h2 className="font-semibold mb-2">Answer:</h2>
          <p>{answer}</p>
        </div>
      )}
    </main>
  );
}

