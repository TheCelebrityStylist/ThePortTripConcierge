"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { popularPortSlugs, portsByRegion, portsRegistry } from "@/app/lib/ports";

type PortPickerProps = {
  value: string;
  onChange: (port: { slug: string; name: string; region: string }) => void;
  id?: string;
};

const FLAT_PORTS = Object.entries(portsByRegion).flatMap(([region, ports]) => ports.map((port) => ({ ...port, region })));

export default function PortPicker({ value, onChange, id }: PortPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [recent, setRecent] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = FLAT_PORTS.filter((port) => {
      if (!q) return true;
      return `${port.name} ${port.country} ${port.region}`.toLowerCase().includes(q);
    });
    return filtered.reduce<Record<string, typeof filtered>>((acc, port) => {
      (acc[port.region] ||= []).push(port);
      return acc;
    }, {});
  }, [query]);

  const flattened = useMemo(() => Object.values(grouped).flat(), [grouped]);

  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [open]);

  const selectedName = portsRegistry[value]?.name ?? "Select port";

  const select = (slug: string) => {
    const port = portsRegistry[slug];
    if (!port) return;
    onChange({ slug: port.slug, name: port.name, region: port.region });
    setRecent((prev) => [slug, ...prev.filter((item) => item !== slug)].slice(0, 5));
    setQuery("");
    setActiveIndex(0);
    setOpen(false);
  };

  const chipPorts = [...recent, ...popularPortSlugs.filter((slug) => !recent.includes(slug))].slice(0, 7);

  return (
    <div ref={containerRef} className="relative">
      <button
        id={id}
        type="button"
        className="w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-left text-sm"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        {selectedName}
      </button>

      {open && (
        <div className="absolute z-30 mt-2 w-full rounded-xl border border-white/10 bg-slate-950 p-3 shadow-2xl shadow-cyan-900/20">
          <input
            autoFocus
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setActiveIndex((idx) => Math.min(flattened.length - 1, idx + 1));
              }
              if (event.key === "ArrowUp") {
                event.preventDefault();
                setActiveIndex((idx) => Math.max(0, idx - 1));
              }
              if (event.key === "Enter" && flattened[activeIndex]) {
                event.preventDefault();
                select(flattened[activeIndex].slug);
              }
              if (event.key === "Escape") setOpen(false);
            }}
            placeholder="Search port, country, region"
            className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm"
          />

          <div className="mt-2 flex flex-wrap gap-1.5">
            {chipPorts.map((slug) => (
              <button
                key={slug}
                type="button"
                onClick={() => select(slug)}
                className="rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-200 hover:bg-slate-700"
              >
                {portsRegistry[slug]?.name ?? slug}
              </button>
            ))}
          </div>

          <div className="mt-3 max-h-64 overflow-y-auto" role="listbox">
            {Object.entries(grouped).map(([region, ports]) => (
              <div key={region} className="mb-2">
                <p className="sticky top-0 bg-slate-950 py-1 text-[11px] uppercase tracking-wide text-cyan-300/80">{region}</p>
                <div className="space-y-1">
                  {ports.map((port) => {
                    const idx = flattened.findIndex((item) => item.slug === port.slug);
                    const active = idx === activeIndex;
                    return (
                      <button
                        key={port.slug}
                        type="button"
                        onMouseEnter={() => setActiveIndex(idx)}
                        onClick={() => select(port.slug)}
                        className={`block w-full rounded-md px-2 py-2 text-left text-sm ${active ? "bg-cyan-500/20 text-cyan-100" : "text-slate-200 hover:bg-white/5"}`}
                      >
                        {port.name}
                        <span className="ml-2 text-xs text-slate-400">{port.country}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            {flattened.length === 0 && <p className="py-4 text-center text-sm text-slate-400">No ports found.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
