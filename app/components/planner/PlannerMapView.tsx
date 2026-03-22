"use client";

import { useEffect, useRef } from "react";
import type { ItineraryStop } from "../../lib/types";
import { parseCoordsFromInput, parseTimeToMin } from "../../lib/plannerUtils";

export default function PlannerMapView({
  stops,
  port,
  mustReturnByTime,
  onUpdateCoords,
}: {
  stops: ItineraryStop[];
  port: string;
  mustReturnByTime: string;
  onUpdateCoords?: (id: string, lat: number, lng: number) => void;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const geocoded = stops.filter((s) => typeof s.location.lat === "number" && typeof s.location.lng === "number");

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!key || !mapRef.current || geocoded.length === 0) return;
    const id = "pt-gmaps";

    const init = () => {
      // @ts-ignore
      const g = window.google;
      if (!g || !mapRef.current) return;
      const center = { lat: geocoded[0].location.lat!, lng: geocoded[0].location.lng! };
      const map = new g.maps.Map(mapRef.current, { center, zoom: 12 });
      const points = geocoded.map((s) => ({ lat: s.location.lat!, lng: s.location.lng! }));
      points.forEach((p, i) => new g.maps.Marker({ position: p, map, label: String(i + 1) }));
      new g.maps.Polyline({ path: points, map, strokeColor: "#22d3ee", strokeWeight: 3 });
    };

    // @ts-ignore
    if (window.google?.maps) return init();
    if (!document.getElementById(id)) {
      const sc = document.createElement("script");
      sc.id = id;
      sc.src = `https://maps.googleapis.com/maps/api/js?key=${key}`;
      sc.async = true;
      sc.onload = init;
      document.body.appendChild(sc);
    }
  }, [geocoded]);

  const legs = stops.slice(0, -1).map((s, i) => ({ from: s.title, to: stops[i + 1].title, estimatedMin: Math.max(8, parseTimeToMin(stops[i + 1].startTime) - parseTimeToMin(s.endTime || s.startTime)) }));

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-300">{port} route view. Must return by {mustReturnByTime}.</p>
      <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-200">
        {stops.length ? stops.map((stop) => (
          <li key={stop.id}>
            {stop.startTime || "Unscheduled"} · {stop.title}
            {!stop.location.lat || !stop.location.lng ? (
              <span className="text-amber-300"> — Map not available. Paste Google Maps link or lat,lng below.</span>
            ) : null}
            {!stop.location.lat || !stop.location.lng ? (
              <input
                onBlur={(e) => {
                  const c = parseCoordsFromInput(e.target.value);
                  if (c && onUpdateCoords) onUpdateCoords(stop.id, c.lat, c.lng);
                }}
                className="ml-2 mt-1 rounded bg-slate-800 px-2 py-1 text-xs"
                placeholder="Paste Google Maps link or lat,lng"
              />
            ) : null}
          </li>
        )) : <li>No stops yet.</li>}
      </ol>
      <div className="rounded border border-white/10 p-3 text-sm">
        <p className="font-semibold">Travel legs (estimated)</p>
        <ul className="mt-2 list-disc pl-5 text-slate-300">{legs.length ? legs.map((l) => <li key={`${l.from}-${l.to}`}>{l.from} → {l.to}: ~{l.estimatedMin}m</li>) : <li>Add at least two stops to show legs.</li>}</ul>
      </div>
      <div ref={mapRef} className="h-[320px] w-full rounded-xl bg-slate-900/80" />
      {!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && <p className="rounded bg-amber-500/20 px-3 py-2 text-sm">Map key not configured. Ordered route list is available above.</p>}
    </div>
  );
}
