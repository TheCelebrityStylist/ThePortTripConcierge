import type { Metadata } from "next";
import { legalContent, privacySections } from "@/app/content/legal";

const pageUrl = `${legalContent.websiteUrl}/privacy`;

export const metadata: Metadata = {
  title: `Privacy Policy | ${legalContent.companyName}`,
  description:
    "Review how PortTrip collects, uses, secures, retains, and deletes personal information.",
  alternates: {
    canonical: pageUrl,
  },
  openGraph: {
    title: `Privacy Policy | ${legalContent.companyName}`,
    description:
      "Learn how PortTrip handles personal data, third-party services, retention, and deletion requests.",
    url: pageUrl,
    type: "article",
    siteName: legalContent.companyName,
  },
};

const sectionTitleClass = "text-xl font-semibold text-slate-100";

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12 text-slate-200">
      <header className="rounded-3xl border border-white/10 bg-slate-900/40 p-7 shadow-[0_18px_60px_rgba(2,6,23,0.3)]">
        <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Legal</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Privacy Policy</h1>
        <p className="mt-3 text-sm text-slate-300">Effective date: {legalContent.effectiveDate}</p>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">This policy describes how {legalContent.companyName} collects, uses, shares, protects, retains, and deletes personal data when you use our website and services.</p>
      </header>

      <section className="mt-8 space-y-7 rounded-3xl border border-white/10 bg-slate-900/30 p-7 leading-7">
        <div>
          <h2 className={sectionTitleClass}>1) Who we are / developer contact</h2>
          <p className="mt-2 text-slate-300">{privacySections.whoWeAre}</p>
          <p className="mt-2 text-slate-300">Developer: {legalContent.developerName}. Contact: <a href={`mailto:${legalContent.privacyEmail}`} className="text-cyan-300 underline decoration-cyan-300/60 underline-offset-4">{legalContent.privacyEmail}</a>.</p>
        </div>

        <div>
          <h2 className={sectionTitleClass}>2) What data we collect</h2>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-slate-300">
            {privacySections.dataCollected.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className={sectionTitleClass}>3) How we use data</h2>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-slate-300">
            {privacySections.howWeUseData.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className={sectionTitleClass}>4) Legal bases / consent where relevant</h2>
          <p className="mt-2 text-slate-300">{privacySections.legalBases}</p>
        </div>

        <div>
          <h2 className={sectionTitleClass}>5) Third-party services used</h2>
          <p className="mt-2 text-slate-300">We use service providers to operate key product features. These may process data on our behalf under their own terms and privacy policies.</p>
          <ul className="mt-3 list-disc space-y-2 pl-6 text-slate-300">
            {legalContent.thirdParties.map((provider) => (
              <li key={provider.name}>
                <span className="font-medium text-slate-100">{provider.name}</span>: {provider.purpose} ({" "}
                <a href={provider.link} target="_blank" rel="noreferrer" className="text-cyan-300 underline decoration-cyan-300/60 underline-offset-4">
                  policy
                </a>
                ).
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className={sectionTitleClass}>6) Data retention</h2>
          <p className="mt-2 text-slate-300">{privacySections.retention}</p>
        </div>

        <div>
          <h2 className={sectionTitleClass}>7) Data deletion</h2>
          <p className="mt-2 text-slate-300">{privacySections.deletion}</p>
          <p className="mt-2 text-slate-300">To request deletion, visit <a className="text-cyan-300 underline decoration-cyan-300/60 underline-offset-4" href="/delete-account">/delete-account</a> or email <a href={`mailto:${legalContent.privacyEmail}`} className="text-cyan-300 underline decoration-cyan-300/60 underline-offset-4">{legalContent.privacyEmail}</a>.</p>
        </div>

        <div>
          <h2 className={sectionTitleClass}>8) User rights</h2>
          <p className="mt-2 text-slate-300">{privacySections.userRights}</p>
        </div>

        <div>
          <h2 className={sectionTitleClass}>9) Security</h2>
          <p className="mt-2 text-slate-300">{privacySections.security}</p>
        </div>

        <div>
          <h2 className={sectionTitleClass}>10) Children&apos;s privacy</h2>
          <p className="mt-2 text-slate-300">{privacySections.children}</p>
        </div>

        <div>
          <h2 className={sectionTitleClass}>11) International transfers</h2>
          <p className="mt-2 text-slate-300">{privacySections.transfers}</p>
          <p className="mt-2 text-slate-300">Primary operating jurisdictions: {legalContent.jurisdictions}.</p>
        </div>

        <div>
          <h2 className={sectionTitleClass}>12) Contact information</h2>
          <p className="mt-2 text-slate-300">General support: <a href={`mailto:${legalContent.supportEmail}`} className="text-cyan-300 underline decoration-cyan-300/60 underline-offset-4">{legalContent.supportEmail}</a>.</p>
          <p className="mt-1 text-slate-300">Privacy requests: <a href={`mailto:${legalContent.privacyEmail}`} className="text-cyan-300 underline decoration-cyan-300/60 underline-offset-4">{legalContent.privacyEmail}</a>.</p>
        </div>
      </section>
    </main>
  );
}
