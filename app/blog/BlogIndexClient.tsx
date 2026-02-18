"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { BlogPost, DockingType, TravelerType } from "../data/blog-cms";

export default function BlogIndexClient({
  posts,
  regions,
  timeWindows
}: {
  posts: BlogPost[];
  regions: string[];
  timeWindows: string[];
}) {
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("all");
  const [timeInPort, setTimeInPort] = useState("all");
  const [dockingType, setDockingType] = useState<"all" | DockingType>("all");
  const [travelerType, setTravelerType] = useState<"all" | TravelerType>("all");

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return posts.filter((post) => {
      const text = `${post.title} ${post.portName} ${post.keywords.join(" ")}`.toLowerCase();
      const matchesQuery = !q || text.includes(q);
      const matchesRegion = region === "all" || post.region === region;
      const matchesTime = timeInPort === "all" || post.timeInPort === timeInPort;
      const matchesDock = dockingType === "all" || post.dockingType === dockingType;
      const matchesTraveler = travelerType === "all" || post.travelerTypes.includes(travelerType);
      return matchesQuery && matchesRegion && matchesTime && matchesDock && matchesTraveler;
    });
  }, [posts, query, region, timeInPort, dockingType, travelerType]);

  return (
    <>
      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Cruise Port Guides</h1>
        <p className="mt-2 max-w-3xl text-slate-300">
          Port-specific plans built for real cruise constraints: transfer friction, crowd timing, and ship-safe return windows.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Link href="/planner" className="rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 px-4 py-2 text-sm font-medium text-white hover:from-sky-400 hover:to-indigo-500">
            Plan your port day
          </Link>
          <span className="text-xs text-slate-400">Use the planner to tailor each guide to your ship schedule.</span>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search title, port, keywords" className="rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm text-white outline-none" />
          <select value={region} onChange={(e) => setRegion(e.target.value)} className="rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm">
            <option value="all">All regions</option>
            {regions.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
          <select value={timeInPort} onChange={(e) => setTimeInPort(e.target.value)} className="rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm">
            <option value="all">All time windows</option>
            {timeWindows.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
          <select value={dockingType} onChange={(e) => setDockingType(e.target.value as any)} className="rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm">
            <option value="all">Any docking type</option>
            <option value="Dock">Dock</option>
            <option value="Tender">Tender</option>
            <option value="Both">Both</option>
          </select>
          <select value={travelerType} onChange={(e) => setTravelerType(e.target.value as any)} className="rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm">
            <option value="all">All traveler types</option>
            <option value="first-time">First-time</option>
            <option value="family">Family</option>
            <option value="mobility">Mobility</option>
            <option value="budget">Budget</option>
            <option value="luxury">Luxury</option>
          </select>
        </div>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        {filtered.map((post) => (
          <article key={post.slug} className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-xl font-semibold tracking-tight">{post.title}</h2>
            <p className="mt-2 line-clamp-2 text-sm text-slate-300">{post.excerpt}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full border border-sky-400/30 bg-sky-500/10 px-2 py-1">{post.portName}</span>
              <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-1">{post.timeInPort}</span>
              <span className="rounded-full border border-indigo-400/30 bg-indigo-500/10 px-2 py-1">{post.dockingType}</span>
            </div>
            <Link href={`/blog/${post.slug}`} className="mt-4 inline-block rounded-lg bg-white/10 px-3 py-2 text-sm hover:bg-white/15">Read guide</Link>
          </article>
        ))}
      </section>
      {filtered.length === 0 && <p className="mt-6 text-sm text-slate-300">No guides match these filters yet. Try broader filters.</p>}

      <section className="mt-8 rounded-2xl border border-indigo-400/20 bg-indigo-500/10 p-6">
        <h3 className="text-xl font-semibold">Plan My Port Day</h3>
        <p className="mt-2 text-sm text-slate-200">Turn any guide into a timed itinerary with transport, spend estimates, and a return-to-ship buffer.</p>
        <Link href="/planner" className="mt-4 inline-block rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 px-4 py-2 text-sm font-medium text-white hover:from-sky-400 hover:to-indigo-500">Open Cruise Day Planner</Link>
      </section>
    </>
  );
}
