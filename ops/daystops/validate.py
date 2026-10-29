#!/usr/bin/env python3
"""Validate one or more day-builder stop files against their guide.
Usage: validate.py <slug> [<slug> ...]   (or 'all')"""
import json, re, sys, os, unicodedata

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'src', 'data')
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out')
TAGS = {'history', 'art', 'views', 'food', 'beach', 'swim', 'nature', 'active', 'culture', 'shopping', 'family', 'relaxed', 'architecture', 'photo', 'local', 'nightlife'}
KINDS = {'sight', 'museum', 'church', 'viewpoint', 'walk', 'beach', 'swim', 'market', 'food', 'snack', 'activity', 'daytrip'}
MODES = {'walk', 'bus', 'tram', 'metro', 'train', 'taxi', 'ferry', 'boat', 'shuttle', 'cable car', 'funicular', 'tender', 'car', 'coach', 'bike', 'lift'}
SD = json.load(open(f'{ROOT}/shipDayData.json'))

def norm(s):
    s = unicodedata.normalize('NFKC', str(s or '')).lower()
    s = s.replace('’', "'").replace('–', '-').replace('—', '-')
    return re.sub(r'\s+', ' ', s).strip()

STOP = set('the a an of and at in on to for with by from or de la le el di del da do das dos des du von van y e'.split())

def words(s):
    return [w for w in re.findall(r"[\w']+", norm(s)) if w not in STOP and len(w) > 2]

def strings(o):
    # all string values (and keys) as plain text; json.dumps would escape quotes/backslashes and break verbatim matching
    if isinstance(o, dict): return [x for k, v in o.items() for x in [str(k)] + strings(v)]
    if isinstance(o, list): return [x for v in o for x in strings(v)]
    return [] if o is None else [str(o)]

