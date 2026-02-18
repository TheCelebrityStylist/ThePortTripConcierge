import type { Metadata } from "next";
import Link from "next/link";
import ArticleHero from "@/app/components/blog/ArticleHero";
import PlannerCTA from "@/app/components/blog/PlannerCTA";
import { blogArticleMap, blogArticles } from "@/app/data/blog-cms";

type Props = { params: { slug: string } };

function getArticle(slug: string) {
  return blogArticleMap.get(slug);
}

export function generateStaticParams() {
  return blogArticles.map((article) => ({ slug: article.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const article = getArticle(params.slug);
  if (!article) return {};

  return {
    title: article.metaTitle,
    description: article.metaDescription,
    keywords: article.keywords,
    alternates: { canonical: `https://porttrip.com/blog/${article.slug}` },
    robots: { index: true, follow: true },
    openGraph: {
      title: article.metaTitle,
      description: article.metaDescription,
      type: "article",
      url: `https://porttrip.com/blog/${article.slug}`,
    },
    twitter: {
      card: "summary",
      title: article.metaTitle,
      description: article.metaDescription,
    },
  };
}

const calloutTone = {
  safety: "border-amber-300/40 bg-amber-500/10",
  transport: "border-cyan-300/40 bg-cyan-500/10",
  crowd: "border-violet-300/40 bg-violet-500/10",
  budget: "border-emerald-300/40 bg-emerald-500/10",
  late: "border-rose-300/40 bg-rose-500/10",
};

export default function BlogArticlePage({ params }: Props) {
  const article = getArticle(params.slug);
  if (!article) return <main className="min-h-screen bg-slate-950 p-10 text-slate-100">Article not found.</main>;

  const related = article.relatedSlugs.map((slug) => blogArticleMap.get(slug)).filter(Boolean);

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.metaDescription,
    datePublished: article.publishedDate,
    dateModified: article.updatedDate,
    author: { "@type": "Organization", name: "PortTrip Editorial Desk" },
    publisher: { "@type": "Organization", name: "PortTrip" },
    mainEntityOfPage: `https://porttrip.com/blog/${article.slug}`,
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://porttrip.com" },
      { "@type": "ListItem", position: 2, name: "Cruise Intelligence Library", item: "https://porttrip.com/blog" },
      { "@type": "ListItem", position: 3, name: article.title, item: `https://porttrip.com/blog/${article.slug}` },
    ],
  };

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100">
      <div className="mx-auto max-w-7xl">
        <Link href="/blog" className="text-sm text-slate-300 underline">← Back to Cruise Intelligence Library</Link>

        <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_300px]">
          <article className="space-y-8">
            <ArticleHero article={article} />

            <PlannerCTA
              title={`Plan ${article.portName} now`}
              description="Run this strategy inside Cruise Day Planner and get timed checkpoints with return-safe buffers."
              label={article.plannerCta.label}
              href={article.plannerCta.href}
            />

            <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h2 className="text-xl font-semibold">What this guide answers</h2>
              <p className="mt-2 text-slate-200">{article.hook}</p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <aside className={`rounded-xl border p-3 ${calloutTone.safety}`}>
                  <p className="text-xs font-semibold uppercase">Return-to-Ship Safety Buffer</p>
                  <p className="mt-1 text-sm text-slate-100">Protect 90+ minutes before all-aboard and escalate to 120 minutes when traffic, weather, or tender queues trend up.</p>
                </aside>
                <aside className={`rounded-xl border p-3 ${calloutTone.transport}`}>
                  <p className="text-xs font-semibold uppercase">Terminal → City Transport</p>
                  <p className="mt-1 text-sm text-slate-100">Rank options by reliability first, cost second. Confirm a backup route before your first attraction.</p>
                </aside>
                <aside className={`rounded-xl border p-3 ${calloutTone.crowd}`}>
                  <p className="text-xs font-semibold uppercase">Crowd Timing / Best Order</p>
                  <p className="mt-1 text-sm text-slate-100">Run highest-value stops early, then pivot to flexible stops after midday congestion builds.</p>
                </aside>
                <aside className={`rounded-xl border p-3 ${calloutTone.budget}`}>
                  <p className="text-xs font-semibold uppercase">Budget Snapshot</p>
                  <p className="mt-1 text-sm text-slate-100">Set a transport cap and one paid-time saver. Controlled spend beats cheap-but-risky routing.</p>
                </aside>
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h2 className="text-xl font-semibold">Port context</h2>
              <div className="mt-3 space-y-3 text-slate-200">
                {article.narrative.map((block) => <p key={block}>{block}</p>)}
              </div>
            </section>

            {article.sections.map((section) => (
              <section id={section.id} key={section.id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <h2 className="text-2xl font-semibold">{section.heading}</h2>
                <p className="mt-2 text-slate-300">{section.shortIntro}</p>

                <h3 className="mt-4 text-lg font-semibold">Key points</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-200">
                  {section.bullets.map((item) => <li key={item}>{item}</li>)}
                </ul>

                <h3 className="mt-4 text-lg font-semibold">Execution steps</h3>
                <ol className="mt-2 list-decimal space-y-1 pl-5 text-slate-200">
                  {section.steps.map((step) => <li key={step}>{step}</li>)}
                </ol>

                <h3 className="mt-4 text-lg font-semibold">Checklist</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-200">
                  {section.checklist.map((item) => <li key={item}>{item}</li>)}
                </ul>

                <aside className={`mt-4 rounded-xl border p-3 ${calloutTone.late}`}>
                  <p className="text-xs font-semibold uppercase">If you’re running late</p>
                  <p className="mt-1 text-sm text-slate-100">{section.lateRule}</p>
                </aside>
              </section>
            ))}

            <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h2 className="text-2xl font-semibold">FAQ</h2>
              <div className="mt-3 space-y-4">
                {article.faq.map((item) => (
                  <div key={item.q}>
                    <h3 className="font-semibold">{item.q}</h3>
                    <p className="text-slate-300">{item.a}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h2 className="text-xl font-semibold">Related reading and tools</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-300">
                {article.internalLinks.map((item) => (
                  <li key={`${item.href}-${item.anchorText}`}>
                    <Link className="underline" href={item.href}>{item.anchorText}</Link>
                  </li>
                ))}
                {related.map((item) => (
                  <li key={item!.slug}><Link className="underline" href={`/blog/${item!.slug}`}>{item!.title}</Link></li>
                ))}
              </ul>
            </section>

            <PlannerCTA
              title={`Ready to lock ${article.portName}?`}
              description={article.summary}
              label={article.bottomCta.label}
              href={article.bottomCta.href}
            />
          </article>

          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-4 rounded-2xl border border-white/10 bg-slate-900/90 p-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Table of contents</h2>
              <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-300">
                {article.toc.map((item) => (
                  <li key={item.id}><a className="hover:text-cyan-200" href={`#${item.id}`}>{item.label}</a></li>
                ))}
              </ol>
              <Link href={article.plannerCta.href} className="inline-flex rounded-lg bg-cyan-400 px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-cyan-300">
                Open Cruise Day Planner
              </Link>
            </div>
          </aside>
        </div>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
    </main>
  );
}
