// app/api/stripe/checkout/route.ts
export const runtime = "nodejs";

import Stripe from "stripe";
import { NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16", // ✅ matches the SDK’s type union
});

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const plan = (searchParams.get("plan") || "pro").toLowerCase(); // "pro" | "unlimited"

    const priceId =
      plan === "unlimited"
        ? process.env.STRIPE_PRICE_UNLIMITED
        : process.env.STRIPE_PRICE_PRO;

    if (!priceId) {
      return NextResponse.json(
        { error: "Price not configured for this plan." },
        { status: 400 }
      );
    }

    const base = process.env.NEXT_PUBLIC_BASE_URL!;
    if (!base) {
      return NextResponse.json(
        { error: "NEXT_PUBLIC_BASE_URL not set" },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      success_url: `${base}/chat?status=success`,
      cancel_url: `${base}/chat?status=cancel`,
    });

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Checkout failed" },
      { status: 500 }
    );
  }
}

