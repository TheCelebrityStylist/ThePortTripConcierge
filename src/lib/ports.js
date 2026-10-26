import CATALOG from '../data/portCatalog.json';
import SHIPDAY from '../data/shipDayData.json';
import RULES from '../data/portRules.json';

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
