import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const mode = body?.mode || "port-page";
  const topic = body?.topic || "barcelona";

  const suggestions = {
    "port-page": {
      title: `${topic} Cruise Port Guide (2026)`,
      sections: ["Arrival logistics", "Route optimizer", "Budget comparison", "Local food", "Safety timer"],
      internalLinks: ["/chat", "/ports", "/blog"],
      affiliateIdeas: ["travel eSIM", "shore transfer service", "luggage storage"],
    },
    blog: {
      title: `How to plan ${topic} port day without overpriced tours`,
      sections: ["Mistakes", "Savings", "Safety", "CTA"],
      internalLinks: ["/port/barcelona-cruise-port-guide", "/chat"],
      affiliateIdeas: ["skip-the-line passes", "local foodie tours"],
    },
    faq: {
      title: `${topic} cruise FAQs`,
      sections: ["Walkability", "Tender waits", "Sunday closures", "Return buffer"],
      internalLinks: ["/cruise-questions"],
      affiliateIdeas: ["insurance", "transport passes"],
    },
  } as const;

  const response = suggestions[mode as keyof typeof suggestions] || suggestions["port-page"];
  return NextResponse.json(response);
}
