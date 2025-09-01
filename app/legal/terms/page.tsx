export const metadata = {
  title: "Terms of Service — PortTrip",
  description: "Terms of Service for PortTrip."
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10 text-slate-200">
      <h1 className="text-3xl font-semibold">Terms of Service</h1>
      <p className="mt-4 text-sm text-slate-300">
        Last updated: {new Date().toLocaleDateString()}
      </p>

      <section className="mt-8 space-y-4 leading-7">
        <p>
          Welcome to PortTrip. By accessing or using our website and app, you agree to
          these Terms of Service. If you do not agree, do not use the Service.
        </p>
        <h2 className="mt-6 text-xl font-semibold">1. Service</h2>
        <p>
          PortTrip provides itinerary suggestions and related information. Results are
          generated automatically and may contain inaccuracies. Always verify critical
          details (opening hours, transit, tickets).
        </p>
        <h2 className="mt-6 text-xl font-semibold">2. Accounts & Subscriptions</h2>
        <p>
          Paid plans are billed in advance on a monthly basis and renew automatically
          until cancelled. You may cancel at any time and will retain access until the
          end of the current billing period.
        </p>
        <h2 className="mt-6 text-xl font-semibold">3. Acceptable Use</h2>
        <p>
          You agree not to misuse the Service, attempt to circumvent limits, or
          reverse-engineer our systems.
        </p>
        <h2 className="mt-6 text-xl font-semibold">4. Disclaimers</h2>
        <p>
          The Service is provided “as is” without warranties of any kind. PortTrip is
          not liable for indirect or consequential damages.
        </p>
        <h2 className="mt-6 text-xl font-semibold">5. Contact</h2>
        <p>
          Questions? Email <a className="underline" href="mailto:support@porttrip.com">support@porttrip.com</a>.
        </p>
      </section>
    </main>
  );
}
