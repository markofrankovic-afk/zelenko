"""Biciklističke i MTB rute iz OSM relacija (route=bicycle / route=mtb, licenca ODbL).

  python3 alati/osm_bike_rute.py <izvadak.osm.pbf> <docs_dir>

Za svaku relaciju: spaja članove (puteve) u jednu liniju, računa duljinu, provjerava da je
većinom u Gorskom kotaru, pojednostavljuje trasu za kartu i piše GPX (docs/gpx/B<relacija>.gpx).
Uz rutu idu stajališta: naše glavne točke (važnost 1) do 300 m od trase, redom duž trase.
Težina i trajanje su procjena iz duljine i vrste (MTB sporije); visine nema u OSM-u.
Rezultat: docs/data/rute_bicikl.json (aplikacija ga dodaje ostalim rutama).
"""
import json, math, os, re, sys
import osmium, osmium.geom, shapely.wkb as wkb
from shapely.geometry import LineString, MultiLineString, Point, box
from shapely.ops import linemerge, unary_union
from shapely.prepared import prep

SRC, DOCS = sys.argv[1], sys.argv[2]
GPX = os.path.join(DOCS, "gpx"); os.makedirs(GPX, exist_ok=True)

# --- granica Gorskog kotara (ista kao u osm_izvuci.py / osm_usluge.py) ---
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
GK = prep(tocno.buffer(0.01))

# --- relacije i njihovi putevi ---
REL, WIDS = {}, set()
for o in osmium.FileProcessor(SRC).with_filter(osmium.filter.EntityFilter(osmium.osm.RELATION)):
    t = dict(o.tags)
    if t.get("route") not in ("bicycle", "mtb") or t.get("type") != "route": continue
    w = [m.ref for m in o.members if m.type == "w"]
    if not w: continue
    REL[o.id] = (t, w); WIDS.update(w)
WAYS = {}
for o in osmium.FileProcessor(SRC).with_locations().with_filter(osmium.filter.EntityFilter(osmium.osm.WAY)):
    if o.id in WIDS:
        c = [(round(n.lon, 6), round(n.lat, 6)) for n in o.nodes if n.location.valid()]
        if len(c) > 1: WAYS[o.id] = c


def hav(a, b):
    r = math.pi / 180; x = math.sin((b[1] - a[1]) * r / 2) ** 2 + math.cos(a[1] * r) * math.cos(b[1] * r) * math.sin((b[0] - a[0]) * r / 2) ** 2
    return 2 * 6371000 * math.asin(math.sqrt(x))


def duljina(c): return sum(hav(c[i], c[i + 1]) for i in range(len(c) - 1))


def spoji(wids):
    """Spaja puteve relacije (redoslijed u relaciji nije bitan): spoji dijelove koji se dodiruju,
    pa ih poreda tako da se svaki nastavlja na najbliži kraj prethodnog. Vraća dijelove, duljinu puteva i zbroj skokova."""
    ids = list(dict.fromkeys(w for w in wids if w in WAYS))
    if not ids: return None, 0, 0
    km = sum(duljina(WAYS[w]) for w in ids)
    m = linemerge(MultiLineString([WAYS[w] for w in ids]))
    dijelovi = [list(g.coords) for g in (m.geoms if hasattr(m, "geoms") else [m])]
    dijelovi.sort(key=lambda c: -duljina(c))
    red = [dijelovi.pop(0)]; skok = 0
    while dijelovi:
        kraj, pocetak = red[-1][-1], red[0][0]
        best = min({(hav(kraj, c[0]), i, False, True) for i, c in enumerate(dijelovi)} |
                   {(hav(kraj, c[-1]), i, True, True) for i, c in enumerate(dijelovi)} |
                   {(hav(pocetak, c[-1]), i, False, False) for i, c in enumerate(dijelovi)} |
                   {(hav(pocetak, c[0]), i, True, False) for i, c in enumerate(dijelovi)})
        d, i, obrni, nastavak = best
        c = dijelovi.pop(i)
        if obrni: c = c[::-1]
        if nastavak: red.append(c)
        else: red.insert(0, c)
        if d > 50: skok += d
    return red, km, skok


