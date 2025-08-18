"use client";
export default function UpgradeButton({ label = "Upgrade" }: { label?: string }) {
  const url = process.env.NEXT_PUBLIC_CHECKOUT_URL; // Stripe Checkout or Gumroad, LemonSqueezy, etc.
  return (
    <a
      href={url || "mailto:hello@example.com?subject=Upgrade%20PortTrip"}
      className="inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 px-5 py-3 font-medium text-white shadow-lg shadow-indigo-900/30 hover:from-sky-400 hover:to-indigo-500"
    >
      {label}
    </a>
  );
}

