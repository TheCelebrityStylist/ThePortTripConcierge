import OpenAI from "openai";

export async function POST(req) {
  try {
    const { question, port } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: "Missing OpenAI API Key" }), { status: 500 });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are PortTrip Concierge, an AI assistant helping cruise travelers with detailed, practical, and accurate tips for exploring ports. Always answer with structured, actionable advice."
        },
        {
          role: "user",
          content: `Port: ${port}\n\nQuestion: ${question}`
        }
      ]
    });

    const answer = completion.choices[0].message.content;

    return new Response(JSON.stringify({ answer }), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