T = json.load(open(os.path.join(DOCS, "data", "tocke.json"), encoding="utf-8"))["tocke"]
GLAVNE = [p for p in T if p.get("vaznost", 1) == 1 and p["podvrsta"] != "naselje"]
MJESTA = [p for p in T if p["podvrsta"] == "naselje"]


def najblize_mjesto(c):
    m = min(MJESTA, key=lambda p: hav(c, (p["lon"], p["lat"])))
    return m["tekst"]["hr"]["naziv"], hav(c, (m["lon"], m["lat"]))


def km_txt(x): return f"{x:.1f}".replace(".", ",")


def gpx(rid, naziv, dijelovi, rel):
    pts = "\n </trkseg><trkseg>\n".join("\n".join(f'   <trkpt lat="{y}" lon="{x}"/>' for x, y in c) for c in dijelovi)
    nz = naziv.replace("&", "&amp;").replace("<", "&lt;")
    return f'''<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Zelenko" xmlns="http://www.topografix.com/GPX/1/1">
 <metadata><name>{nz}</name><copyright author="OpenStreetMap suradnici"><license>https://opendatacommons.org/licenses/odbl/</license></copyright>
  <link href="https://www.openstreetmap.org/relation/{rel}"><text>OSM relacija {rel}</text></link></metadata>
 <trk><name>{nz}</name><trkseg>
{pts}
 </trkseg></trk>
</gpx>
'''


