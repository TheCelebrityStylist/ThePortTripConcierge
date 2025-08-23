"use client";

import { useState } from "react";

type Plan = "pro" | "unlimited";

interface Props {
  plan?: Plan;              // which plan to buy (default: "pro")
  label?: string;           // optional label; children takes precedence
  className?: string;       // optional styling
  children?: React.ReactNode;
}

export default function UpgradeButton({
  plan = "pro",
  label,
  className = "",
  children,
}: Props) {
  const [loading, setLoading] = useState(false);

  async function startCheckout() {
    if (loading) return;
    setLoading(true);
    try {
      // If your route is GET instead of POST, switch method accordingly.
      const res = await fetch(`/api/stripe/checkout?plan=${plan}`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.url) throw new Error(data?.error || "Checkout failed.");
      window.location.href = data.url;
    } catch (err: any) {
      alert(err?.message || "Could not start checkout.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={startCheckout}
      disabled={loading}
      className={`rounded px-2 py-0.5 hover:bg-white/10 disabled:opacity-60 ${className}`}
      aria-label={label || (typeof children === "string" ? children : `Upgrade ${plan}`)}
    >
      {children ?? label ?? (plan === "pro" ? "Upgrade to Pro" : "Go Unlimited")}
    </button>
  );
}
