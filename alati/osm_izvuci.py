"""Iz OSM izvatka (PBF, licenca ODbL) izvlači točke unutar Gorskog kotara.

  python3 alati/osm_izvuci.py <izvadak.osm.pbf> <izlaz.json>

Granica: 8 gradova/općina (admin_level 7) iz izvatka + Čabar složen od svojih naselja
(admin_level 8 sjeverno od Kupe koja nisu ni u jednoj od tih 8), bez ruba (granica sa Slovenijom), uz Platak.
"""
import json, sys, math
import osmium, osmium.geom, shapely.wkb as wkb
from shapely.geometry import Point
from shapely.ops import unary_union
from shapely.prepared import prep

SRC, OUT = sys.argv[1], sys.argv[2]
JLS = {"Općina Fužine", "Općina Lokve", "Grad Vrbovsko", "Općina Ravna Gora", "Općina Skrad",
       "Općina Brod Moravice", "Grad Delnice", "Općina Mrkopalj"}
fab = osmium.geom.WKBFactory()

# 1) granice
lv7, lv8, np = {}, [], []
for o in osmium.FileProcessor(SRC).with_areas(osmium.filter.TagFilter(("boundary", "administrative"), ("boundary", "national_park"))):
    if not o.is_area(): continue
    lvl, name = o.tags.get("admin_level"), o.tags.get("name")
    try: g = wkb.loads(fab.create_multipolygon(o), hex=True)
    except Exception: continue
    if o.tags.get("boundary") == "national_park": np.append(g); continue
    if lvl == "7" and name in JLS: lv7[name] = g
    elif lvl == "8" and name: lv8.append((name, g))
u7 = unary_union(list(lv7.values()))
cabar = [g for n, g in lv8 if not u7.buffer(-0.001).contains(g.representative_point())
         and g.representative_point().y > 45.47 and g.representative_point().x < 14.78]
from shapely.geometry import box
cab = unary_union(cabar).buffer(0.01).buffer(-0.01)                  # Čabar: naselja + šume između njih
tocno = unary_union([u7, cab] + np).buffer(0)                         # + NP Risnjak
# rub od ~1,5 km samo prema jugu i zapadu (vrhovi na granici općina); na sjeveru je Kupa granica sa Slovenijom
gk = unary_union([tocno, tocno.buffer(0.015).intersection(box(14.0, 45.0, 15.6, 45.40))])
gk = unary_union([gk, Point(14.5667, 45.4167).buffer(0.03)])          # Platak i Snježnik (Čavle)
P = prep(gk)
print("granica:", sorted(lv7), "+ Čabar od", len(cabar), "naselja")

# 2) naselja (za "najbliže mjesto")
PLACES = []

# 3) klasifikacija
def kl(t):
    g = t.get
    n = g("name")
    if g("place") in ("town", "village", "hamlet") and n: return ("_mjesto", g("place"))
    if g("natural") == "peak" and n: return ("planina", "vrh")
    if g("natural") == "saddle" and n: return ("planina", "prijevoj")
    if g("tourism") == "viewpoint": return ("planina", "vidikovac")
    if g("natural") == "cliff" and n: return ("planina", "stijene")
    if g("tourism") == "alpine_hut": return ("planina", "dom")
    if g("tourism") == "wilderness_hut" or (g("amenity") == "shelter" and g("shelter_type") in ("basic_hut", "weather_shelter", "rock_shelter")): return ("planina", "skloniste")
    if g("waterway") == "waterfall": return ("voda", "slap")
    if g("natural") == "spring": return ("voda", "izvor")
    if g("natural") == "water" and n: return ("voda", "jezero")
    if g("leisure") == "swimming_area" or (g("leisure") == "bathing_place"): return ("voda", "kupaliste")
    if g("natural") == "cave_entrance": return ("spilja", "spilja")
    if (g("boundary") == "protected_area" or g("leisure") == "nature_reserve") and n: return ("zasticeno", "zasticeno")
    if g("tourism") == "museum": return ("bastina", "muzej")
    h = g("historic")
    if h in ("castle", "fort", "manor", "ruins", "archaeological_site"): return ("bastina", "dvorac" if h in ("castle", "fort", "manor") else "arheologija" if h == "archaeological_site" else "rusevine")
    if h in ("memorial", "monument") and n: return ("bastina", "spomen")
    if h in ("mine", "mill", "watermill", "bridge", "railway", "aqueduct", "kiln", "industrial") and n: return ("bastina", "tehnicka")
    if h in ("church", "chapel", "monastery") and n: return ("bastina", "sakralno")
    if h and n and h not in ("wayside_cross", "boundary_stone", "wayside_shrine"): return ("bastina", "povijesno")
    if g("amenity") == "place_of_worship" and n: return ("bastina", "sakralno")
    if g("tourism") == "picnic_site" or (g("amenity") == "shelter" and g("shelter_type") in ("picnic_shelter", "lean_to")): return ("izlet", "piknik")
    if g("tourism") == "camp_site": return ("izlet", "kamp")
    if g("leisure") in ("park", "garden") and n and g("access") not in ("private", "no"): return ("izlet", "park")
    if g("leisure") == "playground" and g("access") not in ("private", "no"): return ("izlet", "igraliste")
    if g("tourism") == "attraction" and n: return ("izlet", "zanimljivost")
    if g("tourism") == "information" and g("information") == "office": return ("prakticno", "info")
    if g("railway") in ("station", "halt"): return ("prakticno", "kolodvor")
    if g("amenity") == "drinking_water": return ("prakticno", "pitka_voda")
    if g("amenity") == "parking": return ("prakticno", "parking")
    if g("amenity") == "toilets": return ("prakticno", "wc")
    if g("amenity") == "pharmacy": return ("prakticno", "ljekarna")
    if g("amenity") in ("doctors", "clinic", "hospital"): return ("prakticno", "ambulanta")
    if g("amenity") == "fuel": return ("prakticno", "benzinska")
    if g("amenity") == "atm" or (g("amenity") == "bank" and g("atm") == "yes"): return ("prakticno", "bankomat")
    return None

