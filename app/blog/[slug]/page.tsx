/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import { blogArticles } from "@/app/data/blog-cms";

type Props = { params: { slug: string } };

function getArticle(slug: string) {
  return blogArticles.find((a) => a.slug === slug);
}

function seoH1(title: string) {
  const base = title.includes("Cruise Port") ? title : `${title} Cruise Port`;
  return `${base} in 1 Day (DIY Without a Ship Excursion) – 2026`;
}

function compactMeta(title: string) {
  const t = `${title.split("(")[0].trim()} Guide (DIY 2026)`;
  return t.length > 59 ? `${t.slice(0, 56)}...` : t;
}

function compactDescription(title: string) {
  const d = `Explore ${title.split(" ")[0]} from the cruise port without a tour. Exact transport, prices, timing buffers, and return-safe planning.`;
  return d.length > 160 ? `${d.slice(0, 157)}...` : d;
}

export function generateStaticParams() {
  return blogArticles.map((a) => ({ slug: a.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const article = getArticle(params.slug);
  if (!article) return {};
  return {
    title: compactMeta(article.title),
    description: compactDescription(article.title),
    alternates: { canonical: `https://porttrip.com/blog/${article.slug}` },
    openGraph: {
      title: compactMeta(article.title),
      description: compactDescription(article.title),
      type: "article",
      images: article.images.slice(0, 1),
    },
  };
}

export default function BlogArticlePage({ params }: Props) {
  const article = getArticle(params.slug);
  if (!article) return <main className="min-h-screen bg-slate-950 p-10 text-slate-100">Article not found.</main>;

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: article.faq.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };

  const related = blogArticles.filter((a) => a.slug !== article.slug).slice(0, 3);

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100">
      <article className="mx-auto max-w-4xl">
        <Link href="/blog" className="text-sm text-slate-300 underline">← Back to blog</Link>
        <h1 className="mt-3 text-4xl font-semibold">{seoH1(article.title)}</h1>
        <p className="mt-3 text-slate-300">{article.metaDescription}</p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {article.images.map((src, i) => (
            <img key={src + i} src={src} alt={i === 0 ? `${article.title.split(" ")[0]} cruise port terminal` : i === 1 ? `${article.title.split(" ")[0]} cruise port walking route` : `${article.title.split(" ")[0]} cruise ship dock location`} loading="lazy" className="h-64 w-full rounded-xl object-cover" />
          ))}
        </div>

        <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4">
          <h2 className="text-xl font-semibold">Table of contents</h2>
          <ol className="mt-2 list-decimal pl-5 text-sm text-slate-300">
            {article.sections.map((section) => (
              <li key={section.h2}><a href={`#${section.h2.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>{section.h2}</a></li>
            ))}
          </ol>
        </div>

        {article.sections.map((section) => (
          <section key={section.h2} id={section.h2.toLowerCase().replace(/[^a-z0-9]+/g, "-")} className="mt-8">
            <h2 className="text-2xl font-semibold">{section.h2}</h2>
            {/\d{1,2}:\d{2}\s*[–-]\s*\d{1,2}:\d{2}/.test(section.h3) ? (
              <h3 className="mt-2 text-lg font-medium text-sky-300">{section.h3}</h3>
            ) : null}
            {section.paragraphs.map((p, idx) => (
              <p key={idx} className="mt-3 text-slate-300">{p}</p>
            ))}
          </section>
        ))}

        <section className="mt-10 rounded-xl border border-white/10 bg-white/5 p-4">
          <h2 className="text-2xl font-semibold">FAQ</h2>
          {article.faq.map((f) => (
            <div key={f.question} className="mt-4">
              <h3 className="font-semibold">{f.question}</h3>
              <p className="text-slate-300">{f.answer}</p>
            </div>
          ))}
        </section>

        <section className="mt-8 rounded-xl border border-cyan-300/20 bg-cyan-500/10 p-4">
          <p className="text-sm">{article.ctaText}</p>
          <Link href="/chat" className="mt-3 inline-block rounded-lg bg-cyan-500 px-4 py-2 font-medium text-slate-950">Open Concierge</Link>
        </section>


        <section className="mt-8 rounded-xl border border-white/10 bg-white/5 p-4">
          <h2 className="text-xl font-semibold">Plan with live risk and timing intelligence</h2>
          <p className="mt-2 text-slate-300">Before planning independently, use our <Link href="/plan" className="underline">Cruise Day Planner</Link> to calculate your safe return time.</p>
          <p className="mt-2 text-slate-300">Related reads: <Link href="/blog/how-much-time-do-you-really-have-in-port" className="underline">How Much Time Do You Really Have in Port?</Link>, <Link href="/blog/diy-vs-ship-excursions-real-cost-comparison" className="underline">DIY vs Ship Excursions cost comparison</Link>, and <Link href="/blog/is-it-safe-to-explore-cruise-ports-alone" className="underline">Cruise port safety guide</Link>.</p>
          <p className="mt-2 text-slate-300">Mid-article action: <Link href={`/plan?prefill=${article.slug}`} className="underline">Calculate your safe return time for this port</Link>.</p>
          <p className="mt-2 text-slate-300">Bottom action: <Link href={`/plan?prefill=${article.slug}`} className="underline">Plan this exact day in seconds</Link>.</p>
        </section>

        <section className="mt-8 rounded-xl border border-white/10 bg-white/5 p-4">
          <h2 className="text-xl font-semibold">Official references</h2>
          <ul className="mt-2 list-disc pl-5 text-slate-300">
            <li><a className="underline" href="https://www.portdebarcelona.cat/en/" target="_blank" rel="noopener noreferrer">Port of Barcelona (official terminal details)</a></li>
            <li><a className="underline" href="https://tmb.cat/en/home" target="_blank" rel="noopener noreferrer">TMB Barcelona Metro authority</a></li>
            <li><a className="underline" href="https://www.barcelonaturisme.com/wv3/en/" target="_blank" rel="noopener noreferrer">Barcelona Tourism Board</a></li>
            <li><a className="underline" href="https://www.royalcaribbean.com/shore-excursions" target="_blank" rel="noopener noreferrer">Cruise line excursions (comparison benchmark)</a></li>
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold">Related guides</h2>
          <ul className="mt-2 list-disc pl-5 text-slate-300">
            {related.map((r) => (
              <li key={r.slug}><Link className="underline" href={`/blog/${r.slug}`}>{r.title}</Link></li>
            ))}
          </ul>
        </section>
      </article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "Article", headline: seoH1(article.title), description: compactDescription(article.title), image: article.images, author: { "@type": "Organization", name: "PortTrip" }, publisher: { "@type": "Organization", name: "PortTrip" } }) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [ {"@type":"ListItem", position:1, name:"Home", item:"https://porttrip.com"}, {"@type":"ListItem", position:2, name:"Cruise Intelligence Library", item:"https://porttrip.com/blog"}, {"@type":"ListItem", position:3, name: article.title, item:`https://porttrip.com/blog/${article.slug}`} ] }) }} />
    </main>
  );
}
