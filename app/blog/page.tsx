"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { blogArticles } from "@/app/data/blog-cms";

const categories = ["All", "Mediterranean", "Caribbean", "Planning Guides", "Safety"] as const;

export default function BlogHubPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof categories)[number]>("All");

  const filtered = useMemo(() => {
    return blogArticles.filter((a) => {
      const catOk = category === "All" || a.category === category;
      const q = query.toLowerCase().trim();
      const qOk = !q || a.title.toLowerCase().includes(q) || a.metaDescription.toLowerCase().includes(q);
      return catOk && qOk;
    });
  }, [query, category]);

  const featured = blogArticles[0];

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100">
      <section className="mx-auto max-w-6xl">
        <h1 className="text-4xl font-semibold">Cruise Intelligence Library</h1>
        <p className="mt-3 text-slate-300">Cruise Port Guides engineered for transport precision, return-safe buffers, and measurable DIY savings.</p>

        <div className="sticky top-16 z-30 mt-5 rounded-xl border border-cyan-300/20 bg-cyan-500/10 p-4">
          <p className="text-sm">Plan Your Cruise Day With Real-Time Safety Buffers →</p>
          <Link href="/plan" className="mt-2 inline-block rounded-lg bg-cyan-500 px-4 py-2 font-medium text-slate-900">Open Cruise Day Planner</Link>
        </div>

        <section className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase text-slate-400">Featured guide</p>
          <div className="mt-3 grid gap-4 md:grid-cols-[1.2fr_1fr]">
            <Image src={featured.featuredImage} alt={`${featured.title} cruise port terminal`} width={1200} height={700} priority className="h-64 w-full rounded-xl object-cover" />
            <div>
              <h2 className="text-2xl font-semibold"><Link href={`/blog/${featured.slug}`}>{featured.title}</Link></h2>
              <p className="mt-2 text-sm text-slate-300">{featured.metaDescription}</p>
              <Link href={`/blog/${featured.slug}`} className="mt-3 inline-block underline">Read guide</Link>
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-3 md:grid-cols-[1fr_auto]">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search cruise port guides" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2" />
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button key={c} onClick={() => setCategory(c)} className={`rounded-full px-3 py-1 text-sm ${category === c ? "bg-cyan-500 text-slate-900" : "bg-white/10"}`}>{c}</button>
            ))}
          </div>
        </div>

        <ul className="mt-6 grid gap-4 md:grid-cols-2">
          {filtered.map((article) => (
            <li key={article.slug} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <Image src={article.featuredImage} alt={`${article.title.split(" ")[0]} cruise port terminal`} width={900} height={520} loading="lazy" className="h-44 w-full rounded-xl object-cover" />
              <h3 className="mt-3 text-lg font-semibold">
                <Link href={`/blog/${article.slug}`}>{article.title}</Link>
              </h3>
              <p className="mt-2 text-sm text-slate-300">{article.metaDescription}</p>
              <Link className="mt-3 inline-block text-sm underline" href={`/blog/${article.slug}`}>Read full guide</Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
