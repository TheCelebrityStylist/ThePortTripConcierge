"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { popularPortSlugs, portsByRegion } from "@/app/lib/ports";

type PortOption = {
  slug: string;
  name: string;
  country: string;
  region: string;
  aliases?: string[];
};

const RECENT_KEY = "porttrip_recent_ports_v1";

export default function PortCombobox({ value, onChange, autoFocus = false }: { value: string; onChange: (slug: string) => void; autoFocus?: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [recent, setRecent] = useState<string[]>([]);

  const all = useMemo<PortOption[]>(() => Object.values(portsByRegion).flat(), []);
  const selected = all.find((port) => port.slug === value);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]") as string[];
      setRecent(Array.isArray(parsed) ? parsed.slice(0, 6) : []);
    } catch {
      setRecent([]);
    }
  }, []);

  const matching = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return all.filter((port) => {
      const aliases = (port.aliases ?? []).join(" ");
      return `${port.name} ${port.country} ${port.region} ${aliases}`.toLowerCase().includes(q);
    }).slice(0, 40);
  }, [all, query]);

  const nearby = useMemo(() => {
    if (!selected) return [];
    return all.filter((port) => port.region === selected.region && port.slug !== selected.slug).slice(0, 6);
  }, [all, selected]);

  const grouped = useMemo(() => {
    const rec = recent.map((slug) => all.find((port) => port.slug === slug)).filter(Boolean) as PortOption[];
    const pop = popularPortSlugs.map((slug) => all.find((port) => port.slug === slug)).filter(Boolean) as PortOption[];
    return [
      { label: "Recent", items: rec },
      { label: "Popular", items: pop },
      { label: "Matching", items: matching },
      { label: "Nearby", items: nearby },
    ].filter((group) => group.items.length > 0);
  }, [all, matching, nearby, recent]);

  const flatItems = grouped.flatMap((group) => group.items);

  const select = (slug: string) => {
    onChange(slug);
    setOpen(false);
    setQuery("");
    setActive(0);
    const next = [slug, ...recent.filter((item) => item !== slug)].slice(0, 6);
    setRecent(next);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        value={query}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onKeyDown={(event) => {
          if (!open || flatItems.length === 0) return;
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setActive((prev) => Math.min(prev + 1, flatItems.length - 1));
          }
          if (event.key === "ArrowUp") {
            event.preventDefault();
            setActive((prev) => Math.max(prev - 1, 0));
          }
          if (event.key === "Enter") {
            event.preventDefault();
            select(flatItems[active]?.slug ?? value);
          }
        }}
        placeholder={selected ? `${selected.name}, ${selected.country}` : "Search port by name, alias, country..."}
        className="w-full rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 text-sm"
        aria-label="Search ports"
      />

      <div className="mt-1 flex flex-wrap gap-1">
        {popularPortSlugs.slice(0, 5).map((slug) => {
          const port = all.find((item) => item.slug === slug);
          if (!port) return null;
          return (
            <button key={slug} type="button" className="rounded-full bg-slate-800 px-2 py-1 text-[11px]" onClick={() => select(slug)}>
              {port.name}
            </button>
          );
        })}
      </div>

      {open && (
        <div className="absolute z-30 mt-2 max-h-80 w-full overflow-y-auto rounded-xl border border-white/10 bg-slate-950 p-2 shadow-2xl">
          {grouped.map((group) => (
            <div key={group.label} className="mb-2 last:mb-0">
              <p className="px-2 text-[10px] uppercase tracking-[0.16em] text-slate-400">{group.label}</p>
              <div className="mt-1 space-y-1">
                {group.items.map((port) => {
                  const index = flatItems.findIndex((item) => item.slug === port.slug);
                  return (
                    <button
                      key={`${group.label}-${port.slug}`}
                      type="button"
                      onMouseDown={() => select(port.slug)}
                      className={`block w-full rounded-lg px-2 py-2 text-left text-sm ${index === active ? "bg-cyan-500/20" : "hover:bg-white/5"}`}
                    >
                      {port.name} <span className="text-xs text-slate-400">· {port.country} · {port.region}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
