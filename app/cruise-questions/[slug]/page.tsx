import type { Metadata } from "next";
import Link from "next/link";
import { seoPorts } from "@/app/data/seo-ports";

type Props = { params: { slug: string } };

const questionPages = seoPorts.flatMap((p) => p.longTailPages.map((slug) => ({ slug, city: p.city, portSlug: p.slug })));

export function generateStaticParams() {
  return questionPages.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const page = questionPages.find((p) => p.slug === params.slug);
  if (!page) return {};
  const title = page.slug.replace(/-/g, " ");
  return {
    title: `${title} | PortTrip`,
    description: `Cruise-specific answer for ${page.city} with timing, budget, and safety buffer logic.`,
    alternates: { canonical: `https://porttrip.com/cruise-questions/${page.slug}` },
  };
}

export default function CruiseQuestionPage({ params }: Props) {
  const page = questionPages.find((p) => p.slug === params.slug);
  if (!page) return <main className="min-h-screen p-10">Question page not found.</main>;
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100">
      <article className="mx-auto max-w-3xl">
        <h1 className="text-4xl font-semibold capitalize">{params.slug.replace(/-/g, " ")}</h1>
        <p className="mt-4 text-slate-300">This cruise intelligence answer covers {page.city} with route optimization, return-to-ship risk scoring, and budget-smart alternatives to ship excursions.</p>
        <p className="mt-3 text-slate-300">Use this answer as a practical planning baseline, then run Concierge for a ship-specific timed plan.</p>
        <Link href={`/port/${page.portSlug}-cruise-port-guide`} className="mt-4 inline-block underline">Read full {page.city} port guide</Link>
      </article>
    </main>
  );
}
