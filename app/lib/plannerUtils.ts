import type { DelayScenario, ItineraryStop, StopType } from "./types";

export function parseTimeToMin(v: string) {
  const [h, m] = (v || "00:00").split(":").map(Number);
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
}

export function minToTime(v: number) {
  const n = Math.max(0, Math.round(v));
  const h = Math.floor(n / 60) % 24;
  const m = n % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function sortByStart(stops: ItineraryStop[]) {
  return [...stops].sort((a, b) => parseTimeToMin(a.startTime || "99:99") - parseTimeToMin(b.startTime || "99:99"));
}

export function stopTypeFromTitle(title: string): StopType {
  const t = title.toLowerCase();
  if (/(taxi|metro|bus|train|transfer|shuttle)/.test(t)) return "transport";
  if (/(lunch|dinner|cafe|food|market)/.test(t)) return "food";
  if (/(buffer|spare|margin)/.test(t)) return "buffer";
  return "attraction";
}

export function applyScenarioDelay(stops: ItineraryStop[], scenario: DelayScenario) {
  const delay = scenario === "tender20" ? 20 : scenario === "taxi15" ? 15 : 25;
  const triggerType: StopType = scenario === "taxi15" ? "transport" : scenario === "queue25" ? "attraction" : "buffer";
  let applied = false;
  return stops.map((s) => {
    if (!applied && (triggerType === "buffer" || s.type === triggerType)) {
      applied = true;
    }
    if (!applied) return s;
    return {
      ...s,
      startTime: minToTime(parseTimeToMin(s.startTime) + delay),
      endTime: minToTime(parseTimeToMin(s.endTime) + delay),
      notes: `${s.notes}${s.notes ? " · " : ""}Delay scenario applied (+${delay}m)`,
    };
  });
}

export function dedupeConsecutive<T>(items: T[], getText: (item: T) => string) {
  const out: T[] = [];
  for (const item of items) {
    if (!out.length || getText(out[out.length - 1]) !== getText(item)) out.push(item);
  }
  return out;
}
