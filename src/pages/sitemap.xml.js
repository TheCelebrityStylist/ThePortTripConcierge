import PUB from '../data/published.json';
import { SLUGS } from '../lib/ports.js';
export function GET() {
  const seen = new Set(); const rows = [];
  const add = (p, lm) => { if (seen.has(p)) return; seen.add(p); rows.push(`<url><loc>https://porttrip.com${p}</loc>${lm ? `<lastmod>${lm}</lastmod>` : ''}</url>`); };
  for (const u of PUB.urls) add(u.path, (u.lastmod || '') > '2026-10-26' ? u.lastmod : '2026-10-26');
  for (const s of SLUGS) add(`/ports/${s}`, '2026-10-26');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows.join('\n')}\n</urlset>\n`, { headers: { 'Content-Type': 'application/xml' } });
}
