import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type SavedItinerary = {
  id: string;
  user_id: string;
  port: string;
  ship_name: string;
  arrival_time: string;
  all_aboard_time: string;
  safety_buffer: number;
  risk_score: number;
  itinerary_json: {
    blocks: Array<{ start: string; end: string; title: string; notes: string; costEur?: number }>;
    comparison?: { shipExcursion: number; diy: number; savings: number };
  };
  created_at: string;
  updated_at: string;
};

const FILE = path.join(process.cwd(), "app", "data", "itineraries.json");

export async function loadItineraries(): Promise<SavedItinerary[]> {
  const raw = await readFile(FILE, "utf-8").catch(() => "[]");
  return JSON.parse(raw) as SavedItinerary[];
}

export async function saveItineraries(items: SavedItinerary[]) {
  await writeFile(FILE, JSON.stringify(items, null, 2), "utf-8");
}
