import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BLOG_POSTS, getBlogPost } from "../../data/blog-cms";

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const post = getBlogPost(params.slug);
  if (!post) return {};
  const canonical = `https://porttrip.com/blog/${post.slug}`;
  return {
    title: post.metaTitle,
    description: post.metaDescription,
    keywords: post.keywords,
    alternates: { canonical },
    robots: { index: true, follow: true }
  };
}

export default function BlogArticlePage({ params }: { params: { slug: string } }) {
  const post = getBlogPost(params.slug);
  if (!post) notFound();

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.metaDescription,
    dateModified: post.updatedAt,
    author: { "@type": "Organization", name: "PortTrip" },
    publisher: { "@type": "Organization", name: "PortTrip" },
    mainEntityOfPage: `https://porttrip.com/blog/${post.slug}`
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://porttrip.com/" },
      { "@type": "ListItem", position: 2, name: "Blog", item: "https://porttrip.com/blog" },
      { "@type": "ListItem", position: 3, name: post.title, item: `https://porttrip.com/blog/${post.slug}` }
    ]
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <div className="mx-auto max-w-6xl px-6 py-10">
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <p className="text-xs uppercase tracking-widest text-slate-400">Port guide · {post.region}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{post.title}</h1>
          <p className="mt-3 max-w-3xl text-slate-300">{post.subtitle}</p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border border-sky-400/30 bg-sky-500/10 px-2 py-1">{post.portName}</span>
            <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-1">{post.timeInPort}</span>
            <span className="rounded-full border border-indigo-400/30 bg-indigo-500/10 px-2 py-1">{post.dockingType}</span>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href={post.plannerCta.prefillPort ? `${post.plannerCta.href}?port=${encodeURIComponent(post.plannerCta.prefillPort)}` : post.plannerCta.href} className="rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 px-4 py-2 text-sm font-medium text-white hover:from-sky-400 hover:to-indigo-500">Open Cruise Day Planner</Link>
            <Link href="/chat" className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm hover:bg-white/15">Save this plan</Link>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-indigo-400/30 bg-indigo-500/10 p-4">
          <p className="text-sm text-indigo-100">Use the planner now to tailor this guide to your exact all-aboard time and traveler profile.</p>
          <Link href="/planner" className="mt-3 inline-block rounded-lg bg-white/10 px-3 py-2 text-sm hover:bg-white/15">Plan this port day</Link>
        </section>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_280px]">
          <article>
            {post.sections.map((section) => (
              <section key={section.id} id={section.id} className="mb-10 scroll-mt-24">
                <h2 className="text-2xl font-semibold tracking-tight">{section.heading}</h2>
                <p className="mt-2 text-slate-300">{section.shortIntro}</p>
                <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-slate-200">{section.bullets.map((item) => <li key={item}>{item}</li>)}</ul>
                <ol className="mt-4 list-decimal space-y-1 pl-5 text-sm text-slate-200">{section.steps.map((step) => <li key={step}>{step}</li>)}</ol>
                <div className="mt-4 rounded-xl border border-white/15 bg-slate-900/70 p-4 text-sm">
                  <p className="font-medium text-white">Return-to-Ship Safety Buffer</p>
                  <p className="mt-2 text-slate-300">{section.ifRunningLateRule}</p>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl border border-white/15 bg-white/5 p-4 text-sm"><p className="font-medium">Terminal → City Transport</p><p className="mt-2 text-slate-300">Use official transport options only and preselect your return mode before sightseeing starts.</p></div>
                  <div className="rounded-xl border border-white/15 bg-white/5 p-4 text-sm"><p className="font-medium">Crowd Timing / Best Order</p><p className="mt-2 text-slate-300">Start with your highest-value stop first and avoid major queue-based interiors once you are behind schedule.</p></div>
                  <div className="rounded-xl border border-white/15 bg-white/5 p-4 text-sm"><p className="font-medium">Budget Snapshot</p><p className="mt-2 text-slate-300">Set transport, meal, and contingency caps before leaving port so detours do not erode your return buffer.</p></div>
                  <div className="rounded-xl border border-amber-300/30 bg-amber-500/10 p-4 text-sm"><p className="font-medium text-amber-100">If you are running late</p><p className="mt-2 text-amber-50">{section.ifRunningLateRule}</p></div>
                </div>
                <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4"><p className="text-sm font-medium">Quick checklist</p><ul className="mt-2 list-disc pl-5 text-sm text-slate-300">{section.checklist.map((item) => <li key={item}>{item}</li>)}</ul></div>
              </section>
            ))}

            <section className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
              <h2 className="text-xl font-semibold">FAQs</h2>
              <div className="mt-3 space-y-3">{post.faq.map((f) => <div key={f.q}><h3 className="font-medium">{f.q}</h3><p className="text-sm text-slate-300">{f.a}</p></div>)}</div>
            </section>

            <section className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
              <h2 className="text-xl font-semibold">Related guides</h2>
              <ul className="mt-3 list-disc pl-5 text-sm text-slate-200">{post.internalLinks.map((link) => <li key={link.href}><Link href={link.href} className="underline">{link.title}</Link> — {link.anchorText}</li>)}</ul>
            </section>

            <section className="mt-6 rounded-2xl border border-indigo-400/20 bg-indigo-500/10 p-6">
              <h2 className="text-xl font-semibold">Ready to map this day to your ship schedule?</h2>
              <p className="mt-2 text-sm text-slate-200">Build a timed route with port transfers, spend plan, and safety buffer in the Cruise Day Planner.</p>
              <Link href="/planner" className="mt-4 inline-block rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 px-4 py-2 text-sm font-medium text-white hover:from-sky-400 hover:to-indigo-500">Open Cruise Day Planner</Link>
            </section>
          </article>

          <aside className="hidden lg:block">
            <div className="sticky top-24 rounded-2xl border border-white/10 bg-white/5 p-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">On this page</h2>
              <ul className="mt-3 space-y-2 text-sm">{post.toc.map((item) => <li key={item.id}><a href={`#${item.id}`} className="text-slate-200 hover:text-white">{item.label}</a></li>)}</ul>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
