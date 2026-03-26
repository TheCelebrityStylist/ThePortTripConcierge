import { generateSmartPlan } from "../generatePlan";
import { generateHighQualityDayPlan } from "./generateHighQualityDayPlan";
import type { PlanInput, PlanOutput } from "../types";

export async function generatePremiumDayPlan(input: PlanInput): Promise<PlanOutput> {
  const baseline = generateSmartPlan(input);
  const enriched = await generateHighQualityDayPlan(input);
  return {
    ...enriched,
    recommendations: baseline.recommendations,
  };
}
