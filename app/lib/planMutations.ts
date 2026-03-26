import type { ItineraryStop } from "./types";

type MutationResult = { stops: ItineraryStop[]; changeLog: string[] };

const byPriority = (a: ItineraryStop, b: ItineraryStop) => a.priority - b.priority;

export function makeSafer(stops: ItineraryStop[]): MutationResult {
  const next = stops.map((s) => (s.type === "buffer" ? { ...s, durationMin: s.durationMin + 5 } : s));
  if (!next.some((s) => s.type === "buffer")) {
    next.push({
      id: `buf_${Date.now()}`,
      title: "Safety buffer",
      type: "buffer",
      startTime: "",
      endTime: "",
      durationMin: 20,
      travelMinToNext: 0,
      location: { name: "Return corridor" },
      costEstimate: 0,
      notes: "Added by safety mutation",
      source: "manual",
      priority: 1,
      flexibility: "fixed",
      tags: { returnCorridor: true },
      category: "view",
      indoorFriendly: true,
      crowdSensitive: false,
      keywordTags: ["buffer","safe"],
    });
  }
  return { stops: next, changeLog: ["Added/expanded buffers", "Protected return corridor"] };
}

export function makeCheaper(stops: ItineraryStop[]): MutationResult {
  const next = stops.map((s) => (s.type === "transport" ? { ...s, costEstimate: Math.max(0, Math.round(s.costEstimate * 0.7)) } : s));
  return { stops: next, changeLog: ["Reduced transport spend assumptions", "Prioritized lower-cost legs"] };
}

export function reduceWalking(stops: ItineraryStop[]): MutationResult {
  const next = stops.map((s) => (s.tags?.highWalk ? { ...s, durationMin: Math.max(20, s.durationMin - 15), notes: `${s.notes}${s.notes ? " · " : ""}Reduced walking load` } : s));
  return { stops: next, changeLog: ["Trimmed high-walk segments", "Adjusted for lower mobility strain"] };
}

export function addCultureBias(stops: ItineraryStop[]): MutationResult {
  const sorted = [...stops].sort((a, b) => {
    const ac = a.category === "culture" || a.category === "museum" ? -1 : 0;
    const bc = b.category === "culture" || b.category === "museum" ? -1 : 0;
    return ac - bc;
  });
  return { stops: sorted, changeLog: ["Moved culture-focused stops earlier", "Kept one practical fallback late"] };
}

export function addFoodBias(stops: ItineraryStop[]): MutationResult {
  const sorted = [...stops].sort((a, b) => {
    const af = a.category === "food" ? -1 : 0;
    const bf = b.category === "food" ? -1 : 0;
    return af - bf;
  });
  return { stops: sorted, changeLog: ["Moved food anchors toward peak meal windows", "Preserved return-safe final leg"] };
}

export function rainPlan(stops: ItineraryStop[]): MutationResult {
  const next = stops.map((s) => (s.indoorFriendly ? s : { ...s, optional: true, startTime: "", endTime: "" }));
  return { stops: next, changeLog: ["Shifted outdoor-heavy stops to optional", "Promoted indoor-friendly flow"] };
}

export function runningLate(stops: ItineraryStop[], minutes: number): MutationResult {
  const next = [...stops].sort(byPriority).map((s, idx) => (idx < 2 ? s : { ...s, optional: true, startTime: "", endTime: "" }));
  return { stops: next, changeLog: [`Applied +${minutes}m delay posture`, "Moved low-priority stops to optional"] };
}
