import Link from "next/link";
import type { BlogArticle } from "@/app/data/blog-cms";

export default function ArticleHero({ article }: { article: BlogArticle }) {
  return (
    <header className="rounded-3xl border border-cyan-300/25 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/75 p-6 md:p-8">
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="rounded-full bg-white/10 px-2 py-1">{article.portName}</span>
        <span className="rounded-full bg-cyan-500/20 px-2 py-1">{article.timeInPort}</span>
        <span className="rounded-full bg-violet-500/20 px-2 py-1">{article.dockingType}</span>
      </div>

      <h1 className="mt-4 text-3xl font-semibold leading-tight md:text-4xl">{article.title}</h1>
      <p className="mt-3 max-w-3xl text-slate-200">{article.subtitle}</p>

      <div className="mt-5 flex flex-wrap gap-3">
        <Link href={article.plannerCta.href} className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-cyan-300">
          Open Cruise Day Planner
        </Link>
        <Link href="/signup" className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-white/10">
          Save this plan
        </Link>
        <Link href="/login" className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-white/10">
          Create account
        </Link>
      </div>
    </header>
  );
}
