import Link from "next/link";
import { blogArticles } from "@/app/data/blog-cms";

export default function LibraryStrategyPage() {
  const posts = blogArticles.filter((article) => article.category === "Strategy");

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100">
      <section className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-semibold">Library Category: Strategy Frameworks</h1>
        <p className="mt-2 text-slate-300">Cross-port models for route selection, risk tradeoffs, and operational decision quality.</p>
        <ul className="mt-6 space-y-3">
          {posts.map((article) => <li key={article.slug}><Link className="underline" href={`/blog/${article.slug}`}>{article.title}</Link></li>)}
        </ul>
      </section>
    </main>
  );
}
