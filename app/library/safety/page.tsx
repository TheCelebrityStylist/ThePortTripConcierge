import Link from "next/link";
import { blogArticles } from "@/app/data/blog-cms";

export default function LibrarySafetyPage() {
  const posts = blogArticles.filter((article) => article.category === "Safety");

  return (
    <main className="min-h-screen bg-slate-950 px-6 pb-10 pt-24 text-slate-100">
      <section className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-semibold">Library Category: Safety Systems</h1>
        <p className="mt-2 text-slate-300">Risk-control frameworks for all-aboard protection, tender variance, and disruption management.</p>
        <ul className="mt-6 space-y-3">
          {posts.map((article) => <li key={article.slug}><Link className="underline" href={`/blog/${article.slug}`}>{article.title}</Link></li>)}
        </ul>
      </section>
    </main>
  );
}
