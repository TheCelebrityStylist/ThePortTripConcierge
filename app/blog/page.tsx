"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import BlogCard from "@/app/components/blog/BlogCard";
import { blogArticles } from "@/app/data/blog-cms";

const regions = ["All", "Mediterranean", "Caribbean"] as const;
const times = ["All", "5–7 hours", "6–8 hours", "7–9 hours", "8–10 hours"] as const;
const docking = ["All", "Dock", "Tender", "Both"] as const;
const travelers = ["All", "first-time", "family", "mobility", "budget", "luxury"] as const;

export default function BlogHubPage() {
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState<(typeof regions)[number]>("All");
  const [time, setTime] = useState<(typeof times)[number]>("All");
  const [dock, setDock] = useState<(typeof docking)[number]>("All");
  const [traveler, setTraveler] = useState<(typeof travelers)[number]>("All");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return blogArticles.filter((article) => {
      const qOk =
        !q ||
        [article.title, article.portName, article.subtitle, article.excerpt, article.keywords.join(" ")]
          .join(" ")
          .toLowerCase()
          .includes(q);
      const regionOk = region === "All" || article.region === region;
      const timeOk = time === "All" || article.timeInPort === time;
      const dockOk = dock === "All" || article.dockingType === dock;
      const travelerOk = traveler === "All" || article.travelerTypes.includes(traveler);

      return qOk && regionOk && timeOk && dockOk && travelerOk;
    });
  }, [query, region, time, dock, traveler]);

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100">
      <section className="mx-auto max-w-7xl">
        <div className="rounded-3xl border border-cyan-300/25 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/80 p-6 md:p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-200/80">PortTrip Editorial</p>
          <h1 className="mt-3 text-4xl font-semibold md:text-5xl">Cruise Intelligence Library</h1>
          <p className="mt-3 max-w-3xl text-slate-200">
            High-signal port-day strategy for travelers who want better routes, safer return windows, and fewer expensive mistakes.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/planner" className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-cyan-300">Plan your port day</Link>
            <Link href="/signup" className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold hover:bg-white/10">Save plans to dashboard</Link>
          </div>
        </div>

        <section className="sticky top-16 z-20 mt-7 rounded-2xl border border-white/10 bg-slate-900/95 p-4 backdrop-blur">
          <div className="grid gap-3 md:grid-cols-5">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by title, port, or keyword" className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm" />
            <select value={region} onChange={(e) => setRegion(e.target.value as (typeof regions)[number])} className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm">{regions.map((item) => <option key={item}>{item}</option>)}</select>
            <select value={time} onChange={(e) => setTime(e.target.value as (typeof times)[number])} className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm">{times.map((item) => <option key={item}>{item}</option>)}</select>
            <select value={dock} onChange={(e) => setDock(e.target.value as (typeof docking)[number])} className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm">{docking.map((item) => <option key={item}>{item}</option>)}</select>
            <select value={traveler} onChange={(e) => setTraveler(e.target.value as (typeof travelers)[number])} className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm">{travelers.map((item) => <option key={item}>{item}</option>)}</select>
          </div>
        </section>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-slate-400">{filtered.length} guides matched</p>
          <Link href="/planner" className="text-sm font-semibold text-cyan-200 underline">Plan My Port Day</Link>
        </div>

        <ul className="mt-4 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((article) => <BlogCard key={article.slug} article={article} />)}
        </ul>
      </section>
    </main>
  );
}
