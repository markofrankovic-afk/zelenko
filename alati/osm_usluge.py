"""Iz OSM izvatka (ODbL) izvlači usluge u Gorskom kotaru: gdje jesti, spavati i kupiti.

  python3 alati/osm_usluge.py <izvadak.osm.pbf> <docs/data/usluge.json>

Granica je ista kao u osm_izvuci.py. Uz svaku uslugu ide radno vrijeme (opening_hours),
telefon i web kad postoje u OSM-u. Polje "partner" (false) je za poduzetnike koji se
uključe u vodič: oni dobivaju opis, fotografiju i istaknuti prikaz.
"""
import json, sys, math
import osmium, osmium.geom, shapely.wkb as wkb
from shapely.geometry import Point, box
from shapely.ops import unary_union
from shapely.prepared import prep

SRC, OUT = sys.argv[1], sys.argv[2]
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
gk = unary_union([tocno, tocno.buffer(0.015).intersection(box(14.0, 45.0, 15.6, 45.40)), Point(14.5667, 45.4167).buffer(0.03)])
P = prep(gk)

JELO = {"restaurant": "restoran", "cafe": "kafic", "fast_food": "brza_hrana", "pub": "pub", "bar": "kafic",
        "ice_cream": "sladoled", "biergarten": "pub"}
SPAVANJE = {"hotel": "hotel", "guest_house": "pansion", "hostel": "hostel", "motel": "hotel",
            "apartment": "apartman", "chalet": "kuca_za_odmor"}
KUPNJA = {"farm": "opg", "supermarket": "trgovina", "convenience": "trgovina", "general": "trgovina",
          "bakery": "pekarnica", "butcher": "mesnica", "greengrocer": "trgovina", "deli": "delikatese",
          "gift": "suveniri", "alcohol": "delikatese", "beverages": "delikatese", "outdoor": "oprema", "sports": "oprema"}


def kl(t):
    a, tu, sh = t.get("amenity"), t.get("tourism"), t.get("shop")
    # OPG i domaći proizvodi: farma, med, mlijeko, sir, pčelar, vino, ili "OPG" u imenu
    if sh in ("farm", "honey", "dairy", "cheese") or t.get("craft") in ("beekeeper", "cheese", "winery", "distillery") \
            or "opg" in t.get("name", "").lower().split() or "obiteljsko poljoprivredno" in t.get("name", "").lower():
        return ("kupnja", "opg")
    if a == "vending_machine" and t.get("vending") in ("milk", "eggs", "food", "cheese"):
        return ("kupnja", "mljekomat")
    if a in JELO: return ("jelo", JELO[a])
    if tu in SPAVANJE: return ("spavanje", SPAVANJE[tu])
    if sh in KUPNJA: return ("kupnja", KUPNJA[sh])
    return None


def prvi(t, *k):
    for x in k:
        if t.get(x): return t[x].split(";")[0].strip()
    return None


out, seen = [], set()
for o in osmium.FileProcessor(SRC).with_locations().with_areas():
    t = dict(o.tags)
    if not t: continue
    c = kl(t)
    if not c: continue
    if not t.get("name"):
        if c[1] not in ("opg", "mljekomat"): continue
        t["name"] = {"beekeeper": "Pčelar (domaći med)"}.get(t.get("craft")) or ("Domaći med" if t.get("shop") == "honey" else
                    "Mljekomat" if c[1] == "mljekomat" else "OPG (domaći proizvodi)")
    try:
        if o.is_node(): lon, lat = o.location.lon, o.location.lat
        elif o.is_area():
            pt = wkb.loads(fab.create_multipolygon(o), hex=True).representative_point(); lon, lat = pt.x, pt.y
        elif o.is_way():
            if o.is_closed(): continue
            n = [(x.lon, x.lat) for x in o.nodes if x.location.valid()]
            if not n: continue
            lon, lat = n[len(n) // 2]
        else: continue
    except Exception:
        continue
    if not P.contains(Point(lon, lat)): continue
    k = (t["name"].lower(), round(lat, 3), round(lon, 3))
    if k in seen: continue
    seen.add(k)
    typ = "n" if o.is_node() else ("w" if (o.is_way() or (o.is_area() and o.from_way())) else "r")
    oid = o.orig_id() if o.is_area() else o.id
    web = prvi(t, "website", "contact:website", "url")
    if web and not web.startswith("http"): web = "https://" + web
    x = {"id": f"U{typ}{oid}", "vrsta": c[0], "podvrsta": c[1], "naziv": t["name"], "lat": round(lat, 6), "lon": round(lon, 6),
         "radno_vrijeme": t.get("opening_hours"), "telefon": prvi(t, "phone", "contact:phone", "contact:mobile"),
         "web": web, "kuhinja": t.get("cuisine"), "zvjezdice": t.get("stars"),
         "adresa": " ".join(v for v in [t.get("addr:street"), t.get("addr:housenumber")] if v) or None,
         "mjesto": t.get("addr:city") or t.get("addr:place"), "osm": f"{typ}{oid}", "partner": False}
    out.append({k2: v for k2, v in x.items() if v is not None})

# ručno upisani partneri (izvori/partneri.json): zamjenjuju isti objekt iz OSM-a ako je na istom mjestu
import os
pp = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "izvori", "partneri.json")
if os.path.exists(pp):
    for x in json.load(open(pp, encoding="utf-8"))["partneri"]:
        out = [u for u in out if not (u["naziv"].lower() == x["naziv"].lower() and abs(u["lat"] - x["lat"]) < 0.005)]
        out.append(x)
out.sort(key=lambda x: (x["vrsta"], x["naziv"]))
json.dump({"izvor": "OpenStreetMap (ODbL) – BBBike izvadak 23. 10. 2026.", "licenca": "ODbL – © OpenStreetMap suradnici",
           "usluge": out}, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=0)
from collections import Counter
print(len(out), "usluga")
for (v, p), n in sorted(Counter((x["vrsta"], x["podvrsta"]) for x in out).items()):
    print(f"  {v:9} {p:14} {n:4}  s radnim vremenom {sum(1 for x in out if x['vrsta']==v and x['podvrsta']==p and x.get('radno_vrijeme'))}")
