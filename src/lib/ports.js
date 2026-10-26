import CATALOG from '../data/portCatalog.json';
import SHIPDAY from '../data/shipDayData.json';
import RULES from '../data/portRules.json';
import IMG from '../data/portImages.json';

const GUIDE_FILES = import.meta.glob('../data/guides/*.json', { eager: true, import: 'default' });
export const GUIDES = Object.fromEntries(Object.entries(GUIDE_FILES).map(([p, g]) => [p.split('/').pop().replace('.json', ''), g]));
export const CAT = CATALOG.ports;
export const REGIONS = CATALOG.regions;
export const SLUGS = Object.keys(GUIDES).sort();
export const shipDay = (slug) => SHIPDAY[slug] || {};
export const leaveRows = (slug) => (SHIPDAY[slug]?.leaveBy || CAT[slug]?.sd?.leaveBy || []);
export const RULE_ENTRIES = RULES.entries;
export const RULES_CHECKED = RULES.checked;

const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
export function rulesFor(slug) {
  const g = GUIDES[slug]; if (!g) return [];
  const names = [g.city, g.townName, g.portName].map(norm);
  return RULE_ENTRIES.filter((e) => names.some((n) => n && (n.includes(norm(e.port)) || norm(e.port).includes(norm(g.city)))));
}
export const cityShort = (c) => String(c || '').split(' (')[0];

// Cruise Port Index score (0–10): getting to town 0–4 · return safety 0–4 · time in town 0–2.
export function scoreOf(slug) {
  const d = CAT[slug]?.sd || {};
  let getting = 1;
  if (d.access === 'walk') getting = d.walkMinutes != null && d.walkMinutes <= 20 ? 4 : 3;
  else if (d.access === 'walk-or-ride' || d.access === 'tender') getting = 2;
  const safety = d.returnRisk === 'low' ? 4 : d.returnRisk === 'medium' ? 2 : 0;
  const centre = d.leaveBy?.[0]?.minutesBeforeAllAboard ?? null;
  const time = centre == null ? 0 : centre <= 75 ? 2 : centre <= 105 ? 1 : 0;
  return getting + safety + time;
}
export const ACCESS_LABEL = { walk: 'Walk to town', 'walk-or-ride': 'Walk or short ride', tender: 'Tender port', transport: 'Transport needed' };

export const portImage = (slug) => IMG[slug] || null;
// Wikimedia only serves standard thumbnail widths (250, 330, 500, 960, 1280, 1920).
export function wm(src, w) {
  if (!src) return null;
  if (/\/thumb\//.test(src)) return src.replace(/\/\d+px-([^/]+)$/, `/${w}px-$1`);
  const m = src.match(/^(https:\/\/upload\.wikimedia\.org\/wikipedia\/commons)\/(\w\/\w\w)\/([^/]+)$/);
  return m ? `${m[1]}/thumb/${m[2]}/${m[3]}/${w}px-${m[3]}` : src;
}
export const wmSet = (src, widths = [960, 1280, 1920]) => src ? widths.map((w) => `${wm(src, w)} ${w}w`).join(', ') : null;
