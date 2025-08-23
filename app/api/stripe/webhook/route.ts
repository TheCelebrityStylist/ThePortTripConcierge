// app/api/stripe/webhook/route.ts
import Stripe from "stripe";

export const runtime = "nodejs"; // <— Node runtime so Buffer is available

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

function monthKey(d = new Date()) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature") || "";
  // Get a Node Buffer
  const buf = Buffer.from(await req.arrayBuffer());

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return new Response(`Webhook signature verification failed: ${err.message}`, { status: 400 });
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
        await stripe.customers.update(customerId, {
          metadata: { month: monthKey(), used: "0" },
        });
        break;
      }
      default:
        // ignore others
        break;
    }
    return new Response("ok");
  } catch (err: any) {
    return new Response(`Webhook error: ${err.message}`, { status: 500 });
  }
}


