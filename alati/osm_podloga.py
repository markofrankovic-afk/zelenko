"""Offline podloga karte iz OSM izvatka (ODbL): ceste, staze, markirane planinarske staze, vode, naselja.

  python3 alati/osm_podloga.py <izvadak.osm.pbf> <izlaz podloga.json>

Format (sažet, bez GeoJSON omotača):
  {"v":1, "slojevi": {"<sloj>": [[razred, [[lon,lat],...]], ...]}, "mjesta": [[ime, lon, lat, vrsta]]}
Linije su pojednostavljene (~8 m) i zaokružene na 5 decimala (~1 m).
"""
import json, sys
import osmium, osmium.geom, shapely.wkb as wkb
from shapely.geometry import LineString, box
from shapely.ops import linemerge

SRC, OUT = sys.argv[1], sys.argv[2]
BOX = box(14.52, 45.17, 15.26, 45.66)         # Gorski kotar s malo okolice
TOL = 0.00008
fab = osmium.geom.WKBFactory()
R = lambda c: [round(c[0], 5), round(c[1], 5)]

CESTE = {"motorway": "a", "trunk": "a", "primary": "a", "motorway_link": "a", "trunk_link": "a", "primary_link": "a",
         "secondary": "b", "secondary_link": "b", "tertiary": "c", "tertiary_link": "c", "unclassified": "d", "road": "d",
         "residential": "e", "living_street": "e", "service": "f", "track": "g",
         "path": "h", "footway": "h", "bridleway": "h", "steps": "h", "cycleway": "h"}
S = {"ceste": [], "vode": [], "rijeke": [], "zeljeznica": [], "naselja": [], "staze_hps": [], "np": []}
M = []
hps_ways = set()

# 1) planinarske relacije: koje puteve obuhvaćaju
for r in osmium.FileProcessor(SRC, osmium.osm.RELATION):
    if r.tags.get("type") == "route" and r.tags.get("route") in ("hiking", "foot"):
        for m in r.members:
            if m.type == "w": hps_ways.add(m.ref)

def add(sloj, raz, geom):
    if geom.is_empty or not geom.intersects(BOX): return
    g = geom.intersection(BOX).simplify(TOL)
    parts = [g] if g.geom_type in ("LineString", "LinearRing") else list(getattr(g, "geoms", []))
    for p in parts:
        if p.geom_type == "Polygon": p = p.exterior
        if p.geom_type not in ("LineString", "LinearRing") or len(p.coords) < 2: continue
        S[sloj].append([raz, [R(c) for c in p.coords]])

fp = osmium.FileProcessor(SRC).with_locations().with_areas()
for o in fp:
    t = o.tags
    if o.is_node():
        if t.get("place") in ("town", "village") and t.get("name"):
            if BOX.contains(LineString([(o.location.lon, o.location.lat)] * 2).centroid):
                M.append([t["name"], round(o.location.lon, 5), round(o.location.lat, 5), t["place"]])
        continue
    if o.is_way():
        try: ls = wkb.loads(fab.create_linestring(o), hex=True)
        except Exception: continue
        hw = t.get("highway")
        if hw in CESTE: add("ceste", CESTE[hw], ls)
        if o.id in hps_ways: add("staze_hps", "m", ls)
        ww = t.get("waterway")
        if ww == "river": add("rijeke", "r", ls)
        elif ww in ("stream", "canal"): add("rijeke", "s", ls)
        if t.get("railway") == "rail": add("zeljeznica", "z", ls)
    elif o.is_area():
        try: g = wkb.loads(fab.create_multipolygon(o), hex=True)
        except Exception: continue
        if t.get("natural") == "water" or t.get("waterway") == "riverbank" or t.get("landuse") == "reservoir":
            if g.area > 2e-7: add("vode", "w", g.boundary)
        elif t.get("landuse") == "residential" and g.area > 5e-7: add("naselja", "n", g.boundary)
        elif t.get("boundary") == "national_park": add("np", "p", g.boundary)

# spoji susjedne dijelove istog razreda (manje zapisa)
for sloj, lst in S.items():
    by = {}
    for raz, c in lst: by.setdefault(raz, []).append(LineString(c))
    out = []
    for raz, lines in by.items():
        if sloj in ("vode", "naselja", "np"): out += [[raz, [R(c) for c in l.coords]] for l in lines]; continue
        mg = linemerge(lines)
        for l in ([mg] if mg.geom_type == "LineString" else mg.geoms): out.append([raz, [R(c) for c in l.coords]])
    S[sloj] = out
json.dump({"v": 1, "izvor": "© OpenStreetMap suradnici (ODbL)", "slojevi": S, "mjesta": M},
          open(OUT, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
import os
print({k: len(v) for k, v in S.items()}, "mjesta", len(M), "|", round(os.path.getsize(OUT) / 1e6, 2), "MB")
