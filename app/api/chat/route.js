// app/api/chat/route.js
export async function POST(req) {
  return new Response(JSON.stringify({ ok: true, message: "chat route alive" }), {
    headers: { "Content-Type": "application/json" }
  });
}

