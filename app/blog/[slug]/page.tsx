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

const tone = {
  KeyPoints: "border-cyan-300/30 bg-cyan-500/10",
  TimeModel: "border-amber-300/30 bg-amber-500/10",
  RoutePlans: "border-violet-300/30 bg-violet-500/10",
  BudgetModel: "border-emerald-300/30 bg-emerald-500/10",
  FailureScenarios: "border-rose-300/30 bg-rose-500/10",
  CrowdAvoidance: "border-indigo-300/30 bg-indigo-500/10",
  PortSpecificScams: "border-fuchsia-300/30 bg-fuchsia-500/10",
  Accessibility: "border-sky-300/30 bg-sky-500/10",
  QuickDecision: "border-lime-300/30 bg-lime-500/10",
  CTA: "border-cyan-300/30 bg-cyan-500/10",
};

export default function BlogArticlePage({ params }: Props) {
  const article = getArticle(params.slug);
  if (!article) return <main className="min-h-screen bg-slate-950 p-10 text-slate-100">Article not found.</main>;

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

        <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_320px]">
          <article className="space-y-8">
            <ArticleHero article={article} />

            <PlannerCTA
              title={`Plan ${article.portsMentioned?.[0] ?? article.region} now`}
              description="Run this strategy in Cruise Day Planner and keep return cut rules visible."
              label={article.plannerCta.label}
              href={article.plannerCta.href}
            />

            {article.contentBlocks.map((block, idx) => (
              <section id={block.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")} key={`${block.kind}-${idx}`} className={`rounded-2xl border p-5 ${tone[block.kind]}`}>
                <h2 className="text-2xl font-semibold">{block.title}</h2>
                <p className="mt-2 text-slate-100">{block.lead}</p>

                <h3 className="mt-4 text-lg font-semibold">Key points</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-100">
                  {block.bullets.map((item) => <li key={item}>{item}</li>)}
                </ul>

                <h3 className="mt-4 text-lg font-semibold">Execution steps</h3>
                <ol className="mt-2 list-decimal space-y-1 pl-5 text-slate-100">
                  {block.steps.map((step) => <li key={step}>{step}</li>)}
                </ol>

                <aside className="mt-4 rounded-lg border border-white/20 bg-slate-950/50 p-3">
                  <p className="text-xs font-semibold uppercase">Decision rule</p>
                  <p className="mt-1 text-sm text-slate-200">{block.decisionRule}</p>
                </aside>

                {idx === Math.floor(article.contentBlocks.length / 2) ? (
                  <PlannerCTA
                    title="Mid-article checkpoint"
                    description="Convert this section into a timed planner sequence before continuing."
                    label="Plan My Port Day"
                    href={article.plannerCta.href}
                  />
                ) : null}
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
              <h2 className="text-xl font-semibold">Related guides</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-300">
                {article.internalLinks.map((item) => (
                  <li key={`${item.href}-${item.anchorText}`}><Link className="underline" href={item.href}>{item.anchorText}</Link></li>
                ))}
              </ul>
            </section>

            <PlannerCTA title="Ready to finalize your plan?" description="Lock this strategy with hard return cutoffs and fallback routes." label="Plan My Port Day" href={article.plannerCta.href} />
          </article>

          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-4 rounded-2xl border border-white/10 bg-slate-900/90 p-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Table of contents</h2>
              <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-300">
                {article.contentBlocks.map((block, i) => {
                  const id = block.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
                  return <li key={`${id}-${i}`}><a className="hover:text-cyan-200" href={`#${id}`}>{block.title}</a></li>;
                })}
              </ol>
              <Link href={article.plannerCta.href} className="inline-flex rounded-lg bg-cyan-400 px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-cyan-300">Plan My Port Day</Link>
            </div>
          </aside>
        </div>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
    </main>
  );
}
