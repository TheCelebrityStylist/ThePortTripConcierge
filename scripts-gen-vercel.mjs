// Generates vercel.json: redirects for legacy URLs and app routes.
import fs from 'fs';
const APP = process.env.PUBLIC_APP_URL || 'https://porttripapp.com';
const r = [];
const perm = (source, destination) => r.push({ source, destination, permanent: true });
const temp = (source, destination) => r.push({ source, destination, permanent: false });

// App routes now live on the app domain.
for (const p of ['/planner', '/port-day-live', '/login', '/my-cruises', '/checkout-return', '/cruise-radar', '/travel-advisors', '/advisors', '/cruise-ships-in', '/account', '/settings', '/hq', '/preview'])
  { temp(p, `${APP}${p}`); temp(`${p}/:path*`, `${APP}${p}/:path*`); }
temp('/day/:slug', `${APP}/day/:slug`);
temp('/cruise-dashboard', `${APP}/cruise-dashboard`); temp('/cruise-dashboard/:path*', `${APP}/cruise-dashboard/:path*`);

// Corrected blog duplicates.
const BLOG_DUP = { 'kotor-cruise-port-guide': 'kotor-cruise-port-guide-diy', 'athens-piraeus-cruise-port-guide': 'athens-cruise-port-guide-diy', 'santorini-cruise-port-diy-guide': 'santorini-cruise-port-without-excursion', 'one-day-santorini-cruise-ship': 'santorini-cruise-port-without-excursion', 'how-many-people-miss-cruise-ship': 'how-many-people-miss-cruise-ship-port', 'are-cruise-excursions-worth-it-analysis': 'are-cruise-excursions-worth-it', 'livorno-to-florence-cruise-guide': 'florence-livorno-cruise-port-guide', 'civitavecchia-to-rome-train-cruise-2026': 'how-to-get-from-civitavecchia-to-rome', 'never-miss-cruise-ship-port': 'how-to-return-cruise-ship-on-time', 'one-day-rome-cruise-ship': 'rome-cruise-port-without-excursion' };
for (const [a, b] of Object.entries(BLOG_DUP)) perm(`/blog/${a}`, `/blog/${b}`);

// Legacy pages (from the app's redirect table).
const LEGACY = `/BlogCategory /blog
/BlogPost /blog
/Home /
/CruiseLine /ports
/CruiseLineSEO /ports
/PortComparison /ports
/PortComparisonPage /ports
/PortGuide /ports
/PortLongTailPage /ports
/PortSEOPage /ports
/PortSubSEOPage /ports
/barcelona-cruise-stop-without-excursion /ports/barcelona
/best-mediterranean-cruise-ports /blog/best-mediterranean-cruise-ports
/cruise-excursion-price-tracker /blog/how-much-do-cruise-excursions-cost
/cruise-excursion-pricing /blog/how-much-do-cruise-excursions-cost
/cruise-ports/best-mediterranean /blog/best-mediterranean-cruise-ports
/dubrovnik-cruise-port-first-timers /ports/dubrovnik
/how-many-people-miss-their-cruise-ship /blog/how-many-people-miss-cruise-ship-port
/how-porttrip-scores-ports /methodology
/how-to-do-naples-cruise-port-on-your-own /ports/naples
/is-santorini-worth-cruise-excursion /ports/santorini
/naples-cruise-port-safety /ports/naples
/rome-cruise-port-common-mistakes /ports/rome
/protection /how-to-never-miss-your-cruise-ship
/protection/terms /how-to-never-miss-your-cruise-ship
/avoid-missing-your-cruise-ship /how-to-never-miss-your-cruise-ship
/how-to-get-back-to-cruise-ship-on-time /how-to-return-to-your-cruise-ship-on-time
/are-cruise-excursions-worth-it /blog/are-cruise-excursions-worth-it
/should-i-book-cruise-excursion /blog/are-cruise-excursions-worth-it
/should-you-book-cruise-excursions /blog/are-cruise-excursions-worth-it
/how-much-do-cruise-excursions-cost /blog/how-much-do-cruise-excursions-cost
/how-to-do-rome-without-a-cruise-tour /blog/rome-cruise-port-without-excursion
/how-to-do-santorini-yourself /blog/santorini-cruise-port-without-excursion
/how-to-explore-barcelona-from-cruise-port /ports/barcelona
/porttrip-index /cruise-port-index
/discover /cruise-port-index
/ultimate-cruise-port-guide /cruise-port-index
/features /what-is-porttrip
/about-porttrip-intelligence /about
/report /cruise-port-index
/report/2026 /cruise-port-index`.split('\n').map((l) => l.trim().split(/\s+/));
for (const [a, b] of LEGACY) perm(a, b);

