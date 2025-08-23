// Use Node runtime for Stripe SDK (required)
export const runtime = "nodejs";

import Stripe from "stripe";

/**
 * Map plan -> Stripe Price ID
 * Make sure these env vars exist in your Vercel project:
 *  - STRIPE_SECRET_KEY
 *  - STRIPE_PRICE_PRO_ID
 *  - STRIPE_PRICE_UNLIMITED_ID
 */
const priceByPlan: Record<"pro" | "unlimited", string> = {
  pro: process.env.STRIPE_PRICE_PRO_ID || "",
  unlimited: process.env.STRIPE_PRICE_UNLIMITED_ID || "",
};

// Build success/cancel URLs based on the current host (works on Vercel preview/prod)
function originFrom(req: Request) {
  const url = new URL(req.url);
  return `${url.protocol}//${url.host}`;
}

function assertEnv() {
  const missing: string[] = [];
  if (!process.env.STRIPE_SECRET_KEY) missing.push("STRIPE_SECRET_KEY");
  if (!priceByPlan.pro) missing.push("STRIPE_PRICE_PRO_ID");
  if (!priceByPlan.unlimited) missing.push("STRIPE_PRICE_UNLIMITED_ID");
  if (missing.length) {
    throw new Error(`Missing env vars: ${missing.join(", ")}`);
  }
}

function newStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2023-10-16",
  });
}

/**
 * Optional GET for quick manual testing in a browser:
 *   /api/stripe/checkout?plan=pro
 */
export async function GET(req: Request) {
  try {
    assertEnv();
    const url = new URL(req.url);
    const plan = (url.searchParams.get("plan") || "").toLowerCase() as
      | "pro"
      | "unlimited";

    if (!priceByPlan[plan]) {
      return Response.json({ error: `Unknown or missing plan: "${plan}"` }, { status: 400 });
    }

    const stripe = newStripe();
    const origin = originFrom(req);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceByPlan[plan], quantity: 1 }],
      success_url: `${origin}/chat?status=success&plan=${plan}`,
      cancel_url: `${origin}/chat?status=cancel`,
      // Add your customer/metadata here if you have auth:
      // customer: "cus_xxx",
      // metadata: { userId: "abc123" },
    });

    return Response.json({ url: session.url }, { status: 200 });
  } catch (err: any) {
    return Response.json({ error: `Stripe checkout error: ${String(err?.message || err)}` }, { status: 500 });
  }
}

/**
 * Main handler used by the app (POST)
 * Frontend calls: fetch('/api/stripe/checkout?plan=pro', { method: 'POST' })
 */
export async function POST(req: Request) {
  try {
    assertEnv();
    const url = new URL(req.url);
    // Accept plan via query (?plan=pro) or JSON body { plan: "pro" }
    let plan = (url.searchParams.get("plan") || "").toLowerCase() as
      | "pro"
      | "unlimited";

    if (!plan) {
      const body = await req.json().catch(() => ({} as any));
      plan = (body?.plan || "").toLowerCase();
    }

    if (!priceByPlan[plan]) {
      return Response.json({ error: `Unknown or missing plan: "${plan}"` }, { status: 400 });
    }

    const stripe = newStripe();
    const origin = originFrom(req);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceByPlan[plan], quantity: 1 }],
      success_url: `${origin}/chat?status=success&plan=${plan}`,
      cancel_url: `${origin}/chat?status=cancel`,
    });

    // Frontend will redirect to this URL
    return Response.json({ url: session.url }, { status: 200 });
  } catch (err: any) {
    return Response.json({ error: `Stripe checkout error: ${String(err?.message || err)}` }, { status: 500 });
  }
}


