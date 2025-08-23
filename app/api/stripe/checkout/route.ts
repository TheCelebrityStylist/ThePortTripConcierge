// app/api/stripe/checkout/route.ts
export const runtime = "edge";

const STRIPE_BASE = "https://api.stripe.com/v1";

// Required env:
// STRIPE_SECRET_KEY
// STRIPE_PRICE_PRO            (price_...)
// STRIPE_PRICE_UNLIMITED      (price_...)
// STRIPE_SUCCESS_URL          (e.g. https://your.site/thanks?session_id={CHECKOUT_SESSION_ID})
// STRIPE_CANCEL_URL           (e.g. https://your.site/pricing)

function required(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const plan = (url.searchParams.get("plan") || "pro").toLowerCase(); // "pro" | "unlimited"
    const price =
      plan === "unlimited"
        ? required("STRIPE_PRICE_UNLIMITED")
        : required("STRIPE_PRICE_PRO");

    const body = new URLSearchParams({
      mode: "subscription",
      "line_items[0][price]": price,
      "line_items[0][quantity]": "1",
      success_url: required("STRIPE_SUCCESS_URL"),
      cancel_url: required("STRIPE_CANCEL_URL"),
      // Let Stripe create or reuse customer by email in Checkout
      // You can also pre-fill customer_email, etc.
      // After success, use your success page to set cookies if needed.
      automatic_tax: "enabled",
    });

    const res = await fetch(`${STRIPE_BASE}/checkout/sessions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${required("STRIPE_SECRET_KEY")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    if (!res.ok) {
      const t = await res.text();
      return new Response(t, { status: 500 });
    }

    const session = await res.json();
    // Redirect user-agent to Stripe-hosted Checkout
    return new Response(null, {
      status: 303,
      headers: { Location: session.url },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}




