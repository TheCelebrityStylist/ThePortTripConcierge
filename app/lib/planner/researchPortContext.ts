const wikiQueries: Record<string, string> = {
  barcelona: "Barcelona",
  naples: "Naples",
  santorini: "Santorini",
  "rome-civitavecchia": "Civitavecchia",
  marseille: "Marseille",
  "athens-piraeus": "Piraeus",
};

export type PortResearchContext = {
  source: "live" | "fallback";
  summary: string;
};

export async function researchPortContext(portSlug?: string): Promise<PortResearchContext> {
  if (!portSlug) return { source: "fallback", summary: "No live context available yet." };
  const query = wikiQueries[portSlug] ?? portSlug.replace(/-/g, " ");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);
  try {
    const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`, {
      cache: "no-store",
      signal: controller.signal,
    });
    if (!res.ok) throw new Error("wiki fetch failed");
    const data = (await res.json()) as { extract?: string };
    const summary = data.extract
      ?.split(".")
      .slice(0, 2)
      .join(".")
      .trim()
      .replace(/\.?$/, ".");
    if (!summary) throw new Error("empty summary");
    return { source: "live", summary };
  } catch {
    return { source: "fallback", summary: "Live research unavailable in this session. Using local PortTrip intelligence and planner heuristics." };
  } finally {
    clearTimeout(timeout);
  }
}
