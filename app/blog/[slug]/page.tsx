/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import { blogArticles } from "@/app/data/blog-cms";

type Props = { params: { slug: string } };

function getArticle(slug: string) {
  return blogArticles.find((a) => a.slug === slug);
}

export function generateStaticParams() {
  return blogArticles.map((a) => ({ slug: a.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const article = getArticle(params.slug);
  if (!article) return {};
  return {
    title: article.metaTitle,
    description: article.metaDescription,
    alternates: { canonical: `https://porttrip.com/blog/${article.slug}` },
    openGraph: {
      title: article.metaTitle,
      description: article.metaDescription,
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
        <h1 className="mt-3 text-4xl font-semibold">{article.title}</h1>
        <p className="mt-3 text-slate-300">{article.metaDescription}</p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {article.images.map((src, i) => (
            <img key={src + i} src={src} alt={`${article.title} cruise port image ${i + 1}`} loading="lazy" className="h-64 w-full rounded-xl object-cover" />
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
            <h3 className="mt-2 text-lg font-medium text-sky-300">{section.h3}</h3>
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
    </main>
  );
}
