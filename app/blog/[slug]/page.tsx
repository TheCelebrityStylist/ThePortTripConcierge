import type { Metadata } from "next";
import Link from "next/link";
import { blogPosts } from "@/app/data/blog";

type Props = { params: { slug: string } };

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

function getPost(slug: string) {
  return blogPosts.find((p) => p.slug === slug);
}

export function generateMetadata({ params }: Props): Metadata {
  const post = getPost(params.slug);
  if (!post) return {};
  return {
    title: `${post.title} | PortTrip Blog`,
    description: post.description,
    alternates: { canonical: `https://porttrip.com/blog/${post.slug}` },
    openGraph: { title: post.title, description: post.description, type: "article" },
  };
}

export default function BlogPostPage({ params }: Props) {
  const post = getPost(params.slug);
  if (!post) return <main className="min-h-screen p-10">Post not found.</main>;

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100">
      <article className="mx-auto max-w-3xl">
        <Link href="/blog" className="text-sm text-slate-300 underline">← Back to blog</Link>
        <h1 className="mt-3 text-4xl font-semibold">{post.title}</h1>
        <p className="mt-3 text-slate-300">{post.description}</p>

        <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4">
          <h2 className="font-semibold">Table of contents</h2>
          <ol className="mt-2 list-decimal pl-5 text-sm text-slate-300">
            {post.sections.map((s) => (
              <li key={s.heading}><a href={`#${s.heading.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>{s.heading}</a></li>
            ))}
          </ol>
        </div>

        {post.sections.map((section) => (
          <section id={section.heading.toLowerCase().replace(/[^a-z0-9]+/g, "-")} key={section.heading} className="mt-8">
            <h2 className="text-2xl font-semibold">{section.heading}</h2>
            <p className="mt-3 text-slate-300">{section.body}</p>
            <p className="mt-3 text-slate-300">{section.body}</p>
          </section>
        ))}

        <div className="mt-8 rounded-xl border border-sky-300/20 bg-sky-500/10 p-4 text-sm">
          CTA: Build your own itinerary in <Link href="/chat" className="underline">PortTrip Cruise Intelligence</Link>.
        </div>
      </article>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "BlogPosting", headline: post.title, description: post.description, keywords: post.heroKeywords.join(","), datePublished: "2026-01-01", author: { "@type": "Organization", name: "PortTrip" } }) }} />
    </main>
  );
}