// Old index-style pages all became the Cruise Port Index.
const TO_INDEX = ['/cruise-port-budget-rankings', '/cruise-port-data', '/cruise-port-difficulty', '/cruise-port-independence-index', '/cruise-port-independent-travel-report', '/cruise-port-intelligence-report', '/cruise-port-missed-ship-risk', '/cruise-port-return-risk-index', '/cruise-port-return-time-study', '/cruise-port-risk', '/cruise-port-safety-rankings', '/cruise-port-savings-index', '/cruise-port-statistics', '/cruise-port-stress-rankings', '/cruise-port-tender-data', '/cruise-port-tourist-trap-index', '/cruise-port-transport-reliability-rankings', '/cruise-ports-longest-tender-delays', '/easiest-cruise-ports-to-explore-independently', '/summer-cruise-port-risk', '/live/:path*'];
for (const a of TO_INDEX) perm(a, '/cruise-port-index');

// Pruned thin pages: send to the closest live page.
const PRUNED = ['/affiliates', '/agency', '/avoid-cruise-excursion-overpaying', '/best-cruise-lines-for-independent-port-days', '/best-cruise-ports-elderly-mobility', '/best-cruise-ports-for-diy', '/best-cruise-ports-to-save-money', '/cheapest-cruise-ports', '/cheapest-cruise-ports-to-diy', '/compare', '/cruise-builder', '/cruise-day-plan-generator', '/cruise-excursion-alternative', '/cruise-excursion-overpayment-calculator', '/cruise-excursion-overprice-ranking', '/cruise-excursion-savings-calculator', '/cruise-excursions-marked-up-312-percent', '/cruise-excursions-vs-diy', '/cruise-hub', '/cruise-intelligence', '/cruise-itinerary', '/cruise-itinerary-planner', '/cruise-line-excursion-comparison', '/cruise-money-waste-calculator', '/cruise-overpayment-map', '/cruise-port-cost-calculator', '/cruise-port-excursion-pricing', '/cruise-port-hidden-costs', '/cruise-port-planner', '/cruise-port-price-intelligence', '/cruise-port-scams', '/cruise-port-taxi-vs-excursion', '/cruise-port-transport-finder', '/cruise-port-transport-guide', '/cruise-port-updates', '/cruise-ports', '/cruise-ports-where-tourists-waste-most-money', '/cruise-tools', '/do-i-need-a-cruise-excursion', '/excursion-markup', '/excursion-overprice-checker', '/first-cruise', '/hidden-costs-of-cruise-excursions', '/how-much-am-i-overpaying', '/how-much-do-cruise-lines-mark-up-excursions', '/how-porttrip-calculates-risk', '/how-porttrip-collects-data', '/how-porttrip-predicts-port-conditions', '/how-porttrip-validates-routes', '/independent-cruise-port-guide', '/independent-cruiser-manifesto', '/institute', '/is-it-safe-to-explore-cruise-ports-yourself', '/is-this-cruise-port-walkable', '/labs', '/leave-the-ship-calculator', '/local-cruise-excursions', '/media', '/mediterranean-crowd-calendar', '/most-overpriced-cruise-excursions', '/my-cruise-score', '/partners', '/plan-my-cruise-port-day', '/ports-where-you-do-not-need-an-excursion', '/ports-you-should-not-diy', '/porttrip-vs-cruise-excursions', '/press', '/research', '/resources', '/ship-safe-port-planning', '/tender-delay-predictor', '/the-economics-of-cruise-excursions', '/today', '/tools/taxi-fare-validator', '/what-to-do-at-cruise-port', '/what-to-do-if-your-excursion-runs-late', '/why-smart-cruisers-skip-excursions', '/WhatToDoInCruisePort', '/PortTransportGuide', '/PortTransportSEOPage', '/PortDayGuide', '/PublicPlan', '/SharedPlan', '/SixHourCruiseItinerary', '/CruiseDashboard', '/CruiseItinerary', '/hq/HQDeals'];
for (const a of PRUNED) perm(a, /excursion|overpa|markup|money|cost|price|save|economics|cheapest/.test(a) ? '/blog/are-cruise-excursions-worth-it' : /miss|late|ship-safe|risk/.test(a) ? '/how-to-never-miss-your-cruise-ship' : '/ports');
for (const p of ['/compare/:path*', '/port-comparisons/:path*', '/guides/:path*', '/cruise-lines/:path*', '/cruise-line/:path*', '/cruise-itinerary/:path*', '/cruise-intelligence/:path*']) perm(p, '/ports');
perm('/getting-to-:path*', '/ports');
perm('/cruise-port-transport/:city', '/ports/:city');
perm('/cruise-port-day/:city', '/ports/:city');
perm('/ports/:city/:sub', '/ports/:city');
perm('/ports/:city/:sub/:more*', '/ports/:city');


