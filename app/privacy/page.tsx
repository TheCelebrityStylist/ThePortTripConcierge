import type { Metadata } from "next";
import { legalContent, privacySections } from "@/app/content/legal";

const pageUrl = `${legalContent.websiteUrl}/privacy`;

export const metadata: Metadata = {
  title: `Privacy Policy | ${legalContent.companyName}`,
  description:
    "GDPR-aware PortTrip privacy policy covering legal bases, rights, data retention, deletion, security, and international transfers.",
  alternates: {
    canonical: pageUrl,
  },
  openGraph: {
    title: `Privacy Policy | ${legalContent.companyName}`,
    description:
      "How PortTrip handles personal data, GDPR rights, third-party processors, retention, and deletion requests.",
    url: pageUrl,
    type: "article",
    siteName: legalContent.companyName,
  },
};

const titleClass = "text-xl font-semibold text-slate-100";

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-12 text-slate-200">
      <header className="rounded-3xl border border-white/10 bg-slate-900/40 p-7 shadow-[0_18px_60px_rgba(2,6,23,0.3)]">
        <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Legal</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Privacy Policy</h1>
        <p className="mt-3 text-sm text-slate-300">Effective date: {legalContent.effectiveDate}</p>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
          This policy explains what personal data we process, why we process it, the legal bases we rely on,
          how long we keep data, and your rights under applicable laws including GDPR/UK GDPR where relevant.
        </p>
      </header>

      <section className="mt-8 space-y-7 rounded-3xl border border-white/10 bg-slate-900/30 p-7 leading-7">
        <div>
          <h2 className={titleClass}>1) Who we are / developer contact</h2>
          <p className="mt-2 text-slate-300">{privacySections.whoWeAre}</p>
          <p className="mt-2 text-slate-300">
            Data Controller: {legalContent.legalEntityName}. Privacy contact:{" "}
            <a href={`mailto:${legalContent.privacyEmail}`} className="text-cyan-300 underline decoration-cyan-300/60 underline-offset-4">
              {legalContent.privacyEmail}
            </a>
            .
          </p>
        </div>

        <div>
          <h2 className={titleClass}>2) What data we collect</h2>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-slate-300">
            {privacySections.dataCollected.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className={titleClass}>3) How we use data</h2>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-slate-300">
            {privacySections.howWeUseData.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className={titleClass}>4) Legal bases / consent (GDPR-focused)</h2>
          <p className="mt-2 text-slate-300">For users in the EEA/UK and where GDPR-like regimes apply, we rely on the following legal bases under Article 6 GDPR:</p>
          <ul className="mt-3 list-disc space-y-2 pl-6 text-slate-300">
            {privacySections.legalBases.map((item) => (
              <li key={item.basis}>
                <span className="font-medium text-slate-100">{item.basis}:</span> {item.details}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className={titleClass}>5) Third-party services used (processors/providers)</h2>
          <p className="mt-2 text-slate-300">We use third-party providers to operate key functionality. These providers may process personal data under their own privacy policies and contractual terms.</p>
          <ul className="mt-3 list-disc space-y-2 pl-6 text-slate-300">
            {legalContent.thirdParties.map((provider) => (
              <li key={provider.name}>
                <span className="font-medium text-slate-100">{provider.name}</span>: {provider.purpose} ({" "}
                <a href={provider.link} target="_blank" rel="noreferrer" className="text-cyan-300 underline decoration-cyan-300/60 underline-offset-4">
                  privacy policy
                </a>
                ).
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className={titleClass}>6) Data retention</h2>
          <p className="mt-2 text-slate-300">{privacySections.retention}</p>
        </div>

        <div>
          <h2 className={titleClass}>7) Data deletion</h2>
          <p className="mt-2 text-slate-300">{privacySections.deletion}</p>
          <p className="mt-2 text-slate-300">Public deletion URL: <a className="text-cyan-300 underline decoration-cyan-300/60 underline-offset-4" href="/delete-account">/delete-account</a>.</p>
        </div>

        <div>
          <h2 className={titleClass}>8) User rights</h2>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-slate-300">
            {privacySections.userRights.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="mt-2 text-slate-300">
            To exercise rights, contact{" "}
            <a href={`mailto:${legalContent.privacyEmail}`} className="text-cyan-300 underline decoration-cyan-300/60 underline-offset-4">
              {legalContent.privacyEmail}
            </a>
            . We may need to verify identity before completing a request.
          </p>
        </div>

        <div>
          <h2 className={titleClass}>9) Security</h2>
          <p className="mt-2 text-slate-300">{privacySections.security}</p>
        </div>

        <div>
          <h2 className={titleClass}>10) Children&apos;s privacy</h2>
          <p className="mt-2 text-slate-300">{privacySections.children}</p>
        </div>

        <div>
          <h2 className={titleClass}>11) International transfers</h2>
          <p className="mt-2 text-slate-300">{privacySections.transfers}</p>
          <p className="mt-2 text-slate-300">Primary operating jurisdictions: {legalContent.jurisdictions}.</p>
        </div>

        <div>
          <h2 className={titleClass}>12) Contact information</h2>
          <p className="mt-2 text-slate-300">General support: <a href={`mailto:${legalContent.supportEmail}`} className="text-cyan-300 underline decoration-cyan-300/60 underline-offset-4">{legalContent.supportEmail}</a>.</p>
          <p className="mt-1 text-slate-300">Privacy requests: <a href={`mailto:${legalContent.privacyEmail}`} className="text-cyan-300 underline decoration-cyan-300/60 underline-offset-4">{legalContent.privacyEmail}</a>.</p>
        </div>

        <div>
          <h2 className={titleClass}>Additional GDPR transparency notes</h2>
          <p className="mt-2 text-slate-300">{privacySections.automatedDecisionMaking}</p>
          <p className="mt-2 text-slate-300">If you are in the EEA/UK, you may also lodge a complaint with your local data protection supervisory authority.</p>
        </div>
      </section>
    </main>
  );
}
