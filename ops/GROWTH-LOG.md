# PortTrip growth log

One line per shipped improvement: date, what shipped, why it should move revenue, how it was verified, the metric to watch.

- 2026-10-27/28: 99 blog posts rewritten (v3: sources, local knowledge, Viator links); guides corrected in both copies. Watch: impressions and clicks per post in Search Console.
- 2026-10-28: direct-to-checkout CTAs, offer box with sourced proof, sticky buy bar, Vercel Analytics and custom events. Watch: Buy clicks by placement.
- 2026-10-29: day builder with Google Maps, AI assistant, Make-It-Back simulation, tours, re-plan from here. Watch: day_agent_message and day_builder_* events in the app.
- 2026-10-30: the public sample advisor plan (/r/<sample>, linked twice from /travel-advisors) was a dead end with no way to start. It now has "Make one for your clients" at the top, a trial box at the end and a sticky trial bar on mobile, all to /advisors/start?plan=solo&src=sample_plan. Client plans are unchanged (the backend flags only the sample team). Why: the sample is the proof step for the highest-priced product (Solo €29/month, Agency €199/month); an advisor convinced by it had to go Back to find the button. Verified live in Playwright at 430 px: CTAs shown on the sample, absent on a client plan, click reaches /advisors/start, no page errors; /pricing?buy=cruise_pass still reaches Stripe. Watch: advisor_sample_cta_clicked (by placement) and new AdvisorTeam records.

Baseline (29 Oct 2026, Search Console, last 90 days): 28 clicks, 757 impressions, all clicks on the homepage (brand query "port trip"); about 50 impressions a week.