// Every other app route (sign-up, dashboard, shared plans, referral links, checkout...) goes to the app.
const APP_ROUTES = 'BlogCategory BlogPost CruiseDashboard CruiseItinerary CruiseLine CruiseLineSEO Home PortComparison PortComparisonPage PortDayGuide PortGuide PortLongTailPage PortSEOPage PortSubSEOPage PortTransportGuide PortTransportSEOPage PublicPlan SharedPlan SixHourCruiseItinerary WhatToDoInCruisePort about about-porttrip-intelligence activate ad admin advisors affiliates agency answers api api-reference are-cruise-excursions-worth-it avoid-cruise-excursion-overpaying avoid-missing-your-cruise-ship barcelona-cruise-stop-without-excursion best-cruise-lines-for-independent-port-days best-cruise-ports-elderly-mobility best-cruise-ports-for-diy best-cruise-ports-to-save-money best-mediterranean-cruise-ports big-4-cruise-ports blog can-a-cruise-ship-leave-without-you cheapest-cruise-ports cheapest-cruise-ports-to-diy checkout-return coming-soon community compare corrections crew cruise cruise-6-hours cruise-builder cruise-dashboard cruise-day-plan-generator cruise-excursion-alternative cruise-excursion-overpayment-calculator cruise-excursion-overprice-ranking cruise-excursion-price-tracker cruise-excursion-pricing cruise-excursion-savings-calculator cruise-excursions-marked-up-312-percent cruise-excursions-vs-diy cruise-hub cruise-intelligence cruise-itinerary cruise-itinerary-planner cruise-line cruise-line-excursion-comparison cruise-lines cruise-money-waste-calculator cruise-overpayment-map cruise-port-budget-rankings cruise-port-cost-calculator cruise-port-data cruise-port-day cruise-port-difficulty cruise-port-excursion-pricing cruise-port-hidden-costs cruise-port-independence-index cruise-port-independent-travel-report cruise-port-index cruise-port-intelligence-report cruise-port-missed-ship-risk cruise-port-planner cruise-port-price-intelligence cruise-port-return-risk-index cruise-port-return-time-study cruise-port-risk cruise-port-rules cruise-port-safety-rankings cruise-port-savings-index cruise-port-scams cruise-port-statistics cruise-port-stress-rankings cruise-port-taxi-vs-excursion cruise-port-tender-data cruise-port-tourist-trap-index cruise-port-transport cruise-port-transport-finder cruise-port-transport-guide cruise-port-transport-reliability-rankings cruise-port-updates cruise-ports cruise-ports-longest-tender-delays cruise-ports-where-tourists-waste-most-money cruise-profile-setup cruise-radar cruise-ships-in cruise-stop cruise-tools dashboard data-exchange day discover do-i-need-a-cruise-excursion dubrovnik-cruise-port-first-timers easiest-cruise-ports-to-explore-independently editorial-policy embed entity excursion-markup excursion-overprice-checker features first-cruise forgot-password getting-to-athens-piraeus getting-to-barcelona-cruise-port getting-to-civitavecchia getting-to-lisbon-cruise-port getting-to-naples-cruise-port getting-to-venice-cruise-port group-invite guides hidden-costs-of-cruise-excursions how-late-can-you-return-to-a-cruise-ship how-many-people-miss-their-cruise-ship how-much-am-i-overpaying how-much-do-cruise-excursions-cost how-much-do-cruise-lines-mark-up-excursions how-porttrip-calculates-risk how-porttrip-collects-data how-porttrip-predicts-port-conditions how-porttrip-scores-ports how-porttrip-validates-routes how-to-do-naples-cruise-port-on-your-own how-to-do-rome-without-a-cruise-tour how-to-do-santorini-yourself how-to-explore-barcelona-from-cruise-port how-to-get-back-to-cruise-ship-on-time how-to-never-miss-your-cruise-ship how-to-return-to-your-cruise-ship-on-time hq independent-cruise-port-guide independent-cruiser-manifesto institute intelligence is-it-safe-to-explore-cruise-ports-yourself is-santorini-worth-cruise-excursion is-this-cruise-port-walkable itineraries labs leave-by-widget leave-the-ship-calculator legal list-your-business live local-cruise-excursions login lp media mediterranean-crowd-calendar methodology most-overpriced-cruise-excursions my-cruise-score my-cruises naples-cruise-port-safety operators os partner-dashboard partners plan plan-my-cruise-port-day planner port port-comparisons port-day-live port-risk-index ports ports-where-you-do-not-need-an-excursion ports-you-should-not-diy porttrip-index porttrip-vs-cruise-excursions press preview pricing privacy protection r ref register report research reset-password resources review rome-cruise-port-common-mistakes shared ship-safe-port-planning should-i-book-cruise-excursion should-you-book-cruise-excursions signal-economy start summer-cruise-port-risk tender-delay-predictor terminal the-economics-of-cruise-excursions tiktok today tools travel-advisors ultimate-cruise-port-guide unsubscribe what-happens-if-you-miss-your-cruise-ship what-is-porttrip what-to-do-at-cruise-port what-to-do-if-your-excursion-runs-late why-smart-cruisers-skip-excursions will-i-make-it-back'.split(' ');
const SITE_ROOTS = new Set(['', 'ports', 'blog', 'pricing', 'about', 'what-is-porttrip', 'cruise-port-index', 'cruise-port-rules', 'methodology', 'editorial-policy', 'corrections', 'privacy', 'legal', 'will-i-make-it-back', 'how-to-return-to-your-cruise-ship-on-time', 'how-to-never-miss-your-cruise-ship', 'what-happens-if-you-miss-your-cruise-ship', 'can-a-cruise-ship-leave-without-you', 'how-late-can-you-return-to-a-cruise-ship', 'leave-by-widget', 'embed', 'data', 'sitemap.xml', 'sitemap-porttrip.xml', 'robots.txt', 'llms.txt']);
const handled = new Set(r.map((x) => x.source.split('/')[1].replace(/[:*].*/, '')));
for (const a of APP_ROUTES) {
  if (SITE_ROOTS.has(a) || handled.has(a) || a === 'api' || a === 'functions') continue;
  temp(`/${a}`, `${APP}/${a}`); temp(`/${a}/:path*`, `${APP}/${a}/:path*`);
}
// Webhooks and API calls (Stripe, RevenueCat, embeds) keep working on the old address: proxied, not redirected.
const rewrites = [{ source: '/functions/:path*', destination: `${APP}/functions/:path*` }, { source: '/api/:path*', destination: `${APP}/api/:path*` }];

const out = { $schema: 'https://openapi.vercel.sh/vercel.json', framework: 'astro', installCommand: 'npm install', buildCommand: 'npm run build', outputDirectory: 'dist', cleanUrls: true, trailingSlash: false, redirects: r, rewrites,
  headers: [{ source: '/(.*)', headers: [{ key: 'X-Content-Type-Options', value: 'nosniff' }, { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' }] },
            { source: '/embed/(.*)', headers: [{ key: 'Access-Control-Allow-Origin', value: '*' }, { key: 'Cache-Control', value: 'public, max-age=3600' }] }] };
fs.writeFileSync('vercel.json', JSON.stringify(out, null, 2));
console.log('redirects', r.length);
