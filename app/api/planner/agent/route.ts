import { NextResponse } from "next/server";
import { plannerPorts } from "@/app/data/ports";

const recentHashes: string[] = [];

const hash = (input: string) => {
  let h = 0;
  for (let i = 0; i < input.length; i += 1) h = (h << 5) - h + input.charCodeAt(i);
  return String(h);
};

export async function POST(req: Request) {
  const { portSlug, brief, currentPlan, userMessage, mode } = await req.json();
  const port = plannerPorts[portSlug] ?? plannerPorts.barcelona;
  const clustered = port.recommendedClusters.slice(0, 3).map((c) => c.name).join(", ");

  let assistantMessage = `Quick read:\n- ${portSlug} today has peak congestion around ${port.peakTrafficWindows.join(" and ")}.\n- Prioritize ${clustered} for your ${mode || "balanced"} style.\n- Keep a hard return corridor before all-aboard.\n\nRecommendations:\n1) Shift transit mode to ${port.reliabilityRanking[0]} first when possible.\n2) Anchor lunch near a cluster midpoint to reduce walking.\n\nRisks & buffers:\n- ${port.dockType === "tender" ? "Tender queue variance can burn 20-40m." : "Dock transfers are stable but traffic spikes midday."}\n- Keep at least 45m protected return buffer.\n\nAlternatives:\n- Swap longest walk stop to a nearby indoor option.\n- Move high queue sights earlier than 11:00.\n\nNext question:\n- Which stop is non-negotiable so I can protect it?`;

  const messageHash = hash(assistantMessage);
  if (recentHashes.includes(messageHash)) {
    assistantMessage = `${assistantMessage}\n\nRefinement:\n- New angle: focus on ${port.recommendedClusters[3]?.name || "waterfront"} for lower queue pressure.`;
  }
  recentHashes.unshift(messageHash);
  if (recentHashes.length > 5) recentHashes.pop();

  const suggestions = [
    {
      id: "swap-transport",
      title: "Swap to lower-walk transport leg",
      description: `Replace longest walking segment with ${port.reliabilityRanking[0]} transfer to save energy.`,
      actionType: "edit",
      payload: { type: "less-walking-transport" },
    },
    {
      id: "add-lunch",
      title: "Add strategic lunch anchor",
      description: `Insert a lunch stop near ${port.recommendedClusters[1]?.name || "old town"} to stabilize your timeline.`,
      actionType: "add",
      payload: { title: "Local lunch anchor", category: "food", durationMin: 60, costEUR: 28, walkMin: 10 },
    },
    {
      id: "swap-nearby",
      title: "Replace with nearby alternative",
      description: "Swap one high-crowd stop with a nearby lighter-queue cluster.",
      actionType: "swap",
      payload: { type: "nearby-alternative" },
    },
  ] as const;

  return NextResponse.json({ assistantMessage, suggestions, diagnostics: [brief?.mustDo, userMessage, `stops:${currentPlan?.length || 0}`].filter(Boolean) });
}
