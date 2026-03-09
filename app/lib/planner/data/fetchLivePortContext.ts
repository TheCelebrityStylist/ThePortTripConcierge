export type LivePortContext = {
  source: "tavily" | "fallback";
  highlights: string[];
  warnings: string[];
};

const TAVILY_URL = "https://api.tavily.com/search";

export async function fetchLivePortContext(portName: string): Promise<LivePortContext> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    return { source: "fallback", highlights: [], warnings: ["Live Tavily context unavailable"] };
  }

  const query = `${portName} cruise port transit closure queue advisory`;
  try {
    const res = await fetch(TAVILY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: apiKey, query, search_depth: "basic", max_results: 5, include_answer: true }),
      cache: "no-store",
    });
    if (!res.ok) throw new Error("tavily failed");
    const data = (await res.json()) as { answer?: string; results?: Array<{ title?: string; content?: string }> };
    const rows = data.results ?? [];
    const highlights = rows.slice(0, 3).map((row) => `${row.title ?? "Source"}: ${(row.content ?? "").slice(0, 120)}`);
    const warnings = rows.filter((row) => /closed|closure|strike|delay|queue/i.test(row.content ?? "")).slice(0, 2).map((row) => row.title ?? "Operational warning");
    if (!highlights.length && !data.answer) throw new Error("empty result");
    return { source: "tavily", highlights: data.answer ? [data.answer, ...highlights].slice(0, 3) : highlights, warnings };
  } catch {
    return { source: "fallback", highlights: [], warnings: ["Unable to verify live updates right now"] };
  }
}
