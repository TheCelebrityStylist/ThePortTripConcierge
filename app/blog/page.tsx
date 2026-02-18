import type { Metadata } from "next";
import Link from "next/link";
import { blogArticles } from "@/app/data/blog-cms";

export const metadata: Metadata = {
  title: "Cruise Intelligence Library",
  description: "Cruise port guides with transport, pricing, and return-safe logistics.",
  alternates: { canonical: "https://porttrip.com/blog" },
};

export default function BlogIndexPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100">
      <section className="mx-auto max-w-5xl">
        <h1 className="text-4xl font-semibold">Cruise Intelligence Library</h1>
        <p className="mt-3 text-slate-300">Cruise Port Playbooks built for return safety, realistic timing, and better spend control.</p>
        <ul className="mt-8 grid gap-4 md:grid-cols-2">
          {blogArticles.map((article) => (
            <li key={article.slug} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs text-slate-400">{article.wordCount.toLocaleString()} words</p>
              <h2 className="mt-1 text-lg font-semibold">
                <Link href={`/blog/${article.slug}`}>{article.title}</Link>
              </h2>
              <p className="mt-2 text-sm text-slate-300">{article.metaDescription}</p>
              <Link className="mt-3 inline-block text-sm underline" href={`/blog/${article.slug}`}>Read full guide</Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