out, vidjeno, odbaceno = [], {}, []
for rid, (t, wids) in sorted(REL.items()):
    naziv = (t.get("name") or "").strip(); ref = (t.get("ref") or "").strip()
    if not naziv and not ref: odbaceno.append((rid, "bez imena", "")); continue
    if t.get("network") in ("icn", "ncn") or "eurovelo" in (naziv + ref).lower(): odbaceno.append((rid, "međunarodna/državna", naziv or ref)); continue
    dijelovi, km, skok = spoji(wids)
    line = [p for c in dijelovi for p in c] if dijelovi else None
    if not line: odbaceno.append((rid, "nema puteva u izvatku", naziv or ref)); continue
    km /= 1000
    unutra = sum(1 for p in line if GK.contains(Point(p))) / len(line)
    if unutra < 0.5: odbaceno.append((rid, f"izvan GK ({unutra:.0%})", naziv or ref)); continue
    if km < 3 or km > 160: odbaceno.append((rid, f"duljina {km:.1f} km", naziv or ref)); continue
    if skok > 0.15 * km * 1000: odbaceno.append((rid, f"rascjepkana (skokovi {skok/1000:.1f} km)", naziv or ref)); continue
    kljuc = (naziv.lower() or ref.lower())
    if kljuc in vidjeno and abs(vidjeno[kljuc]["km"] - km) < 2: odbaceno.append((rid, "dupla", naziv or ref)); continue
    mtb = t.get("route") == "mtb" or "mtb" in (naziv + ref).lower()
    kruzna = hav(line[0], line[-1]) < 500
    ls = LineString(line)
    simp = [(round(x, 5), round(y, 5)) for x, y in ls.simplify(0.00008).coords]
    # dijelovi trase (kad relacija ima rupe, crtaju se odvojeno)
    simp_d = [[(round(x, 5), round(y, 5)) for x, y in LineString(c).simplify(0.00008).coords] for c in dijelovi if len(c) > 1]
    # stajališta: glavne točke do 300 m od trase, redom duž trase
    st = []
    for p in GLAVNE:
        pt = Point(p["lon"], p["lat"])
        if not ls.envelope.buffer(0.005).contains(pt): continue
        d = ls.distance(pt) * 111320 * math.cos(math.radians(p["lat"]))
        if d <= 300: st.append((ls.project(pt), p["id"]))
    st = [i for _, i in sorted(st)][:10]
    od, _ = najblize_mjesto(line[0]); do, _ = najblize_mjesto(line[-1])
    # procjena: cesta ~15 km/h, MTB ~9 km/h
    h = km / (9 if mtb else 15)
    sati = f"{km_txt(max(0.5, round(h * 2) / 2 * 0.8))}–{km_txt(max(1, round(h * 2) / 2 * 1.2))}".replace(",0", "")
    tezina = ("lagano" if km < 20 else "srednje" if km < 40 else "zahtjevno") if not mtb else ("srednje" if km < 25 else "zahtjevno")
    ime = naziv or f"Biciklistička ruta {ref}"
    if ref and naziv and ref.lower() not in naziv.lower(): ime = f"{naziv} ({ref})"
    # OSM imena tipa "1", "staza 7a", "F30": dodaj vrstu i mjesto početka da se snađeš na popisu
    gm = re.fullmatch(r"(?:staza\s*)?([a-z]?\d+[a-z]?)", (naziv or ref).lower())
    ime_en = ime.replace("Biciklistička ruta", "Cycling route")
    if gm:
        ime = f"{'MTB' if mtb else 'Biciklistička'} staza {gm.group(1).upper()}, {od}"
        ime_en = f"{'MTB' if mtb else 'Cycling'} trail {gm.group(1).upper()}, {od}"
    else: ime = ime_en = (ime[0].upper() + ime[1:]).replace("vilage", "village")
    opis_en = (f"{'MTB' if mtb else 'Cycling'} route of {km:.1f} km" + (f", a loop from {od}" if kruzna else f", from {od} to {do}")
               + ". The route is mapped in OpenStreetMap; check trail conditions before you ride.")
    opis = (f"{'MTB' if mtb else 'Biciklistička'} ruta od {km_txt(km)} km" + (f", kružna iz mjesta {od}" if kruzna else f", od mjesta {od} do mjesta {do}")
            + ". Trasa je označena u OpenStreetMapu; prije vožnje provjeri stanje puta na terenu.")
    sid = f"B{rid}"
    open(os.path.join(GPX, sid + ".gpx"), "w", encoding="utf-8").write(gpx(rid, ime, dijelovi, rid))
    r = {"id": sid, "vrsta": "biciklisticka", "bicikl": "mtb" if mtb else "cesta",
         "tekst": {"hr": {"naziv": ime, "opis": opis, "parking": f"početak: {od}"}, "en": {"naziv": ime_en, "opis": opis_en, "parking": f"start: {od}"}},
         "tezina": tezina, "km": round(km, 1), "km_gpx": round(km, 1), "sati": sati, "uspon_m": None,
         "tocke": st, "besplatno": False, "polazista": [], "oblik": "kruzna" if kruzna else "linijska",
         "izvor_trase": f"OpenStreetMap (ODbL), relacija {rid}", "osm": f"r{rid}", "ref": ref or None,
         "napomena": "Duljina iz OSM trase; trajanje je procjena, uspon nepoznat.",
         "gpx": f"gpx/{sid}.gpx", "status": "iz OSM-a, opis za doradu", "trasa": simp if len(simp_d) == 1 else None,
         "trasa_dijelovi": simp_d if len(simp_d) > 1 else None}
    r = {k: v for k, v in r.items() if v is not None or k in ("uspon_m",)}
    vidjeno[kljuc] = r
    out.append(r)

out.sort(key=lambda r: (r["bicikl"], r["km"]))
json.dump({"izvor": "OpenStreetMap (ODbL) – © OpenStreetMap suradnici", "rute": out},
          open(os.path.join(DOCS, "data", "rute_bicikl.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
print(len(out), "ruta;", sum(1 for r in out if r["bicikl"] == "mtb"), "MTB;", "odbačeno", len(odbaceno))
from collections import Counter
print(Counter(r[1].split(" (")[0] for r in odbaceno))
if os.environ.get("ODB"):
    for r in odbaceno: print("  x", r)
for r in out: print(f"  {r['id']:10} {r['bicikl']:5} {r['km']:6} km {r['tezina']:9} {r['sati']:8} st={len(r['tocke'])} {r['tekst']['hr']['naziv']}")
