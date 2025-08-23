"use client";
import { useState } from "react";

export default function UpgradeButton({
  plan = "pro",
  children,
  className = "",
}: {
  plan?: "pro" | "unlimited";
  children?: React.ReactNode;
  className?: string;
}) {
  const [busy, setBusy] = useState(false);

  async function go() {
    try {
      setBusy(true);
      // Simple GET — server responds 303 to Stripe
      window.location.href = `/api/stripe/checkout?plan=${plan}`;
    } finally {
      // no-op; navigation occurs
    }
  }

  return (
    <button
      onClick={go}
      disabled={busy}
      className={
        className ||
        "rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 px-4 py-2 font-medium text-white shadow hover:from-sky-400 hover:to-indigo-500 disabled:opacity-60"
      }
    >
      {busy ? "Redirecting…" : children || (plan === "pro" ? "Upgrade to Pro" : "Go Unlimited")}
    </button>
  );
}

