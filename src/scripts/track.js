// Custom events for Vercel Web Analytics. One delegated listener, no markup changes
// beyond the data-buy attributes already on the buy buttons.
// Vercel allows two properties per event on Pro, so every event sends at most two.
import { track } from '@vercel/analytics';

const path = location.pathname;
const pageType = path === '/' ? 'home' : path.split('/')[1] || 'other';
const port = (/^\/ports\/([^/]+)/.exec(path) || [])[1] || '';
const page = port || (/^\/blog\/([^/]+)/.exec(path) || [])[1] || pageType;

const once = new Set();
const fire = (name, data, key) => {
  if (key) { if (once.has(key)) return; once.add(key); }
  try { track(name, data); } catch (e) { /* analytics must never break the page */ }
};

document.addEventListener('click', (e) => {
  const a = e.target.closest && e.target.closest('a[href]');
  if (!a) return;
  const href = a.href;
  if (a.dataset.buy !== undefined) {
    const product = /buy=pro_yearly/.test(href) ? 'year_pass' : 'cruise_pass';
    fire('Buy click', { placement: a.dataset.buy || pageType, product });
  } else if (/porttripapp\.com\/day\//.test(href)) {
    fire('Free plan click', { page, port: (/\/day\/([^/?#]+)/.exec(href) || [])[1] || '' });
  } else if (/viator\.com/.test(href)) {
    fire('Tour click', { page, where: a.closest('aside') ? 'strip' : 'list' });
  } else if (/porttripapp\.com\/(login|pricing)/.test(href)) {
    fire('App click', { page, target: /login/.test(href) ? 'sign_in' : 'pricing' });
  }
}, { capture: true });

// Someone who drags the all-aboard slider is planning a real day.
document.addEventListener('input', (e) => {
  if (e.target.matches && e.target.matches('[data-aa-range], input[type="time"]')) fire('All-aboard set', { page }, 'aa');
}, { capture: true });

// Read depth on articles and port guides.
if (pageType === 'blog' || pageType === 'ports') {
  const marks = [50, 90];
  const onScroll = () => {
    const h = document.documentElement.scrollHeight - innerHeight;
    if (h <= 0) return;
    const pct = (scrollY / h) * 100;
    marks.forEach((m) => { if (pct >= m) fire('Read depth', { page, depth: String(m) }, 'r' + m); });
    if (once.has('r90')) removeEventListener('scroll', onScroll);
  };
  addEventListener('scroll', onScroll, { passive: true });
}
