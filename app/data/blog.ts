import { blogSeedPrompts, type BlogPost } from "./cruise-intelligence";

const filler =
  "PortTrip Cruise Intelligence combines terminal friction data, transport options, tender risk, real walking times, and return-buffer logic to produce safer and cheaper itineraries than generic travel advice. Use this section to compare time budget against queue exposure, then lock a must-return-by threshold before booking activities.";

function buildPost(title: string, i: number): BlogPost {
  const categories = [
    "Cruise Port Guides",
    "Cruise Money Saving",
    "First Time Cruise Tips",
    "Cruise Safety",
    "DIY vs Ship Excursions",
    "Cruise Packing",
    "Cruise Food Guides",
  ] as const;

  return {
    slug: title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
    title,
    category: categories[i % categories.length],
    description: `Actionable playbook: ${title}.`,
    heroKeywords: ["cruise port planning", "shore excursion alternatives", "return-to-ship buffer"],
    sections: [
      { heading: "Why cruise-specific intelligence beats generic tips", body: `${filler} ${filler}` },
      { heading: "Port-day timeline design", body: `${filler} ${filler}` },
      { heading: "Budget and transport decisions", body: `${filler} ${filler}` },
      { heading: "Safety buffer and miss-the-ship prevention", body: `${filler} ${filler}` },
      { heading: "Pro traveler checklist", body: `${filler} ${filler}` },
    ],
  };
}

export const blogPosts: BlogPost[] = blogSeedPrompts.map((title, i) => buildPost(title, i));
