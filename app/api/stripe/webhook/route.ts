// app/api/stripe/webhook/route.ts
import Stripe from "stripe";

export const runtime = "edge";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

// Edge-compatible raw body reader
async function rawBody(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) return new Uint8Array();
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }
  return chunks.length === 1
    ? chunks[0]
    : chunks.reduce((a, b) => {
        const out = new Uint8Array(a.length + b.length);
        out.set(a, 0);
        out.set(b, a.length);
        return out;
      }, new Uint8Array());
}

function monthKey(d = new Date()) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature") || "";
  const body = await rawBody(req);

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    return new Response(`Webhook signature verification failed: ${err.message}`, {
      status: 400,
    });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = session.customer as string;
        const plan = (session.metadata?.plan as string) || "pro";
        await stripe.customers.update(customerId, {
          metadata: { plan, month: monthKey(), used: "0" },
        });
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        // On each renewal period, reset usage
        await stripe.customers.update(customerId, {
          metadata: { month: monthKey(), used: "0" },
        });
        break;
      }

      default:
        // noop
        break;
    }

    return new Response("ok");
  } catch (err: any) {
    return new Response(`Webhook error: ${err.message}`, { status: 500 });
  }
}

