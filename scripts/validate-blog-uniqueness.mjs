import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";

const file = path.join(process.cwd(), "app/data/blog-cms.ts");
const src = readFileSync(file, "utf8");
const match = src.match(/export const blogArticles: BlogArticle\[] = ([\s\S]*?);\n\nexport const blogArticleMap/);
if (!match) {
  console.error("[blog-uniqueness] Could not parse blogArticles export.");
  process.exit(1);
}

let articles;
try {
  articles = JSON.parse(match[1].replace(/\bundefined\b/g, "null"));
} catch (err) {
  console.error("[blog-uniqueness] Failed to parse blogArticles JSON block.");
  console.error(err);
  process.exit(1);
}

const normalize = (text) => text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();

const articleText = (article) => {
  const blockText = article.contentBlocks.flatMap((b) => [
    ...(b.lede || []),
    ...(b.body || []),
    ...(b.bullets || []),
    b.callout?.text || "",
    b.localTip || "",
  ]).join(" ");
  const faqText = (article.faq || []).map((f) => `${f.q} ${f.a}`).join(" ");
  return normalize(`${article.title} ${article.subtitle} ${blockText} ${faqText}`);
};

const hashes = new Map();
const sentencesBySlug = new Map();
for (const article of articles) {
  const text = articleText(article);
  const hash = createHash("sha256").update(text).digest("hex");
  if (hashes.has(hash)) {
    console.error(`[blog-uniqueness] Duplicate normalized body hash: ${hashes.get(hash)} and ${article.slug}`);
    process.exit(1);
  }
  hashes.set(hash, article.slug);
  const sentences = new Set(text.split(/\.(?:\s|$)/).map((s) => s.trim()).filter((s) => s.length > 40));
  sentencesBySlug.set(article.slug, sentences);

  const paragraphCount = article.contentBlocks.reduce((n, b) => n + (b.lede?.length || 0) + (b.body?.length || 0) + (b.localTip ? 1 : 0) + (b.callout?.text ? 1 : 0), 0);
  const bulletCount = article.contentBlocks.reduce((n, b) => n + (b.bullets?.length || 0), 0);
  const totalLines = paragraphCount + bulletCount;
  const bulletRatio = totalLines ? bulletCount / totalLines : 0;

  if (paragraphCount < 18) {
    console.error(`[blog-uniqueness] Post too thin (needs >=18 paragraphs): ${article.slug} has ${paragraphCount}`);
    process.exit(1);
  }
  if (bulletRatio > 0.35) {
    console.error(`[blog-uniqueness] Post too bullet-heavy (>35%): ${article.slug} has ${(bulletRatio * 100).toFixed(1)}% bullets`);
    process.exit(1);
  }
}

const threshold = 0.33;
const slugs = articles.map((a) => a.slug);
for (let i = 0; i < slugs.length; i++) {
  for (let j = i + 1; j < slugs.length; j++) {
    const a = sentencesBySlug.get(slugs[i]);
    const b = sentencesBySlug.get(slugs[j]);
    const smaller = a.size < b.size ? a : b;
    let overlap = 0;
    for (const sentence of smaller) if (a.has(sentence) && b.has(sentence)) overlap += 1;
    const ratio = smaller.size ? overlap / smaller.size : 0;
    if (ratio > threshold) {
      console.error(`[blog-uniqueness] High sentence overlap: ${slugs[i]} vs ${slugs[j]} (${(ratio * 100).toFixed(1)}%)`);
      process.exit(1);
    }
  }
}

console.log(`[blog-uniqueness] OK: ${articles.length} articles validated (uniqueness + prose quality guardrails).`);