def check(slug):
    errs, warns = [], []
    gp, op = f'{ROOT}/guides/{slug}.json', f'{OUT}/{slug}.json'
    if not os.path.exists(op):
        return [f'missing output {op}'], []
    g = json.load(open(gp)); d = json.load(open(op))
    blob = norm(' \x00 '.join(strings(g) + strings(SD.get(slug, {}))))
    lb = (SD.get(slug) or {}).get('leaveBy') or []
    if d.get('slug') != slug: errs.append('slug mismatch')
    areas = d.get('areas') or []
    ids = {a.get('id') for a in areas}
    if 'centre' not in ids: errs.append('no area with id "centre"')
    for a in areas:
        if not a.get('name'): errs.append(f'area {a.get("id")} has no name')
        if not a.get('modes'): errs.append(f'area {a.get("id")} has no modes')
        for m in a.get('modes') or []:
            if not isinstance(m.get('leaveBy'), int) or not (0 <= m['leaveBy'] < len(lb)):
                errs.append(f'area {a.get("id")}: leaveBy index {m.get("leaveBy")} out of range (0..{len(lb)-1})')
            if not isinstance(m.get('fromShipMin'), (int, float)) or not (0 <= m['fromShipMin'] <= 240):
                errs.append(f'area {a.get("id")}: fromShipMin {m.get("fromShipMin")} not 0..240')
            if m.get('mode') not in MODES: warns.append(f'area {a.get("id")}: unusual mode "{m.get("mode")}"')
            if not m.get('how'): errs.append(f'area {a.get("id")}: mode without how')
    used = {m.get('leaveBy') for a in areas for m in (a.get('modes') or [])} | {u.get('index') for u in (d.get('unusedLeaveBy') or [])}
    for i in range(len(lb)):
        if i not in used: errs.append(f'leaveBy[{i}] "{lb[i].get("from")}" is not used by an area nor listed in unusedLeaveBy')
    for a in areas:
        for l in a.get('links') or []:
            if l.get('to') not in ids: errs.append(f'area {a.get("id")}: link to unknown area {l.get("to")}')
            if not isinstance(l.get('min'), (int, float)) or not (1 <= l['min'] <= 240): errs.append(f'area {a.get("id")}: link min {l.get("min")}')
    stops = d.get('stops') or []
    if len(stops) < 3: errs.append(f'only {len(stops)} stops')
    seen = set()
    for s in stops:
        sid = s.get('id')
        if not sid or sid in seen: errs.append(f'bad or duplicate id {sid}')
        seen.add(sid)
        p = f'stop {sid}'
        if s.get('area') not in ids: errs.append(f'{p}: area {s.get("area")} not defined')
        if s.get('kind') not in KINDS: errs.append(f'{p}: kind {s.get("kind")}')
        if not isinstance(s.get('min'), (int, float)) or not (10 <= s['min'] <= 480): errs.append(f'{p}: min {s.get("min")}')
        t = s.get('tags') or []
        if not (2 <= len(t) <= 4) or any(x not in TAGS for x in t): errs.append(f'{p}: tags {t}')
        if s.get('effort') not in ('easy', 'moderate', 'hard'): errs.append(f'{p}: effort {s.get("effort")}')
        if s.get('best') not in ('early', 'late', 'midday', 'any'): errs.append(f'{p}: best {s.get("best")}')
        for k in ('indoor', 'heat', 'family', 'signature'):
            if not isinstance(s.get(k), bool): errs.append(f'{p}: {k} must be true/false')
        if s.get('stepFree') not in (True, False, None): errs.append(f'{p}: stepFree')
        cd = s.get('closedDays') or []
        if any((not isinstance(x, int)) or x < 0 or x > 6 for x in cd): errs.append(f'{p}: closedDays {cd}')
        for k in ('cost', 'hours'):
            v = s.get(k)
            if v and norm(v) not in blob: errs.append(f'{p}: {k} text not found verbatim in guide: {v[:70]}')
        ce = s.get('costEUR')
        if ce is not None:
            if not isinstance(ce, (int, float)) or ce < 0: errs.append(f'{p}: costEUR {ce}')
            elif ce > 0 and not re.search(r'€\s?' + re.escape(str(ce).rstrip('0').rstrip('.') if isinstance(ce, float) else str(ce)) + r'\b', blob.replace(',', '.')) and str(ce) not in blob:
                warns.append(f'{p}: costEUR {ce} not seen as a euro amount in the guide')
        w = words(s.get('name'))
        if w:
            hit = sum(1 for x in w if x in blob)
            if hit / len(w) < 0.6: errs.append(f'{p}: name not traceable to guide: {s.get("name")}')
        n = s.get('note')
        if n and len(n) > 160: errs.append(f'{p}: note too long')
        if not s.get('src'): errs.append(f'{p}: no src')
        else:
            m = re.match(r'^(sights|beaches|food|topAttractions)\[(\d+)\]$|^dayPlan\.steps\[(\d+)\]$', s['src'])
            if not m: errs.append(f'{p}: src format {s["src"]}')
            elif m.group(1) and int(m.group(2)) >= len(g.get(m.group(1)) or []): errs.append(f'{p}: src {s["src"]} out of range')
            elif m.group(3) and int(m.group(3)) >= len((g.get('dayPlan') or {}).get('steps') or []): errs.append(f'{p}: src {s["src"]} out of range')
        if s.get('kind') in ('food', 'snack', 'beach', 'swim') and 'est' not in s: errs.append(f'{p}: est missing')
    # coverage: every sight/beach/food is either a stop or dropped
    srcs = {s.get('src') for s in stops} | {x.get('src') for x in (d.get('dropped') or [])}
    for key in ('sights', 'beaches', 'food'):
        for i, _ in enumerate(g.get(key) or []):
            if f'{key}[{i}]' not in srcs: errs.append(f'{key}[{i}] neither a stop nor dropped')
    return errs, warns

if __name__ == '__main__':
    args = sys.argv[1:]
    if args == ['all']:
        args = sorted(f[:-5] for f in os.listdir(OUT) if f.endswith('.json'))
    bad = 0
    for slug in args:
        e, w = check(slug)
        if e: bad += 1
        print(f'{slug}: {"OK" if not e else str(len(e)) + " errors"}{", " + str(len(w)) + " warnings" if w else ""}')
        for x in e: print('  ERROR', x)
        for x in w: print('  warn ', x)
    sys.exit(1 if bad else 0)
