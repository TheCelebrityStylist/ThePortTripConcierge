import { NextRequest, NextResponse } from "next/server";
import { loadItineraries, saveItineraries } from "../store";

type Ctx = { params: { id: string } };

export async function GET(_: NextRequest, { params }: Ctx) {
  const rows = await loadItineraries();
  const row = rows.find((r) => r.id === params.id);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const body = await req.json().catch(() => ({}));
  const rows = await loadItineraries();
  const idx = rows.findIndex((r) => r.id === params.id);
  if (idx < 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  rows[idx] = {
    ...rows[idx],
    ...body,
    itinerary_json: body.itinerary_json || rows[idx].itinerary_json,
    updated_at: new Date().toISOString(),
  };
  await saveItineraries(rows);
  return NextResponse.json(rows[idx]);
}

export async function DELETE(_: NextRequest, { params }: Ctx) {
  const rows = await loadItineraries();
  const next = rows.filter((r) => r.id !== params.id);
  await saveItineraries(next);
  return NextResponse.json({ ok: true });
}
