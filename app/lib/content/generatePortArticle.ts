import type { BlogArticle, BlogBlockKind, BlogContentBlock } from "../../data/blog-types";
import type { PortProfile } from "../../data/ports/ports";

const blockMeta: { kind: BlogBlockKind; title: string; opener: string }[] = [
  { kind: "KeyPoints", title: "Terminal Intelligence", opener: "The first thirty minutes in" },
  { kind: "TimeModel", title: "Realistic Time Model", opener: "What surprises visitors in" },
  { kind: "RoutePlans", title: "Route Strategy Models", opener: "There is no single perfect route in" },
  { kind: "BudgetModel", title: "Budget Breakdown", opener: "A DIY day in" },
  { kind: "FailureScenarios", title: "Failure Scenarios", opener: "When cruise days unravel in" },
  { kind: "CrowdAvoidance", title: "Crowd Avoidance", opener: "Crowd control in" },
  { kind: "PortSpecificScams", title: "Scam Awareness", opener: "Most scams in" },
  { kind: "Accessibility", title: "Accessibility Notes", opener: "Accessibility in" },
  { kind: "QuickDecision", title: "Quick Decision (3–4 Hours)", opener: "If your stop in" },
  { kind: "CTA", title: "Plan this Port with PortTrip", opener: "Planning tools matter most in" },
];

function paragraph(port: PortProfile, sectionTitle: string, index: number): string {
  const reality = port.terminalReality[index % port.terminalReality.length];
  const anchorA = port.cityAnchors[index % port.cityAnchors.length];
  const anchorB = port.cityAnchors[(index + 2) % port.cityAnchors.length];
  const friction = port.timingFriction[index % port.timingFriction.length];
  const safeRule = port.returnSafeRules[index % port.returnSafeRules.length];
  const scenario = port.failureScenarios[index % port.failureScenarios.length];

  return `${sectionTitle} in ${port.cityName} works best when you plan it like a story with checkpoints, not a checklist with wishful timing. ${reality} A smart morning usually starts at ${anchorA}, then flows toward ${anchorB} only if your first transition is clean. Travelers who ignore ${friction} often feel rushed by lunch, then overcorrect with expensive last-minute transport. Keep this one line in your head all day: ${safeRule} If that still sounds abstract, use this concrete trigger from real port days: ${scenario}`;
}

function buildBlock(port: PortProfile, kind: BlogBlockKind, title: string, opener: string): BlogContentBlock {
  const paragraphs = Array.from({ length: 6 }, (_, idx) => paragraph(port, title, idx));
  return {
    kind,
    title,
    lede: [
      `${opener} ${port.cityName} is the terminal rhythm, not the postcard view. ${port.terminalReality[0]} This guide keeps the same section structure, but each section reads like a practical cruise-day narrative you can actually follow from gangway to all-aboard.`,
      `In the ${title} section for ${port.cityName}, think of this as a travel journal with built-in cut rules. You will see where time drains, where crowds form, and how to preserve one calm return corridor so you can enjoy the city without gambling on the ship clock.`,
    ],
    body: paragraphs,
    bullets: [
      `Primary anchor pair: ${port.cityAnchors[0]} and ${port.cityAnchors[1]}.`,
      `Known friction to monitor: ${port.timingFriction[0]}.`,
      `Most conservative return cue: ${port.returnSafeRules[0]}`,
      `Recovery idea if the day slips: ${port.quickPlanOptions[0]}`,
    ],
    callout: {
      title: "If you’re running late",
      text: `In ${port.cityName}, trigger a hard cut the moment this condition appears: ${port.failureScenarios[1]}. Then apply this rule immediately: ${port.returnSafeRules[1]}`,
    },
    localTip: `Local tip for ${port.cityName}: build your last unskippable stop around ${port.cityAnchors[2]} so your return is still practical when ${port.timingFriction[1]} appears.`,
  };
}

function faqForPort(port: PortProfile) {
  return Array.from({ length: 10 }, (_, i) => ({
    q: `How should I handle ${port.cityName} scenario #${i + 1} without overreacting?`,
    a: `Use a calm sequence: verify your current anchor (${port.cityAnchors[i % port.cityAnchors.length]}), compare it with your buffer, and then apply the matching return rule (${port.returnSafeRules[i % port.returnSafeRules.length]}). The key is acting early instead of compensating late.`,
  }));
}

export function generatePortArticle(port: PortProfile): BlogArticle {
  const contentBlocks = blockMeta.map((m) => buildBlock(port, m.kind, m.title, m.opener));
  const today = new Date().toISOString().slice(0, 10);

  return {
    slug: port.slug,
    title: `${port.cityName} Cruise Port Guide: Real DIY Day Plan with Return-Safe Rules`,
    subtitle: `${port.portType === "tender" ? "Tender" : "Dock"} day playbook • ${port.typicalTimeInPortRange} • ${port.difficulty} difficulty`,
    metaTitle: `${port.cityName} Cruise Port Guide | Cruise Intelligence Library`,
    metaDescription: `Long-form ${port.cityName} cruise guide with terminal realities, route models, crowd strategy, scam awareness, accessibility notes, and planner-ready cut rules.`,
    keywords: [`${port.slug} cruise port guide`, `${port.cityName.toLowerCase()} diy port day`, `${port.cityName.toLowerCase()} return to ship tips`, `${port.cityName.toLowerCase()} cruise planner`],
    category: "Port Guide",
    region: port.region,
    portsMentioned: [port.cityName],
    difficulty: port.difficulty,
    tenderOrDock: port.portType === "tender" ? "Tender" : "Dock",
    timeInPortModel: port.typicalTimeInPortRange,
    dataConfidence: "estimated",
    excerpt: `A practical long-form ${port.cityName} day plan built around real bottlenecks, flexible route models, and safer return discipline.`,
    contentBlocks,
    faq: faqForPort(port),
    internalLinks: port.internalLinks.slice(0, 8).map((href, i) => ({
      title: href.startsWith("/blog/") ? `Compare with ${href.replace("/blog/", "").replace(/-/g, " ")}` : "Cruise Day Planner",
      href,
      anchorText: href === "/planner" ? "Build this plan in Cruise Day Planner" : `Compare this approach to ${href.replace("/blog/", "").replace(/-/g, " ")}`,
    })),
    plannerCta: { label: "Plan My Port Day", href: "/planner", prefillPort: port.slug },
    publishedDate: today,
    updatedDate: today,
  };
}
