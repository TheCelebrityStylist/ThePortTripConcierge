import Link from "next/link";
import type { BlogArticle } from "@/app/data/blog-cms";

export default function BlogCard({ article }: { article: BlogArticle }) {
  return (
    <li className="rounded-2xl border border-white/10 bg-slate-900/80 p-5 shadow-[0_20px_55px_-35px_rgba(34,211,238,0.6)]">
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="rounded-full bg-white/10 px-2 py-1">{article.portName}</span>
        <span className="rounded-full bg-cyan-500/20 px-2 py-1 text-cyan-100">{article.timeInPort}</span>
        <span className="rounded-full bg-violet-500/20 px-2 py-1 text-violet-100">{article.dockingType}</span>
      </div>

      <h3 className="mt-4 text-xl font-semibold leading-snug">
        <Link href={`/blog/${article.slug}`} className="hover:text-cyan-300">{article.title}</Link>
      </h3>
      <p className="mt-2 line-clamp-2 text-sm text-slate-300">{article.excerpt}</p>

      <Link href={`/blog/${article.slug}`} className="mt-4 inline-flex items-center rounded-lg border border-cyan-300/40 px-3 py-1.5 text-sm font-semibold text-cyan-100 hover:bg-cyan-500/10">
        Read guide
      </Link>
    </li>
  );
}
