import { blogArticles } from "@/app/data/blog-cms";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://porttrip.com";
  const items = blogArticles
    .slice(0, 80)
    .map(
      (article) => `
        <item>
          <title>${escapeXml(article.title)}</title>
          <link>${base}/blog/${article.slug}</link>
          <guid>${base}/blog/${article.slug}</guid>
          <pubDate>${new Date(article.publishedDate).toUTCString()}</pubDate>
          <description>${escapeXml(article.metaDescription)}</description>
        </item>`
    )
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
    <rss version="2.0">
      <channel>
        <title>PortTrip Cruise Intelligence Library</title>
        <link>${base}/blog</link>
        <description>Cruise port planning intelligence with return-safe route systems.</description>
        ${items}
      </channel>
    </rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate",
    },
  });
}
