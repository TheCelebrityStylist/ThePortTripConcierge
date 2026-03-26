import type { Metadata } from "next";
import { legalContent, deleteAccountContent } from "@/app/content/legal";

const pageUrl = `${legalContent.websiteUrl}/delete-account`;

export const metadata: Metadata = {
  title: `Delete Account | ${legalContent.companyName}`,
  description:
    "Public PortTrip account deletion request page with identity verification and expected deletion timeline.",
  alternates: {
    canonical: pageUrl,
  },
  openGraph: {
    title: `Delete Account | ${legalContent.companyName}`,
    description:
      "Submit a PortTrip account deletion request without app access.",
    url: pageUrl,
    type: "website",
    siteName: legalContent.companyName,
  },
};

export default function DeleteAccountPage({
  searchParams,
}: {
  searchParams?: { status?: string; message?: string };
}) {
  const status = searchParams?.status;
  const message = searchParams?.message;
  const isSuccess = status === "success";
  const isError = status === "error";

  return (
    <main className="mx-auto max-w-4xl px-6 py-12 text-slate-200">
      <header className="rounded-3xl border border-white/10 bg-slate-900/40 p-7 shadow-[0_18px_60px_rgba(2,6,23,0.3)]">
        <p className="text-xs uppercase tracking-[0.24em] text-rose-300">Account Management</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Delete Account</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">{deleteAccountContent.intro}</p>
      </header>

      {(isSuccess || isError) && message && (
        <div
          className={`mt-6 rounded-2xl border px-4 py-3 text-sm ${
            isSuccess
              ? "border-emerald-300/25 bg-emerald-500/10 text-emerald-100"
              : "border-rose-300/30 bg-rose-500/10 text-rose-100"
          }`}
        >
          {message}
        </div>
      )}

      <section className="mt-8 space-y-5 rounded-3xl border border-white/10 bg-slate-900/30 p-7">
        <article>
          <h2 className="text-lg font-semibold text-slate-100">Who can request deletion</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">{deleteAccountContent.whoCanRequest}</p>
        </article>
        <article>
          <h2 className="text-lg font-semibold text-slate-100">What gets deleted</h2>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-sm leading-6 text-slate-300">
            {deleteAccountContent.whatGetsDeleted.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
        <article>
          <h2 className="text-lg font-semibold text-slate-100">What may be retained</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">{deleteAccountContent.whatMayBeRetained}</p>
        </article>
        <article>
          <h2 className="text-lg font-semibold text-slate-100">Expected deletion timeline</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">{deleteAccountContent.timeline}</p>
        </article>
        <article>
          <h2 className="text-lg font-semibold text-slate-100">Identity verification</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">{deleteAccountContent.identity}</p>
        </article>
      </section>

      <section className="mt-8 rounded-3xl border border-white/10 bg-slate-900/30 p-7">
        <h2 className="text-xl font-semibold text-slate-100">Submit a deletion request</h2>
        <p className="mt-2 text-sm text-slate-300">If the form fails, email <a className="text-cyan-300 underline decoration-cyan-300/60 underline-offset-4" href={`mailto:${legalContent.privacyEmail}`}>{legalContent.privacyEmail}</a> with subject line: “Account Deletion Request”.</p>

        <form className="mt-5 grid gap-4" method="post" action="/api/delete-account-requests">
          <div>
            <label htmlFor="fullName" className="mb-1 block text-sm font-medium text-slate-200">Full name</label>
            <input id="fullName" name="fullName" required maxLength={120} className="w-full rounded-xl border border-white/15 bg-slate-950/50 px-3 py-2 text-slate-100 outline-none ring-cyan-400/50 placeholder:text-slate-500 focus:ring" />
          </div>

          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-200">Contact email</label>
            <input id="email" name="email" type="email" required maxLength={160} className="w-full rounded-xl border border-white/15 bg-slate-950/50 px-3 py-2 text-slate-100 outline-none ring-cyan-400/50 placeholder:text-slate-500 focus:ring" />
          </div>

          <div>
            <label htmlFor="accountEmail" className="mb-1 block text-sm font-medium text-slate-200">Account email</label>
            <input id="accountEmail" name="accountEmail" type="email" required maxLength={160} className="w-full rounded-xl border border-white/15 bg-slate-950/50 px-3 py-2 text-slate-100 outline-none ring-cyan-400/50 placeholder:text-slate-500 focus:ring" />
          </div>

          <div>
            <label htmlFor="userId" className="mb-1 block text-sm font-medium text-slate-200">User ID (optional)</label>
            <input id="userId" name="userId" maxLength={120} className="w-full rounded-xl border border-white/15 bg-slate-950/50 px-3 py-2 text-slate-100 outline-none ring-cyan-400/50 placeholder:text-slate-500 focus:ring" />
          </div>

          <div>
            <label htmlFor="reason" className="mb-1 block text-sm font-medium text-slate-200">Reason (optional)</label>
            <textarea id="reason" name="reason" rows={4} maxLength={2000} className="w-full rounded-xl border border-white/15 bg-slate-950/50 px-3 py-2 text-slate-100 outline-none ring-cyan-400/50 placeholder:text-slate-500 focus:ring" />
          </div>

          <label className="inline-flex items-start gap-2 text-sm text-slate-300">
            <input name="confirmation" type="checkbox" value="yes" required className="mt-1 h-4 w-4 rounded border-white/20 bg-slate-950/50" />
            <span>I confirm I am authorized to request deletion for this account and that the information above is accurate.</span>
          </label>

          <button type="submit" className="mt-2 rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-cyan-300">Submit deletion request</button>
        </form>

        <p className="mt-4 text-xs text-slate-400">After submission, you will be redirected with a status message. We will follow up using the contact details you provide.</p>
      </section>
    </main>
  );
}
