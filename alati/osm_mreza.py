"""Mreža putova Gorskog kotara za navigaciju u aplikaciji, bez signala (OSM, ODbL).

  python3 alati/osm_mreza.py <izvadak.osm.pbf> <docs/data/mreza.json>

Uzima ceste, šumske ceste, staze i stube unutar Gorskog kotara (s rubom od ~2 km).
Čvorovi mreže su samo raskrižja i krajevi puteva; oblik puta između njih ide uz bridove
(pojednostavljen na ~4 m). Koordinate su cijeli brojevi (stupanj × 1e5), pomaci od prethodne točke.

Format (kratko, zbog veličine):
  c  = popis vrsta puta (highway), m = popis imena ulica/puteva
  n  = [x0, y0, dx1, dy1, ...] čvorovi (pomaci)
  e  = [a, b, duljina_m, vrsta, zastavice, ime(-1), [dx, dy, ...] oblik od a prema b (bez a i b)]
  zastavice: 1 = zabranjeno pješacima, 2 = zabranjeno biciklima, 4 = markirana planinarska staza,
             8 = zahtjevna staza (sac_scale od demanding_mountain_hiking), 16 = jednosmjerno za bicikl (a→b)
"""
import json, math, os, sys
import osmium, osmium.geom, shapely.wkb as wkb
from shapely.geometry import LineString, Point
from shapely.ops import unary_union
from shapely.prepared import prep

SRC, OUT = sys.argv[1], sys.argv[2]
VRSTE = ["path", "footway", "track", "service", "unclassified", "residential", "living_street", "pedestrian",
         "tertiary", "secondary", "primary", "cycleway", "bridleway", "steps", "tertiary_link", "secondary_link", "primary_link", "trunk"]
VI = {v: i for i, v in enumerate(VRSTE)}

# --- granica (kao u osm_izvuci.py), s rubom da se put ne prekida na granici ---
JLS = {"Općina Fužine", "Općina Lokve", "Grad Vrbovsko", "Općina Ravna Gora", "Općina Skrad",
       "Općina Brod Moravice", "Grad Delnice", "Općina Mrkopalj"}
fab = osmium.geom.WKBFactory()
lv7, lv8, np_ = {}, [], []
for o in osmium.FileProcessor(SRC).with_areas(osmium.filter.TagFilter(("boundary", "administrative"), ("boundary", "national_park"))):
    if not o.is_area(): continue
    lvl, name = o.tags.get("admin_level"), o.tags.get("name")
    try: g = wkb.loads(fab.create_multipolygon(o), hex=True)
    except Exception: continue
    if o.tags.get("boundary") == "national_park": np_.append(g); continue
    if lvl == "7" and name in JLS: lv7[name] = g
    elif lvl == "8" and name: lv8.append((name, g))
u7 = unary_union(list(lv7.values()))
cabar = [g for n, g in lv8 if not u7.buffer(-0.001).contains(g.representative_point())
         and g.representative_point().y > 45.47 and g.representative_point().x < 14.78]
tocno = unary_union([u7, unary_union(cabar).buffer(0.01).buffer(-0.01)] + np_).buffer(0)
GK = prep(tocno.buffer(0.025).simplify(0.002))

# --- markirane staze (planinarske relacije) ---
MARK = set()
for o in osmium.FileProcessor(SRC).with_filter(osmium.filter.EntityFilter(osmium.osm.RELATION)):
    if o.tags.get("route") in ("hiking", "foot"):
        MARK.update(m.ref for m in o.members if m.type == "w")

