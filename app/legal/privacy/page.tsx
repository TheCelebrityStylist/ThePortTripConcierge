export const metadata = {
  title: "Privacy Policy — PortTrip",
  description: "Privacy Policy for PortTrip."
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10 text-slate-200">
      <h1 className="text-3xl font-semibold">Privacy Policy</h1>
      <p className="mt-4 text-sm text-slate-300">
        Last updated: {new Date().toLocaleDateString()}
      </p>

      <section className="mt-8 space-y-4 leading-7">
        <p>
          We collect minimal data required to operate PortTrip (e.g., usage counts,
          purchase status). We do not sell personal data.
        </p>
        <h2 className="mt-6 text-xl font-semibold">Data We Process</h2>
        <ul className="list-disc pl-6">
          <li>Chat prompts and generated plans to provide the Service</li>
          <li>Subscription and payment status via Stripe</li>
          <li>Basic analytics (page views, device data)</li>
        </ul>
        <h2 className="mt-6 text-xl font-semibold">Payments</h2>
        <p>
          We use Stripe as our payment processor. Card data is handled by Stripe and not
          stored on our servers.
        </p>
        <h2 className="mt-6 text-xl font-semibold">Your Rights</h2>
        <p>
          You may request deletion of your data or ask questions at{" "}
          <a className="underline" href="mailto:support@porttrip.com">support@porttrip.com</a>.
        </p>
      </section>
    </main>
  );
}
