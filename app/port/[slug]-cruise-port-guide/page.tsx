import type { Metadata } from "next";
import Link from "next/link";
import { portIntelligence } from "@/app/data/cruise-intelligence";

type Props = { params: { slug: string } };

export function generateStaticParams() {
  return portIntelligence.map((p) => ({ slug: p.slug }));
}

function getPort(slug: string) {
  return portIntelligence.find((p) => p.slug === slug);
}

export function generateMetadata({ params }: Props): Metadata {
  const port = getPort(params.slug);
  if (!port) return {};
  const title = `${port.city} Cruise Port Guide (2026) – What To Do In 1 Day`;
  const description = `Cruise intelligence for ${port.city}: top attractions, transport, budget, tender waits, walkability, and return-to-ship safety.`;
  const url = `https://porttrip.com/port/${port.slug}-cruise-port-guide`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "article" },
    twitter: { card: "summary_large_image", title, description },
  };
}

function faqJsonLd(name: string) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      { "@type": "Question", name: `Is ${name} cruise port walkable?`, acceptedAnswer: { "@type": "Answer", text: `${name} can be walkable for nearby attractions, but route optimization and buffer planning are critical.` } },
      { "@type": "Question", name: "How early should I return to the ship?", acceptedAnswer: { "@type": "Answer", text: "Use a minimum 75-120 minute return buffer depending on traffic and tender conditions." } },
    ],
  };
}

export default function SeoPortGuidePage({ params }: Props) {
  const port = getPort(params.slug);
  if (!port) return <main className="min-h-screen p-10">Port guide not found.</main>;

  const repeated = Array.from({ length: 8 }).map((_, i) => (
    <p key={i} className="mt-3 text-slate-300">
      {port.city} cruise planning demands cruise-specific intelligence: terminal flow, transport friction, queue risk, walking difficulty, closure risk, and return safety. PortTrip computes a realistic timeline using local distance and congestion signals so you can maximize experiences while avoiding missed-all-aboard risk.
    </p>
  ));

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100">
      <article className="mx-auto max-w-4xl">
        <nav className="mb-3 text-sm text-slate-300"><Link href="/">Home</Link> / <Link href="/ports">Ports</Link> / {port.city}</nav>
        <h1 className="text-4xl font-semibold">{port.city} Cruise Port Guide (2026) – What To Do In 1 Day</h1>
        <p className="mt-4 text-slate-300">Terminal: {port.terminalName} · Dock type: {port.dockType} · Tender wait estimate: {port.tenderWaitEstimateMinutes[0]}-{port.tenderWaitEstimateMinutes[1]} minutes</p>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold">Best things to do near port</h2>
          {port.attractions.map((a) => (
            <div key={a.id} className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3">
              <p><strong>{a.name}</strong> · {a.distanceKm}km · {a.timeRequiredMinutes} mins · €{a.costRangeEur[0]}-€{a.costRangeEur[1]}</p>
            </div>
          ))}
          {repeated}
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold">Transport guide from cruise port</h2>
          <p className="mt-3 text-slate-300">Use taxi, public transit, or walk based on crowd and buffer windows. Strike risk in this region: {port.strikeRisk}.</p>
          {repeated.slice(0, 4)}
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold">Return-to-ship advice</h2>
          <p className="mt-3 text-slate-300">Always set your must-return-by time before starting the day. Increase buffer if your itinerary requires complex transfers.</p>
          {repeated.slice(0, 4)}
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold">Budget comparison: ship tour vs DIY</h2>
          <p className="mt-3 text-slate-300">Ship tours can exceed €99-€179 per person while optimized DIY routes often cost €25-€60 including transport and food.</p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold">Local food and hidden gems</h2>
          <p className="mt-3 text-slate-300">Local dishes: {port.localFood.join(", ")}.</p>
          <p className="mt-2 text-slate-300">Cafés: {port.cafes.join(" · ")}.</p>
          <p className="mt-2 text-slate-300">Hidden spot: {port.hiddenGem}. Instagram location: {port.instagramSpot}.</p>
        </section>
      </article>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(port.city)) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://porttrip.com" },
            { "@type": "ListItem", position: 2, name: "Ports", item: "https://porttrip.com/ports" },
            { "@type": "ListItem", position: 3, name: `${port.city} Cruise Port Guide`, item: `https://porttrip.com/port/${port.slug}-cruise-port-guide` },
          ] }),
        }}
      />
    </main>
  );
}
