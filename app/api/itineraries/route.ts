import { NextRequest, NextResponse } from "next/server";
import { loadItineraries, saveItineraries, type SavedItinerary } from "./store";

function id() {
  return `it_${Math.random().toString(36).slice(2, 10)}`;
}

export async function GET() {
  const rows = await loadItineraries();
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const now = new Date().toISOString();
  const row: SavedItinerary = {
    id: id(),
    user_id: body.user_id || "guest",
    port: body.port || "Unknown",
    ship_name: body.ship_name || "Unknown ship",
    arrival_time: body.arrival_time || "08:00",
    all_aboard_time: body.all_aboard_time || "16:30",
    safety_buffer: Number(body.safety_buffer || 75),
    risk_score: Number(body.risk_score || 40),
    itinerary_json: body.itinerary_json || { blocks: [] },
    created_at: now,
    updated_at: now,
  };

  const rows = await loadItineraries();
  rows.unshift(row);
  await saveItineraries(rows);
  return NextResponse.json(row, { status: 201 });
}
