const TAVILY_URL = "https://api.tavily.com/search";

export async function runTavilyCruiseResearch({ port, dateLabel = "today" }) {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) return { enabled: false, items: [], summary: "Tavily not configured." };

  const queries = [
    `${port} cruise port transport updates ${dateLabel}`,
    `${port} metro strike ${dateLabel}`,
    `${port} cruise terminal traffic ${dateLabel}`,
    `${port} attraction opening hours ${dateLabel}`,
    `${port} local warning travelers ${dateLabel}`,
  ];

  const results = [];
  for (const query of queries) {
    try {
      const resp = await fetch(TAVILY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: apiKey,
          query,
          search_depth: "advanced",
          max_results: 3,
          include_answer: false,
          include_raw_content: false,
        }),
      });
      if (!resp.ok) continue;
      const data = await resp.json();
      const rows = Array.isArray(data?.results) ? data.results : [];
      rows.forEach((r) => {
        results.push({ query, title: r?.title || "", url: r?.url || "", snippet: r?.content || r?.snippet || "" });
      });
    } catch {
      // tolerate per-query failure
    }
  }

  const slice = results.slice(0, 8);
  const summary = slice
    .map((r, i) => `${i + 1}. ${r.title} — ${r.snippet}`)
    .join("\n");

  return {
    enabled: true,
    items: slice,
    summary: summary || "No high-confidence live updates found.",
    strikeDetected: /strike|industrial action|walkout/i.test(summary),
    closureDetected: /closed|closure|restricted|suspended/i.test(summary),
  };
}
