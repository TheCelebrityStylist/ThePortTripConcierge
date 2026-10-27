// Where the web app lives. Planner, live mode, checkout and accounts are all there.
// Switch to https://porttripapp.com once that domain is connected in Base44.
export const APP_URL = import.meta.env.PUBLIC_APP_URL || 'https://porttripapp.com';
export const SITE = 'https://porttrip.com';
export const app = (path = '/') => `${APP_URL}${path}`;

export const toMin = (t) => { const m = /^(\d{1,2}):(\d{2})/.exec(String(t || '')); return m ? Number(m[1]) * 60 + Number(m[2]) : null; };
export const fmt = (x) => { if (x == null) return ''; const t = ((Math.round(x) % 1440) + 1440) % 1440; return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`; };
export const dur = (m) => { const h = Math.floor(m / 60); const r = m % 60; return h ? `${h} h${r ? ` ${r} min` : ''}` : `${r} min`; };

export const PRICES = { pass: '€14.99', year: '€39' }; // mirrors Stripe (Oct 2026)

export const unsplash = (id, w) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=70`;
export const srcset = (id) => [750, 1080, 1600, 2400].map((w) => `${unsplash(id, w)} ${w}w`).join(', ');

// Routes that live in the app, not on this site.
export const APP_PATHS = /^\/(planner|day\/|port-day-live|login|cruise-dashboard|cruise-radar|my-cruises|checkout|advisors|travel-advisors|hq|account|settings)/;
export function fixLinks(html) {
  return String(html).replace(/href="(\/[^"]*)"/g, (m, p) => (APP_PATHS.test(p) ? `href="${APP_URL}${p}" rel="nofollow"` : m));
}

// ── Buying ──────────────────────────────────────────────────────────────────
// Straight to checkout: the app's /pricing?buy=<product> opens the purchase
// flow at once. utm_* is picked up by the app's first-touch attribution, so
// each placement on this site shows up separately in the funnel.
export const buyUrl = (product = 'cruise_pass', src = 'site') =>
  app(`/pricing?buy=${product}&src=${encodeURIComponent(src)}&utm_source=porttrip.com&utm_medium=site&utm_campaign=${encodeURIComponent(src)}`);

// Three facts that make the case. Each is sourced in the linked post.
export const PROOF = [
  { k: 'miss', head: 'Ships do not wait.', body: 'In March 2024, eight Norwegian Dawn passengers on a private tour came back to the pier in São Tomé more than an hour after all-aboard. Getting back on board took six days, seven countries and over $5,000.', href: '/blog/what-happens-if-you-miss-cruise-ship' },
  { k: 'price', head: 'The ship charges for the easy part.', body: 'Carnival sells a coach to Rome for US$129.99 a person. The train is from €9.20 return. PortTrip tells you which train, and the last one that gets you back.', href: '/blog/how-much-do-cruise-excursions-cost' },
  { k: 'live', head: 'On the day, it watches the clock.', body: 'Google Maps travel time from where you stand back to the pier, with alerts at 30, 15 and 0 minutes.', href: '/pricing' },
];
