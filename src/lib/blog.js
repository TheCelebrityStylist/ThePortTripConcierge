import { marked } from 'marked';
const FILES = import.meta.glob('../data/blog/*.js', { eager: true, import: 'default' });

function parseFront(raw) {
  const m = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(raw.trim());
  if (!m) return { data: {}, content: raw };
  const data = {};
  for (const line of m[1].split('\n')) {
    const mm = /^([A-Za-z_]+):\s*(.*)$/.exec(line);
    if (!mm) continue;
    let v = mm[2].trim();
    if (v.startsWith('[')) { try { v = JSON.parse(v); } catch { v = v.replace(/^\[|\]$/g, '').split(',').map((x) => x.trim().replace(/^"|"$/g, '')).filter(Boolean); } }
    else if (/^".*"$/.test(v)) v = v.slice(1, -1);
    else if (v === 'true' || v === 'false') v = v === 'true';
    else if (/^\d+$/.test(v)) v = Number(v);
    data[mm[1]] = v;
  }
  return { data, content: m[2] };
}

function faqsFrom(md) {
  const sec = /^##\s+(FAQ|FAQs|Frequently asked questions)\s*$([\s\S]*?)(?=^##\s|\s*$(?![\s\S]))/im.exec(md);
  if (!sec) return [];
  const out = [];
  const re = /^###\s+(.+)\n+([\s\S]*?)(?=^###\s|$(?![\s\S]))/gm;
  let x; while ((x = re.exec(sec[2]))) out.push({ q: x[1].replace(/\*\*/g, '').trim(), a: x[2].replace(/\n+/g, ' ').replace(/[*_`]/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').trim() });
  return out.filter((f) => f.a);
}

export const POSTS = Object.entries(FILES).map(([path, raw]) => {
  if (typeof raw !== 'string') return null;
  const { data, content } = parseFront(raw);
  if (!data.slug) return null;
  let body = content.replace(/^#\s+.+\n+/, ''); // H1 comes from the template
  // Pull the "Quick answer" section out so the template can show it as a callout.
  let quick = null;
  const qa = /^##\s+Quick answer\s*\n+([\s\S]*?)(?=^##\s)/im.exec(body);
  if (qa) { quick = marked.parseInline(qa[1].trim().replace(/\n+/g, ' ')); body = body.replace(qa[0], ''); }
  const html = marked.parse(body, { gfm: true });
  const words = body.split(/\s+/).length;
  return { ...data, file: path.split('/').pop(), html, quick, faqs: faqsFrom(body), readTime: data.readTime || Math.max(2, Math.round(words / 220)) };
}).filter(Boolean);

export const BY_SLUG = Object.fromEntries(POSTS.map((p) => [p.slug, p]));
