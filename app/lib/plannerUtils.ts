import type { ItineraryStop, StopType } from "./types";

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

export function parseCoordsFromInput(value: string): { lat: number; lng: number } | null {
  const latLng = value.match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
  if (latLng) return { lat: Number(latLng[1]), lng: Number(latLng[2]) };
  const q = value.match(/q=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (q) return { lat: Number(q[1]), lng: Number(q[2]) };
  const at = value.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (at) return { lat: Number(at[1]), lng: Number(at[2]) };
  return null;
}
