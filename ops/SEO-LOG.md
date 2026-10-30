# SEO log

One entry per daily SEO run (newest at the bottom). Format:
`- YYYY-MM-DD | GSC 28d: clicks X (prev Y), impressions X (prev Y) | indexed sample: n/m | fixed: ... | blog: slug or none | next: ...`

Baseline before the daily runs (29 Oct 2026):
- 90 days: 28 clicks, 757 impressions, almost all on the homepage via the brand query.
- Port pages average position 60–85 (Santorini 131 impressions at 83.5, 0 clicks).
- Site moved from Base44 to Vercel/Astro on 26 Oct 2026; old URLs redirected (vercel.json); seven 404s with impressions redirected on 29 Oct.
- Known issues to check first: Kotor blog post still served the August noindex at last inspection; Barcelona "Discovered, not indexed"; sitemap report showed 0 indexed although sampled pages were indexed.
- Backlinks: Fiverr network (78 domains) — disavow file prepared, upload pending (Elke).

Rotation pointer (sitemap order, dist/sitemap.xml): next start at index 10 (/corrections done; next /will-i-make-it-back).

- 2026-10-30 | GSC 28d: clicks 7 (prev 5), impressions 149 (prev 145), avg pos 50.9 (prev 51.6) — flat | indexed sample: 15/19 (kotor-cruise-port-guide redirects to -diy, not counted; /about crawled-not-indexed Jul; /legal/terms soft 404 from Jul crawl; /editorial-policy, /corrections unknown) | 404s: 5 hits, 5 redirects added (/ports/athens-piraeus→athens, cinque-terre→la-spezia, trogir→split, phuket→/ports (no guide; remove if a Phuket guide ships), /partners/join→app; ref porttripapp.com, no spam hosts) | fixed: duplicate post /blog/best-mediterranean-cruise-ports-diy 301 to /blog/best-mediterranean-cruise-ports (same content on two URLs; removed from sitemap), 5 broken + 15 redirected internal links in snapshot pages, 5 old blog paths redirected, footer links straight to app for /travel-advisors, 3 orphan pages linked from footer | blog: cruise-port-days-limited-mobility | next: inspect /blog/kotor-cruise-port-guide-diy + new post, rotation from index 10, JSON-LD for static pages
