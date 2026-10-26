// Where the web app lives. Planner, live mode, checkout and accounts are all there.
// Switch to https://porttripapp.com once that domain is connected in Base44.
export const APP_URL = import.meta.env.PUBLIC_APP_URL || 'https://porttrip.base44.app';
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
