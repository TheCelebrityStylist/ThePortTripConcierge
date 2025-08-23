// app/api/stripe/checkout/route.ts
import Stripe from "stripe";

export const runtime = "edge";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

export async function POST(req: Request) {
  try {
    const { plan } = (await req.json().catch(() => ({}))) as {
      plan?: "pro" | "unlimited";
    };
    const price =
      plan === "unlimited"
        ? process.env.STRIPE_PRICE_UNLIMITED
        : process.env.STRIPE_PRICE_PRO;

    if (!price) {
      return new Response(JSON.stringify({ error: "Missing Stripe price id." }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const base = process.env.NEXT_PUBLIC_BASE_URL!;
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price, quantity: 1 }],
      success_url: `${base}/api/stripe/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/chat`,
      allow_promotion_codes: true,
      metadata: { plan: plan || "pro" },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || "Checkout failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}



