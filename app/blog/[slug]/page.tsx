import type { Metadata } from "next";
import Image from "next/image";
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
    keywords: article.keywords,
    alternates: { canonical: `https://porttrip.com/blog/${article.slug}` },
    openGraph: {
      title: article.metaTitle,
      description: article.metaDescription,
      type: "article",
      images: [article.featuredImage],
      url: `https://porttrip.com/blog/${article.slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title: article.metaTitle,
      description: article.metaDescription,
      images: [article.featuredImage],
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

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.seoTitle,
    author: { "@type": "Organization", name: "PortTrip" },
    publisher: { "@type": "Organization", name: "PortTrip" },
    datePublished: article.publishedDate,
    dateModified: article.updatedDate,
    image: article.featuredImage,
    description: article.metaDescription,
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

  const relatedGuides = blogArticles.filter((a) => a.slug !== article.slug && a.category === article.category).slice(0, 3);
  const relatedPosts = blogArticles.filter((a) => a.slug !== article.slug).slice(0, 2);

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100">
      <article className="mx-auto max-w-4xl">
        <Link href="/blog" className="text-sm text-slate-300 underline">← Back to library</Link>
        <h1 className="mt-3 text-4xl font-semibold">{article.seoTitle}</h1>
        <p className="mt-3 text-slate-300">{article.metaDescription}</p>

        <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-300">
          <span className="rounded-full bg-white/10 px-3 py-1">Written by {article.author}</span>
          <span className="rounded-full bg-white/10 px-3 py-1">Published {article.publishedDate}</span>
          <span className="rounded-full bg-white/10 px-3 py-1">Updated {article.updatedDate}</span>
          <span className="rounded-full bg-white/10 px-3 py-1">Reading time {article.readingMinutes} min</span>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {article.images.map((src, i) => (
            <Image
              key={src + i}
              src={src}
              alt={i === 0 ? `${article.title.split(" ")[0]} cruise port terminal` : i === 1 ? `${article.title.split(" ")[0]} cruise port walking route` : `${article.title.split(" ")[0]} cruise ship dock location`}
              width={900}
              height={560}
              loading={i === 0 ? "eager" : "lazy"}
              priority={i === 0}
              className="h-56 w-full rounded-xl object-cover"
            />
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
            {section.subtopics.map((sub) => (
              <div key={sub.h3} className="mt-4">
                <h3 className="text-lg font-medium text-sky-300">{sub.h3}</h3>
                {sub.paragraphs.map((p, idx) => (
                  <p key={idx} className="mt-3 text-slate-300">{p}</p>
                ))}
              </div>
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

        <section className="mt-8 rounded-xl border border-white/10 bg-white/5 p-4">
          <h2 className="text-xl font-semibold">Related cruise port guides</h2>
          <ul className="mt-2 list-disc pl-5 text-slate-300">
            {relatedGuides.map((r) => (
              <li key={r.slug}><Link className="underline" href={`/blog/${r.slug}`}>{r.title}</Link></li>
            ))}
          </ul>
          <h3 className="mt-4 text-lg font-medium">Related planning articles</h3>
          <ul className="mt-2 list-disc pl-5 text-slate-300">
            {relatedPosts.map((r) => (
              <li key={r.slug}><Link className="underline" href={`/blog/${r.slug}`}>{r.title}</Link></li>
            ))}
          </ul>
        </section>

        <section className="mt-8 rounded-xl border border-cyan-300/20 bg-cyan-500/10 p-4">
          <p className="text-sm font-medium">Plan Your Cruise Day With Real-Time Safety Buffers →</p>
          <Link href={`/plan?prefill=${article.slug}`} className="mt-3 inline-block rounded-lg bg-cyan-500 px-4 py-2 font-medium text-slate-900">Open Cruise Day Planner</Link>
        </section>
      </article>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
    </main>
  );
}
