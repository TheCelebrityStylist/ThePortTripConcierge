"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import BlogCard from "@/app/components/blog/BlogCard";
import { blogArticles } from "@/app/data/blog-cms";

const regions = ["All", "Mediterranean", "Northern Europe", "Caribbean", "Global"] as const;
const times = ["All", "5–7 hours", "7–9 hours", "10–12 hours", "All windows"] as const;
const docking = ["All", "Dock", "Tender", "Mixed", "Both"] as const;
const travelers = ["All", "first-time", "family", "mobility", "budget", "luxury"] as const;
const difficulties = ["All", "Easy", "Moderate", "Complex"] as const;
const categories = ["All", "Port Guide", "Safety", "Budget", "Strategy"] as const;

export default function BlogHubPage() {
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState<(typeof regions)[number]>("All");
  const [time, setTime] = useState<(typeof times)[number]>("All");
  const [dock, setDock] = useState<(typeof docking)[number]>("All");
  const [traveler, setTraveler] = useState<(typeof travelers)[number]>("All");
  const [difficulty, setDifficulty] = useState<(typeof difficulties)[number]>("All");
  const [category, setCategory] = useState<(typeof categories)[number]>("All");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return blogArticles.filter((article) => {
      const qOk =
        !q ||
        [article.title, article.portsMentioned?.join(" "), article.subtitle, article.excerpt, article.keywords.join(" ")]
          .join(" ")
          .toLowerCase()
          .includes(q);

      return (
        qOk &&
        (region === "All" || article.region === region) &&
        (time === "All" || article.timeInPortModel === time) &&
        (dock === "All" || article.tenderOrDock === dock) &&
        (traveler === "All" || article.keywords.some((keyword) => keyword.toLowerCase().includes(traveler))) &&
        (difficulty === "All" || article.difficulty === difficulty) &&
        (category === "All" || article.category === category)
      );
    });
  }, [query, region, time, dock, traveler, difficulty, category]);

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100">
      <section className="mx-auto max-w-7xl">
        <div className="rounded-3xl border border-cyan-300/25 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/80 p-6 md:p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-200/80">PortTrip Editorial</p>
          <h1 className="mt-3 text-4xl font-semibold md:text-5xl">Cruise Intelligence Library</h1>
          <p className="mt-3 max-w-3xl text-slate-200">
            Cruise-specific planning intelligence built for timing control, transfer reliability, and safer ship return outcomes.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/planner" className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-cyan-300">Plan your port day</Link>
            <Link href="/library/ports" className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold hover:bg-white/10">Browse port categories</Link>
          </div>
        </div>

        <section className="sticky top-16 z-20 mt-7 rounded-2xl border border-white/10 bg-slate-900/95 p-4 backdrop-blur">
          <div className="grid gap-3 md:grid-cols-4 xl:grid-cols-7">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search title, port, keyword" className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm" />
            <select value={region} onChange={(e) => setRegion(e.target.value as (typeof regions)[number])} className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm">{regions.map((v) => <option key={v}>{v}</option>)}</select>
            <select value={time} onChange={(e) => setTime(e.target.value as (typeof times)[number])} className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm">{times.map((v) => <option key={v}>{v}</option>)}</select>
            <select value={dock} onChange={(e) => setDock(e.target.value as (typeof docking)[number])} className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm">{docking.map((v) => <option key={v}>{v}</option>)}</select>
            <select value={traveler} onChange={(e) => setTraveler(e.target.value as (typeof travelers)[number])} className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm">{travelers.map((v) => <option key={v}>{v}</option>)}</select>
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as (typeof difficulties)[number])} className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm">{difficulties.map((v) => <option key={v}>{v}</option>)}</select>
            <select value={category} onChange={(e) => setCategory(e.target.value as (typeof categories)[number])} className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm">{categories.map((v) => <option key={v}>{v}</option>)}</select>
          </div>
        </section>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-slate-400">{filtered.length} guides matched</p>
          <Link href="/planner" className="text-sm font-semibold text-cyan-200 underline">Plan My Port Day</Link>
        </div>

        <ul className="mt-4 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.flatMap((article, index) => [
            <BlogCard key={article.slug} article={article} />,
            (index + 1) % 6 === 0 ? (
              <li key={`${article.slug}-cta`} className="rounded-2xl border border-cyan-300/30 bg-cyan-500/10 p-5">
                <h3 className="text-xl font-semibold">Start Planning Your Port</h3>
                <p className="mt-2 text-sm text-slate-200">Convert any guide into a timed, ship-safe itinerary in Cruise Day Planner.</p>
                <Link href="/planner" className="mt-4 inline-flex rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-900">Open Planner</Link>
              </li>
            ) : null,
          ])}
        </ul>
      </section>
    </main>
  );
}
