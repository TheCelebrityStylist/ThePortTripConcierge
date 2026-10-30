# PortTrip growth backlog

One improvement ships per day. The daily run picks the item with the best expected effect on revenue
(visitors x conversion x price) that can be finished, verified and shipped in one run.
Add new ideas at the bottom of the right section with a one-line reason. Move shipped items to ops/GROWTH-LOG.md.

Revenue maths to keep in mind: €1M a year is about 67,000 Cruise Passes (€14.99) or 25,600 Year Passes (€39).
Today the site gets about 50 Google impressions a week. Traffic is the bottleneck, then conversion, then product.

## 1. Fix first (things that are broken or leaking)
- [x] 29 Oct 2026: daily port wave now reaches porttrip.com. The app writes public/site-sync/bundle.json (scripts/site/exportForSite.mjs); the GitHub Action "Sync from app" imports new ports and posts every 2 hours, builds, pushes, pings IndexNow. Day-builder stops built per run from ops/daystops. Queue refilled with 49 ports (it was empty, which is why runs took a minute).
- [ ] Vercel Web Analytics returns "not found": confirm with Elke that it is enabled (Project > Analytics > Enable); until then use Search Console and app conversion events.
- [ ] 18 places Google Maps lists as permanently closed are still in the guides (e.g. Agadir Memorial Museum, Guy Harvey's Grand Cayman, Olympen Oslo, Le Bocche Portovenere, Museo del Parco Portofino). Check each against an official or dated source; fix guides in both copies (website src/data/guides + app src/lib/seo/verifiedGuides), then the day-builder stops.
- [ ] Google terms: stored coordinates in app src/lib/dayStops/*.json must be refreshed at least every 30 days (last refresh 29 Oct 2026). Re-run the geocode (Places Text Search via the gscExportTemp maps_call action) before 28 Nov 2026.

## 2. Traffic (search and links)
- [ ] For every Search Console query with impressions at position 8–40, make sure one page answers it directly (title, H1, quick answer). Start with: "civitavecchia port to train station", "barcelona cruise port to city centre", "bus from dubrovnik cruise port to old town", "barcelona cruise port to sagrada familia", "athens cruise port to acropolis".
- [ ] Internal links: every port page links to its 2–4 blog posts and back; every blog post links to the port page and the day builder.
- [ ] New posts only where a real query exists (Search Console) and the guide has checked facts to support it. Same editorial rules as the existing v3 posts (sources, no AI tone, British English).
- [ ] Outreach drafts (do not send): 10 short emails a week to cruise forums, cruise bloggers, port tourist boards, pointing at a post with something new and sourced. Save to ops/outreach/ for Elke.
- [ ] Structured data check (Article, FAQ, Breadcrumb) on all templates with the Rich Results rules; fix errors.

- [ ] (SEO 30 Oct) 17 static pages have no JSON-LD (/blog, /ports, /about, /methodology, the five ship-return pages, etc.). Add Organization/WebPage/BreadcrumbList via Base.astro where missing.
- [ ] (SEO 30 Oct) /about "Crawled - currently not indexed" and /legal/terms "Soft 404" — both from July crawls of the old Base44 site; recheck after recrawl.
- [ ] (SEO 30 Oct) App page porttripapp.com links to porttrip.com/partners/join (redirect added). App task should link to porttripapp.com/partners/join directly.
- [ ] (SEO 30 Oct) Query "how many people go missing on cruise ships" (pos 25) lands on the missed-the-ship post; different intent, left alone.
- [ ] (SEO 30 Oct) /ports/phuket redirects to /ports. If a Phuket guide is added, delete that redirect first (redirects override pages).

## 3. Conversion
- [ ] Port pages: add "Build my own day" (app /day/<slug>?b=1) next to "Plan my day free"; the builder is the strongest demo of the product.
- [ ] Email capture that people want: "Send me my port times" (leave-by times for each port of their cruise, by email) -> nurture -> Cruise Pass. Resend is already set up in the app.
- [ ] Day builder: when a plan is built, offer "Do this for every port of your cruise" with the Cruise Pass, showing the ports count.
- [ ] Measure placements: compare Buy click counts by placement (utm_campaign in the app's ConversionEvent records) once a week; drop placements that never convert.

## 4. Product (makes the Cruise Pass worth paying for)
- [ ] Whole-cruise planner: enter the ports and dates once; every port day is built with the same preferences, tiring days are balanced across the week, budget across the cruise, one assistant conversation for the whole trip. Cruise Pass unlocks it.
- [ ] Crowd-aware timing: the cruiseRadar source (cruisedig.com) now returns 403. Find a lawful replacement source for ships in port per date.
- [ ] Day builder: shorten a long stop automatically when it is the only thing that fits (e.g. Progreso on a short call).
- [ ] Head-back rows for fixed-departure transport (e.g. Katakolon "single early-afternoon train") are shown as minutes-before-all-aboard. With a non-standard all-aboard the real train may leave earlier or later. Store the actual departure time on those rows and show "take the 13:xx train" instead. Affects day builder and advisor plans.
- [ ] Cruise Radar consumer pages use CruiseDig, which blocks us and is personal/non-commercial use only. Switch off or replace with a licensed source (waiting on Elke).
