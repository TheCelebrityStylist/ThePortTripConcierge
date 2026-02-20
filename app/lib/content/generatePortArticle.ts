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
  const style = [
    `If you treat ${sectionTitle.toLowerCase()} in ${port.cityName} like a fixed script, you will feel behind by lunch.`,
    `A stronger approach in ${port.cityName} is to run ${sectionTitle.toLowerCase()} as a decision tree.`,
    `Cruisers who do well in ${port.cityName} keep ${sectionTitle.toLowerCase()} flexible until midday.`
  ][index % 3];

  return `${style} ${reality} Start around ${anchorA}, then move toward ${anchorB} only after checking your clock and transfer reliability. The hidden drain is usually ${friction}, which is why locals and repeat cruisers follow one strict rule: ${safeRule} If the day begins to slide, use this real-world trigger immediately: ${scenario}`;
}

function signatureBlock(port: PortProfile): BlogContentBlock {
  const title = port.portType === "tender"
    ? "Tender Strategy & First-Boat Advantage"
    : port.difficulty === "Complex"
      ? "The Transfer Corridor (and how to not lose 90 minutes)"
      : "The 2-Zone Loop";

  return {
    kind: "RoutePlans",
    title,
    lede: [
      `Who this is for: cruisers who want a realistic independent day in ${port.cityName} without all-aboard stress.`,
      `What you can realistically do in ${port.typicalTimeInPortRange} at ${port.cityName}: one primary zone done well, one optional secondary zone, and a protected return corridor.`
    ],
    body: [
      `${port.cityName} rewards travelers who choose shape over volume. Pick a first zone anchored around ${port.cityAnchors[0]}, then commit to a second zone only if your midday checkpoint is still healthy.`,
      `In ${port.cityName}, the fastest way to lose control is to zig-zag between anchors with weak transfer certainty. Keep the spine simple, then layer optional experiences only when buffer remains intact.`,
      `A signature move for this port is using ${port.cityAnchors[1]} as a pivot: if queues grow, stay local; if flow is smooth, extend once and then turn back early.`,
    ],
    bullets: [
      `Primary zone anchor: ${port.cityAnchors[0]}`,
      `Secondary zone only if on-time: ${port.cityAnchors[1]}`,
      `Hard return cue: ${port.returnSafeRules[0]}`,
    ],
    callout: { title: "If you’re running late", text: `Skip your secondary zone and execute ${port.quickPlanOptions[0]} only.` },
    localTip: `Local tip: use ${port.cityAnchors[2]} as your final meaningful stop before shifting into return mode.`,
  };
}

function buildBlock(port: PortProfile, kind: BlogBlockKind, title: string, opener: string): BlogContentBlock {
  const paragraphs = Array.from({ length: 5 }, (_, idx) => paragraph(port, title, idx));
  return {
    kind,
    title,
    lede: [
      `${opener} ${port.cityName} is the terminal rhythm, not the postcard view. ${port.terminalReality[0]}`,
      `In ${port.cityName}, this section explains how to move through ${title.toLowerCase()} with narrative checkpoints around ${port.cityAnchors[0]} and ${port.cityAnchors[1]}.`
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
      text: `In ${port.cityName}, trigger a hard cut when this appears: ${port.failureScenarios[1]}. Then apply: ${port.returnSafeRules[1]}`,
    },
    localTip: `Local tip for ${port.cityName}: build your last unskippable stop around ${port.cityAnchors[2]} so return stays practical when ${port.timingFriction[1]} appears.`,
  };
}

function faqForPort(port: PortProfile) {
  return Array.from({ length: 8 }, (_, i) => ({
    q: `What should I do first in ${port.cityName} if my disembarkation is delayed?`,
    a: `Prioritize your most time-sensitive anchor (${port.cityAnchors[i % port.cityAnchors.length]}) and immediately drop one optional segment. Follow this rule: ${port.returnSafeRules[i % port.returnSafeRules.length]}`,
  }));
}

export function generatePortArticle(port: PortProfile): BlogArticle {
  const generated = blockMeta.map((m) => buildBlock(port, m.kind, m.title, m.opener));
  const contentBlocks = [generated[0], signatureBlock(port), ...generated.slice(1)];
  const today = new Date().toISOString().slice(0, 10);

  return {
    slug: port.slug,
    title: `${port.cityName} Cruise Port Guide: DIY Day Plan with Return-Safe Rules`,
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
    excerpt: `A practical ${port.cityName} port-day narrative with clear cut rules, realistic loops, and return-safe timing decisions.`,
    contentBlocks,
    faq: faqForPort(port),
    internalLinks: port.internalLinks.slice(0, 8).map((href) => ({
      title: href.startsWith("/blog/") ? `Compare with ${href.replace("/blog/", "").replace(/-/g, " ")}` : "Cruise Day Planner",
      href,
      anchorText: href === "/planner" ? "Build this plan in Cruise Day Planner" : `Compare this approach to ${href.replace("/blog/", "").replace(/-/g, " ")}`,
    })),
    plannerCta: { label: "Plan My Port Day", href: "/planner", prefillPort: port.slug },
    publishedDate: today,
    updatedDate: today,
  };
}
