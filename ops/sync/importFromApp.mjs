// Merge a bundle from the Base44 app (scripts/site/exportForSite.mjs) into the website data.
// Usage (repo root): node ops/sync/importFromApp.mjs [<url or file>] [--overwrite slug,slug]
// Default source: https://porttripapp.com/site-sync/bundle.json
// Adds only NEW ports and posts. An existing guide or post is never overwritten unless named in --overwrite.
// Remembers the last bundle id in ops/sync/last.json, so the same bundle is imported once.
import fs from 'fs';

const args = process.argv.slice(2);
const oi = args.indexOf('--overwrite');
const ow = new Set(oi >= 0 ? (args[oi + 1] || '').split(',').filter(Boolean) : []);
const src = args.find((a, i) => !a.startsWith('--') && !(oi >= 0 && i === oi + 1)) || 'https://porttripapp.com/site-sync/bundle.json';
const D = 'src/data', LAST = 'ops/sync/last.json';
const b = /^https?:/.test(src)
  ? await fetch(src, { headers: { 'User-Agent': 'porttrip-site-sync', 'Cache-Control': 'no-cache' } }).then((r) => { if (!r.ok) throw new Error(`fetch ${r.status}`); return r.json(); })
  : JSON.parse(fs.readFileSync(src, 'utf8'));
const last = fs.existsSync(LAST) ? JSON.parse(fs.readFileSync(LAST, 'utf8')) : {};
if (b.id && b.id === last.id && !ow.size) { console.log(`bundle ${b.id} already imported on ${last.at}`); process.exit(0); }
const today = new Date().toISOString().slice(0, 10);
const rd = (f) => JSON.parse(fs.readFileSync(`${D}/${f}`, 'utf8'));
const SD = rd('shipDayData.json'), CAT = rd('portCatalog.json'), IMG = rd('portImages.json'), TOURS = rd('tours.json'), PUB = rd('published.json');
const added = { ports: [], posts: [], skipped: [] };
const addUrl = (path) => { const u = PUB.urls.find((x) => x.path === path); if (u) u.lastmod = today; else PUB.urls.push({ path, lastmod: today }); };

for (const [s, g] of Object.entries(b.guides)) {
  const p = `${D}/guides/${s}.json`;
  if (fs.existsSync(p) && !ow.has(s)) { added.skipped.push(`port ${s} (exists)`); continue; }
  if (!b.shipDay[s] || !b.catalog[s]) { added.skipped.push(`port ${s} (no shipDay/catalog in bundle)`); continue; }
  fs.writeFileSync(p, JSON.stringify(g));
  SD[s] = b.shipDay[s];
  CAT.ports[s] = b.catalog[s];
  const x = b.extras[s] || {};
  if (x.image) IMG[s] = x.image;
  if (x.tours?.tours?.length) TOURS[s] = x.tours;
  addUrl(`/ports/${s}`);
  added.ports.push(s);
}
// Regions: take the app's lists, but never drop a port the website has.
const regions = b.regions;
const listed = new Set(Object.values(regions).flat());
for (const [r, l] of Object.entries(CAT.regions)) for (const s of l) if (!listed.has(s)) (regions[r] ||= []).push(s);
CAT.regions = regions;

for (const [slug, text] of Object.entries(b.posts)) {
  const p = `${D}/blog/${slug}.js`;
  if (fs.existsSync(p) && !ow.has(slug)) { added.skipped.push(`post ${slug} (exists)`); continue; }
  fs.writeFileSync(p, text);
  if (!PUB.blog.includes(slug)) PUB.blog.push(slug);
  addUrl(`/blog/${slug}`);
  added.posts.push(slug);
}

if (added.ports.length || added.posts.length) {
fs.writeFileSync(`${D}/shipDayData.json`, JSON.stringify(SD, null, 1));
fs.writeFileSync(`${D}/portCatalog.json`, JSON.stringify(CAT));
fs.writeFileSync(`${D}/portImages.json`, JSON.stringify(IMG, null, 0));
fs.writeFileSync(`${D}/tours.json`, JSON.stringify(TOURS));
fs.writeFileSync(`${D}/published.json`, JSON.stringify(PUB, null, 1));
}
const noImg = added.ports.filter((s) => !IMG[s]), noTours = added.ports.filter((s) => !TOURS[s]);
fs.writeFileSync(LAST, JSON.stringify({ id: b.id, made: b.made, at: today, ports: added.ports, posts: added.posts }, null, 1));
console.log(JSON.stringify({ id: b.id, ...added, noImage: noImg, noTours }, null, 1));
if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `changed=${added.ports.length + added.posts.length > 0}\nports=${added.ports.join(',')}\nposts=${added.posts.join(',')}\n`);
