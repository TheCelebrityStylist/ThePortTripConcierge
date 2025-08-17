// app/api/chat/route.js
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // set this in Vercel → Project Settings → Environment Variables
});

export async function POST(req) {
  try {
    const { messages } = await req.json();

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini", // or "gpt-4o" if you want the full version
      messages: messages || [{ role: "user", content: "Hello, who are you?" }],
    });

    return new Response(
      JSON.stringify({ reply: completion.choices[0].message }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