KEEP = ("name", "ele", "drinking_water", "opening_hours", "operator", "website", "wikidata", "wikipedia", "protect_class",
        "protection_title", "historic", "tourism", "natural", "amenity", "cave:type", "fee", "capacity", "access",
        "shelter_type", "religion", "denomination", "start_date", "heritage", "water", "intermittent", "height", "description")
out = []
fp = osmium.FileProcessor(SRC).with_locations().with_areas()
for o in fp:
    t = dict(o.tags)
    if not t: continue
    c = kl(t)
    if not c: continue
    # položaj: čvor, ili sredina puta/površine
    try:
        if o.is_node(): lon, lat = o.location.lon, o.location.lat
        elif o.is_area():
            g = wkb.loads(fab.create_multipolygon(o), hex=True); pt = g.representative_point(); lon, lat = pt.x, pt.y
        elif o.is_way():
            if o.is_closed() and c[0] in ("voda", "zasticeno", "izlet", "prakticno", "bastina", "planina", "spilja"):
                continue  # zatvoreni put dolazi i kao površina
            nodes = [(n.lon, n.lat) for n in o.nodes if n.location.valid()]
            if not nodes: continue
            lon, lat = nodes[len(nodes) // 2]
        else: continue
    except Exception:
        continue
    if not P.contains(Point(lon, lat)): continue
    if c[0] == "_mjesto":
        PLACES.append({"ime": t["name"], "lat": lat, "lon": lon, "vrsta": c[1]}); continue
    typ = "n" if o.is_node() else ("w" if (o.is_way() or (o.is_area() and o.from_way())) else "r")
    oid = o.orig_id() if o.is_area() else o.id
    out.append({"osm": f"{typ}{oid}", "kategorija": c[0], "podvrsta": c[1], "lat": round(lat, 6), "lon": round(lon, 6),
                "oznake": {k: v for k, v in t.items() if k in KEEP or k.startswith("name:")}})

# dvostruke površine (put i relacija za isti objekt) – zadrži prvu po imenu i položaju
seen, uniq = set(), []
for x in out:
    k = (x["kategorija"], x["podvrsta"], x["oznake"].get("name"), round(x["lat"], 3), round(x["lon"], 3))
    if k in seen: continue
    seen.add(k); uniq.append(x)
json.dump({"izvor": "OpenStreetMap (ODbL) – BBBike izvadak 23. 10. 2026.", "mjesta": PLACES, "tocke": uniq},
          open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=0)
from collections import Counter
print(len(uniq), "točaka;", len(PLACES), "naselja")
for (k, p), n in sorted(Counter((x["kategorija"], x["podvrsta"]) for x in uniq).items()):
    named = sum(1 for x in uniq if x["kategorija"] == k and x["podvrsta"] == p and x["oznake"].get("name"))
    print(f"  {k:10} {p:14} {n:5}  (s imenom {named})")
