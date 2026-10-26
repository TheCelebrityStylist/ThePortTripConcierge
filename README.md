# porttrip-web

The public site for porttrip.com: port guides, articles, the Cruise Port Index and port rules.
Static Astro build, deployed on Vercel. The planner, live mode, accounts and checkout live in the
Base44 app (`PUBLIC_APP_URL`, default https://porttrip.base44.app, later https://porttripapp.com).

- `src/data/guides/*.json` — checked port guides (source of truth, exported from the app)
- `src/data/blog/*.js` — articles (markdown with front matter)
- `src/data/published.json` — the URLs that are live and in the sitemap
- `scripts-gen-vercel.mjs` — writes `vercel.json` (legacy redirects, app routes)

Build: `npm install && node scripts-gen-vercel.mjs && npm run build`.