# --- putevi ---
ways, ref = [], {}
for w in osmium.FileProcessor(SRC, osmium.osm.NODE | osmium.osm.WAY).with_locations():
    if not w.is_way(): continue
    t = w.tags; hw = t.get("highway")
    if hw not in VI: continue
    if t.get("access") in ("private", "no") and t.get("foot") not in ("yes", "designated") and t.get("bicycle") not in ("yes", "designated"): continue
    if t.get("area") == "yes": continue
    ns = [(n.ref, round(n.lon * 1e5), round(n.lat * 1e5)) for n in w.nodes if n.location.valid()]
    if len(ns) < 2: continue
    if not any(GK.contains(Point(x / 1e5, y / 1e5)) for _, x, y in ns[:: max(1, len(ns) // 6)] + [ns[-1]]): continue
    z = 0
    if t.get("foot") == "no" or hw == "trunk": z |= 1
    if t.get("bicycle") == "no" or hw == "steps": z |= 2
    if w.id in MARK: z |= 4
    if t.get("sac_scale") in ("demanding_mountain_hiking", "alpine_hiking", "demanding_alpine_hiking", "difficult_alpine_hiking"): z |= 8
    if t.get("oneway") in ("yes", "1") and t.get("oneway:bicycle") != "no" and hw not in ("path", "footway", "track"): z |= 16
    ime = t.get("name") or t.get("ref")
    ways.append((hw, z, ime, ns))
    for i, (nid, _, _) in enumerate(ns):
        ref[nid] = ref.get(nid, 0) + (2 if i in (0, len(ns) - 1) else 1)


def hav(a, b):
    r = math.pi / 180; x = math.sin((b[1] - a[1]) * r / 2) ** 2 + math.cos(a[1] * r) * math.cos(b[1] * r) * math.sin((b[0] - a[0]) * r / 2) ** 2
    return 2 * 6371000 * math.asin(math.sqrt(x))


cvor, cxy, edges, imena = {}, [], [], {}
def ci(nid, x, y):
    if nid not in cvor: cvor[nid] = len(cxy); cxy.append((x, y))
    return cvor[nid]

for hw, z, ime, ns in ways:
    start = 0
    for i in range(1, len(ns)):
        if ref[ns[i][0]] >= 2 or i == len(ns) - 1:
            seg = ns[start:i + 1]
            if len(seg) >= 2 and seg[0][0] != seg[-1][0] or len(seg) > 3:
                pts = [(x / 1e5, y / 1e5) for _, x, y in seg]
                d = sum(hav(pts[k], pts[k + 1]) for k in range(len(pts) - 1))
                mid = list(LineString(pts).simplify(0.00004).coords)[1:-1] if len(pts) > 2 else []
                a = ci(*seg[0]); b = ci(*seg[-1])
                geo, px, py = [], seg[0][1], seg[0][2]
                for x, y in mid:
                    X, Y = round(x * 1e5), round(y * 1e5); geo += [X - px, Y - py]; px, py = X, Y
                mi = imena.setdefault(ime, len(imena)) if ime else -1
                edges.append([a, b, max(1, round(d)), VI[hw], z, mi, geo])
            start = i

# --- samo povezani dijelovi (izbaci otočiće manje od 30 čvorova) ---
par = list(range(len(cxy)))
def nadi(x):
    while par[x] != x: par[x] = par[par[x]]; x = par[x]
    return x
for e in edges:
    ra, rb = nadi(e[0]), nadi(e[1])
    if ra != rb: par[ra] = rb
from collections import Counter
vel = Counter(nadi(i) for i in range(len(cxy)))
ok = {r for r, n in vel.items() if n >= 30}
nov = {}
for i in range(len(cxy)):
    if nadi(i) in ok: nov[i] = len(nov)
edges = [[nov[e[0]], nov[e[1]]] + e[2:] for e in edges if e[0] in nov and e[1] in nov]
xy = [cxy[i] for i in sorted(nov, key=nov.get)]
flat, px, py = [], 0, 0
for x, y in xy: flat += [x - px, y - py]; px, py = x, y
im = [None] * len(imena)
for k, v in imena.items(): im[v] = k
out = {"v": 1, "izvor": "OpenStreetMap (ODbL) – © OpenStreetMap suradnici", "c": VRSTE, "m": im, "n": flat, "e": edges}
s = json.dumps(out, ensure_ascii=False, separators=(",", ":"))
open(OUT, "w", encoding="utf-8").write(s)
import gzip
print(f"{len(xy)} čvorova, {len(edges)} bridova, {len(im)} imena; {len(s)/1e6:.2f} MB, gzip {len(gzip.compress(s.encode()))/1e6:.2f} MB")
print("km mreže:", round(sum(e[2] for e in edges) / 1000), "| markirano km:", round(sum(e[2] for e in edges if e[4] & 4) / 1000))
