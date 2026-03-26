import OpenAI from "openai";
import { generateSmartPlan } from "../generatePlan";
import type { PlanInput, PlanOutput } from "../types";
import { loadLocalPortContext } from "../data/loadLocalPortContext";

export async function generateHighQualityDayPlan(input: PlanInput): Promise<PlanOutput> {
  const base = generateSmartPlan(input);
  const local = loadLocalPortContext(input.portSlug);
  const key = process.env.OPENAI_API_KEY;
  if (!key) return base;

  try {
    const client = new OpenAI({ apiKey: key });
    const resp = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [{ role: "user", content: `Rewrite this cruise-day narrative using specifics only. Port: ${local.portName}. Stops: ${base.plan.blocks.map((b) => `${b.title} (${b.startTime})`).join(", ")}. Constraints: ${local.constraints.join("; ")}.` }],
    });
    const text = resp.choices[0]?.message?.content?.trim();
    if (!text) return base;
    return { ...base, narrative: text };
  } catch {
    return base;
  }
}
