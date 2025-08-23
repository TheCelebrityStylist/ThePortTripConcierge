// app/api/me/route.ts
export const runtime = "edge";

const STRIPE_BASE = "https://api.stripe.com/v1";

function monthKey(d = new Date()) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function getCookie(req: Request, name: string) {
  const cookie = req.headers.get("cookie") || "";
  const m = cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return m ? decodeURIComponent(m[1]) : "";
}

async function stripeGET(path: string) {
  const res = await fetch(`${STRIPE_BASE}${path}`, {
    headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Stripe GET ${path} failed: ${res.status}`);
  return res.json();
}

export async function GET(req: Request) {
  try {
    const cur = monthKey();
    const cid = getCookie(req, "pt_customer");

    // Anonymous: read soft-gate cookie pt_free_used="YYYY-MM:count"
    if (!cid || !process.env.STRIPE_SECRET_KEY) {
      const v = getCookie(req, "pt_free_used");
      let used = 0;
      if (v) {
        const [m, n] = v.split(":");
        if (m === cur) used = parseInt(n || "0", 10) || 0;
      }
      return new Response(
        JSON.stringify({
          plan: "free",
          limit: 3,
          used,
          month: cur,
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // Stripe customer
    const c = await stripeGET(`/customers/${cid}`);
    const md = c.metadata || {};
    const plan = (md.plan || "pro").toLowerCase(); // "pro" | "unlimited"
    const month = md.month || cur;
    let used = parseInt(md.used || "0", 10) || 0;
    const limit = plan === "unlimited" ? Infinity : 25;

    // if metadata month isn’t current, treat as reset (UI-only)
    if (month !== cur) used = 0;

    return new Response(
      JSON.stringify({
        plan,
        limit,
        used,
        month: cur,
        customerId: cid,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

