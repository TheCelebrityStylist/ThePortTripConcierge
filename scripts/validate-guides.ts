import { blogArticles } from "../app/data/blog-cms";
import { assertMinWordCount, detectDuplicateParagraphsAcrossPorts, detectDuplicateParagraphsWithinArticle, articleWordCount } from "../app/lib/content/contentQuality";

const published = blogArticles;
if (published.length < 6) {
  throw new Error(`Need at least 6 published articles; found ${published.length}.`);
}

for (const article of published) {
  assertMinWordCount(article, 3000);
  detectDuplicateParagraphsWithinArticle(article);
  if (article.faq.length < 8 || article.faq.length > 12) {
    throw new Error(`${article.slug} has ${article.faq.length} FAQs; expected 8-12.`);
  }

  const plannerLinks = article.internalLinks.filter((l) => l.href.includes("/planner") || l.href === "/plan");
  const portLinks = article.internalLinks.filter((l) => l.href.startsWith("/blog/"));
  if (plannerLinks.length < 1) throw new Error(`${article.slug} must include at least one planner link.`);
  if (portLinks.length < 3) throw new Error(`${article.slug} must include at least three contextual internal port links.`);

  const hasCallout = article.contentBlocks.every((b) => !!b.callout?.text);
  const hasLocalTip = article.contentBlocks.every((b) => !!b.localTip);
  if (!hasCallout) throw new Error(`${article.slug} is missing a running-late callout in one or more sections.`);
  if (!hasLocalTip) throw new Error(`${article.slug} is missing a local tip in one or more sections.`);

  console.log(`${article.slug}: ${articleWordCount(article)} words`);
}

detectDuplicateParagraphsAcrossPorts(published);
console.log(`validate:guides passed for ${published.length} articles.`);
