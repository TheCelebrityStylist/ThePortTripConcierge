// app/api/stripe/checkout/route.ts
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  // This is the latest stable version supported by stripe-node typings
  apiVersion: "2023-10-16",
});

/**
 * POST /api/stripe/checkout
 * Body JSON: { plan: "pro" | "unlimited" , email?: string }
 */
export async function POST(req: Request) {
  try {
    const { plan, email } = await req.json().catch(() => ({}));

    const price =
      plan === "unlimited"
        ? process.env.STRIPE_PRICE_UNLIMITED
        : process.env.STRIPE_PRICE_PRO;

    if (!price) {
      return new Response(
        JSON.stringify({ error: "Stripe Price ID not configured." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Where Stripe should send the user after payment
    const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const success_url = `${base}/chat?upgraded=1`;
    const cancel_url = `${base}/chat?upgrade=cancelled`;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      success_url,
      cancel_url,
      customer_email: email || undefined,
      line_items: [{ price, quantity: 1 }],
      metadata: { plan },
      // optional: let Stripe collect billing addresses etc.
      allow_promotion_codes: true,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[stripe/checkout] error:", err);
    return new Response(JSON.stringify({ error: err?.message || "Stripe error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}


