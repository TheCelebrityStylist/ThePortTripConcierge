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

const jsonText = match[1]
  .replace(/\bundefined\b/g, "null");

let articles;
try {
  articles = JSON.parse(jsonText);
} catch (err) {
  console.error("[blog-uniqueness] Failed to parse blogArticles JSON block.");
  console.error(err);
  process.exit(1);
}

const normalize = (text) => text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
const textOf = (article) => {
  const blockText = article.contentBlocks
    .flatMap((b) => [b.lead, ...(b.bullets || []), ...(b.steps || []), b.decisionRule || ""])
    .join(" ");
  const faqText = (article.faq || []).map((f) => `${f.q} ${f.a}`).join(" ");
  return normalize(`${article.title} ${article.subtitle} ${blockText} ${faqText}`);
};

const hashes = new Map();
const sentencesBySlug = new Map();
for (const article of articles) {
  const text = textOf(article);
  const hash = createHash("sha256").update(text).digest("hex");
  if (hashes.has(hash)) {
    console.error(`[blog-uniqueness] Duplicate normalized body hash: ${hashes.get(hash)} and ${article.slug}`);
    process.exit(1);
  }
  hashes.set(hash, article.slug);

  const sentences = new Set(text.split(/\s{2,}|\.(?:\s|$)/).map((s) => s.trim()).filter((s) => s.length > 30));
  sentencesBySlug.set(article.slug, sentences);
}

const threshold = 0.35;
const slugs = articles.map((a) => a.slug);
const issues = [];
for (let i = 0; i < slugs.length; i++) {
  for (let j = i + 1; j < slugs.length; j++) {
    const a = sentencesBySlug.get(slugs[i]);
    const b = sentencesBySlug.get(slugs[j]);
    const smaller = a.size < b.size ? a : b;
    let overlap = 0;
    for (const sentence of smaller) {
      if (a.has(sentence) && b.has(sentence)) overlap += 1;
    }
    const ratio = smaller.size ? overlap / smaller.size : 0;
    if (ratio > threshold) issues.push({ a: slugs[i], b: slugs[j], ratio });
  }
}

if (issues.length) {
  console.error("[blog-uniqueness] High sentence overlap detected:");
  issues.slice(0, 20).forEach((i) => console.error(` - ${i.a} vs ${i.b}: ${(i.ratio * 100).toFixed(1)}%`));
  process.exit(1);
}

console.log(`[blog-uniqueness] OK: ${articles.length} articles validated with uniqueness guardrail.`);
