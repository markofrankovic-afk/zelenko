"""Planinarske i pješačke staze iz OSM relacija (route=hiking / route=foot, licenca ODbL).

  python3 alati/osm_pjesacke_rute.py <izvadak.osm.pbf> <docs_dir>

Za svaku relaciju: spaja članove (puteve) u liniju, rupe između dijelova (do 3 km) popunjava
najkraćim putem po OSM stazama i putovima, provjerava da je ruta većinom u Gorskom kotaru
i piše GPX (docs/gpx/PL<relacija>.gpx). Stajališta su naše glavne točke do 300 m od trase.
Uspon, profil, trajanje (DAV) i težinu dodaje visine.py.
Rezultat: docs/data/rute_planinarske.json (aplikacija ga dodaje ostalim rutama, Pro).
"""
import json, math, os, re, sys
import networkx as nx, numpy as np
import osmium, osmium.geom, shapely.wkb as wkb
from shapely.geometry import LineString, MultiLineString, Point
from shapely.ops import linemerge, unary_union
from shapely.prepared import prep

SRC, DOCS = sys.argv[1], sys.argv[2]
GPX = os.path.join(DOCS, "gpx"); os.makedirs(GPX, exist_ok=True)

# relacije koje ne uzimamo: slovenske staze uz Kupu, krnji dijelovi dugih obilaznica, višednevni putovi
IZUZMI = {2294923: "krnji dio Kapelskog puta (3 km od 100+)", 8536609: "krnji dio GPP-a",
          3153946: "višednevna obilaznica, rascjepkana", 21195780: "Camino, 299 km", 21702162: "Camino, rascjepkan"}
SLO = re.compile(r"(PD Kočevje|PD Črnomelj|Zavod za gozdove)", re.I)
# relacije koje ostaju iako je manje od pola trase u GK (početak je u susjednoj općini, cilj u GK)
ZADRZI = {11807461: "Vrelo – Bjelolasica", 8776284: "Zlobin – Medviđak", 14014675: "Bitoraj – Viševica",
          3930022: "Mrkopaljski put, južna skupina"}
# naša imena (hr, en) kad je OSM ime nespretno
IME = {5571086: ("Kanjon Kamačnika", "Kamačnik canyon"),
       7385900: ("Via Dinarica: kroz NP Risnjak", "Via Dinarica: through Risnjak National Park"),
       7385993: ("Via Dinarica: Bijele i Samarske stijene", "Via Dinarica: Bijele and Samarske stijene"),
       11548652: ("Staza prijateljstva Snežnik – Snježnik", "Friendship trail Snežnik – Snježnik"),
       3930022: ("Mrkopaljski planinarski put – južna skupina", "Mrkopalj mountain trail – southern group")}
OPIS = {  # kratka rečenica o stazi, samo opće poznate činjenice
    5571086: ("Šetnja kanjonom potoka Kamačnika kod Vrbovskog, mostićima i stazom uz vodu.",
              "A walk through the Kamačnik stream canyon near Vrbovsko, on footbridges and a path by the water."),
    9786893: ("Klasičan uspon na Risnjak s fužinske strane.", "The classic ascent of Risnjak from the Fužine side."),
    11548652: ("Prekogranična staza koja spaja Snežnik u Sloveniji i Snježnik iznad Platka.",
               "A cross-border trail linking Snežnik in Slovenia and Snježnik above Platak."),
    11807338: ("Greben od Samarskih stijena do Bjelolasice, najvišeg vrha Gorskog kotara.",
               "A ridge walk from Samarske stijene to Bjelolasica, the highest peak of Gorski kotar."),
    11807461: ("Uspon na Bjelolasicu (Kula, 1534 m) od Vrela.", "An ascent of Bjelolasica (Kula, 1534 m) from Vrelo."),
    14014675: ("Uspon na Viševicu s Bitoraja.", "An ascent of Viševica from Bitoraj."),
}
NP_RISNJAK = re.compile(r"(Nacionalni ?Park Ri|Risnjak Nation)", re.I)
MIN_KM, MAX_KM = 1.8, 35

# --- granica Gorskog kotara (ista kao u osm_bike_rute.py) ---
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
GK = prep(unary_union([u7, unary_union(cabar).buffer(0.01).buffer(-0.01)] + np_).buffer(0).buffer(0.01))

# --- relacije, putevi i mreža staza (za popunjavanje rupa) ---
REL, WIDS = {}, set()
for o in osmium.FileProcessor(SRC).with_filter(osmium.filter.EntityFilter(osmium.osm.RELATION)):
    t = dict(o.tags)
    if t.get("type") != "route" or t.get("route") not in ("hiking", "foot"): continue
    # odvojci (excursion, alternative, approach) nisu dio glavne trase
    w = [m.ref for m in o.members if m.type == "w" and m.role not in ("excursion", "alternative", "approach")]
    if w: REL[o.id] = (t, w); WIDS.update(w)


def hav(a, b):
    r = math.pi / 180; x = math.sin((b[1] - a[1]) * r / 2) ** 2 + math.cos(a[1] * r) * math.cos(b[1] * r) * math.sin((b[0] - a[0]) * r / 2) ** 2
    return 2 * 6371000 * math.asin(math.sqrt(x))


def duljina(c): return sum(hav(c[i], c[i + 1]) for i in range(len(c) - 1))


PJ = {"path": 1.0, "footway": 1.0, "bridleway": 1.0, "steps": 1.2, "track": 1.05, "service": 1.15, "unclassified": 1.2,
      "residential": 1.15, "living_street": 1.1, "pedestrian": 1.0, "tertiary": 1.5, "secondary": 2.5, "primary": 4.0, "cycleway": 1.1}
WAYS, G, XY = {}, nx.Graph(), {}
for o in osmium.FileProcessor(SRC, osmium.osm.NODE | osmium.osm.WAY).with_locations():
    if not o.is_way(): continue
    ns = [(n.ref, round(n.lon, 6), round(n.lat, 6)) for n in o.nodes if n.location.valid()]
    if o.id in WIDS and len(ns) > 1: WAYS[o.id] = [(x, y) for _, x, y in ns]
    hw = o.tags.get("highway")
    if hw in PJ and o.tags.get("access") not in ("private", "no"):
        for (a, ax, ay), (b, bx, by) in zip(ns, ns[1:]):
            XY[a] = (ax, ay); XY[b] = (bx, by); G.add_edge(a, b, w=hav((ax, ay), (bx, by)) * PJ[hw])
G = G.subgraph(max(nx.connected_components(G), key=len)).copy()
IDS = np.array(list(G.nodes)); PXY = np.array([XY[n] for n in IDS])


def snap(p):
    d = (PXY[:, 0] - p[0]) ** 2 * math.cos(math.radians(p[1])) ** 2 + (PXY[:, 1] - p[1]) ** 2
    i = int(d.argmin()); return int(IDS[i]), math.sqrt(d[i]) * 111000


def spoji(wids):
    """Spaja puteve relacije u dijelove i slaže ih redom (svaki se nastavlja na najbliži kraj prethodnog)."""
    ids = list(dict.fromkeys(w for w in wids if w in WAYS))
    if not ids: return None
    m = linemerge(MultiLineString([WAYS[w] for w in ids]))
    dij = [list(g.coords) for g in (m.geoms if hasattr(m, "geoms") else [m])]
    dij.sort(key=lambda c: -duljina(c))
    red = [dij.pop(0)]
    while dij:
        kraj, poc = red[-1][-1], red[0][0]
        d, i, obrni, nastavak = min({(hav(kraj, c[0]), i, False, True) for i, c in enumerate(dij)} |
                                    {(hav(kraj, c[-1]), i, True, True) for i, c in enumerate(dij)} |
                                    {(hav(poc, c[-1]), i, False, False) for i, c in enumerate(dij)} |
                                    {(hav(poc, c[0]), i, True, False) for i, c in enumerate(dij)})
        c = dij.pop(i)
        if obrni: c = c[::-1]
        red.append(c) if nastavak else red.insert(0, c)
    return red


def redom(wids):
    """Putevi redom kako su upisani u relaciju (većina planinarskih relacija je složena redom).
    Svaki put se okrene da se nastavlja na prethodni; gdje se ne nastavlja (> 50 m), počinje novi dio."""
    seq = [list(WAYS[w]) for w in wids if w in WAYS]
    if not seq: return None
    if len(seq) > 1 and min(hav(seq[0][0], seq[1][0]), hav(seq[0][0], seq[1][-1])) < min(hav(seq[0][-1], seq[1][0]), hav(seq[0][-1], seq[1][-1])):
        seq[0] = seq[0][::-1]
    red = [seq[0]]
    for c in seq[1:]:
        e = red[-1][-1]
        if hav(e, c[-1]) < hav(e, c[0]): c = c[::-1]
        if hav(e, c[0]) <= 50: red[-1] += c[1:]
        else: red.append(c)
    return red


def popuni(red):
    """Rupe između dijelova (50 m – 3 km) premošćuje najkraćim putem po stazama. Vraća dijelove i preostale rupe (m)."""
    out, rupa = [list(red[0])], 0.0
    for c in red[1:]:
        a, b = out[-1][-1], c[0]; d = hav(a, b)
        if d <= 50: out[-1] += list(c); continue
        ok = False
        if d <= 3000:
            (na, da), (nb, db) = snap(a), snap(b)
            if da < 150 and db < 150:
                try:
                    p = [XY[n] for n in nx.shortest_path(G, na, nb, weight="w")]
                    if duljina(p) < 1.5 * d + 300: out[-1] += p + list(c); ok = True
                except nx.NetworkXNoPath: pass
        if not ok: out.append(list(c)); rupa += d
    return out, rupa


T = json.load(open(os.path.join(DOCS, "data", "tocke.json"), encoding="utf-8"))["tocke"]
GLAVNE = [p for p in T if p.get("vaznost", 1) == 1 and p["podvrsta"] != "naselje"]
MJESTA = [p for p in T if p["podvrsta"] == "naselje"]


def mjesto(c):
    m = min(MJESTA, key=lambda p: hav(c, (p["lon"], p["lat"])))
    return m["tekst"]["hr"]["naziv"], m["tekst"].get("en", m["tekst"]["hr"])["naziv"]


def smjer_po_imenu(ime, dij):
    """Ime „A – B“: trasa se okreće da počinje kod A (OSM relacije često su upisane obrnuto)."""
    dijelovi = [x.strip() for x in re.split(r"\s[–-]\s", re.sub(r"^Via Dinarica:\s*", "", ime)) if x.strip()]
    if len(dijelovi) < 2: return dij
    poc, kraj = dij[0][0], dij[-1][-1]
    def gdje(ime):
        k = ime.lower().split(" (")[0]
        c = [p for p in T if p["tekst"]["hr"]["naziv"].lower().split(" (")[0] in (k, k.replace("od ", ""))
             or p["tekst"]["hr"]["naziv"].lower().startswith(k + " ")]
        return min(c, key=lambda p: min(hav(poc, (p["lon"], p["lat"])), hav(kraj, (p["lon"], p["lat"])))) if c else None
    a, b = gdje(dijelovi[0]), gdje(dijelovi[-1])
    if a: obrni = hav(kraj, (a["lon"], a["lat"])) < hav(poc, (a["lon"], a["lat"]))
    elif b: obrni = hav(poc, (b["lon"], b["lat"])) < hav(kraj, (b["lon"], b["lat"]))
    else: return dij
    return [c[::-1] for c in dij[::-1]] if obrni else dij


def km_txt(x): return f"{x:.1f}".replace(".", ",")


def gpx(naziv, dij, rel):
    pts = "\n </trkseg><trkseg>\n".join("\n".join(f'   <trkpt lat="{y}" lon="{x}"/>' for x, y in c) for c in dij)
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


out, odb = [], []
for rid, (t, wids) in sorted(REL.items()):
    naziv = (t.get("name") or "").strip()
    if rid in IZUZMI: odb.append((rid, IZUZMI[rid], naziv)); continue
    if not naziv: odb.append((rid, "bez imena", t.get("ref") or "")); continue
    if SLO.search(t.get("operator") or "") or re.search(r"\bpot\b", naziv) and rid not in IME: odb.append((rid, "slovenska staza", naziv)); continue
    if t.get("network") == "iwn": odb.append((rid, "međunarodni put", naziv)); continue
    if not any(w in WAYS for w in wids): odb.append((rid, "nema puteva u izvatku", naziv)); continue
    sirovo = sum(duljina(WAYS[w]) for w in dict.fromkeys(wids) if w in WAYS) / 1000
    # prvo redoslijed iz relacije, pa spajanje po blizini; uzima se prvi koji nema rupa ni udvostručenih dijelova
    izbor = None
    for nacin, red in (("redom", redom(wids)), ("spojeno", spoji(wids))):
        dij, rupa = popuni(red)
        km = sum(duljina(c) for c in dij) / 1000
        if rupa <= 0.1 * km * 1000 and km <= 1.12 * sirovo + 0.3: izbor = (dij, rupa, km, nacin); break
    if not izbor: odb.append((rid, f"rascjepkana ili s ograncima ({sirovo:.1f} km)", naziv)); continue
    dij, rupa, km, nacin = izbor
    dij = smjer_po_imenu(IME.get(rid, (naziv,))[0], dij)
    line = [p for c in dij for p in c]
    unutra = sum(1 for p in line if GK.contains(Point(p))) / len(line)
    if unutra < 0.5 and rid not in ZADRZI: odb.append((rid, f"izvan GK ({unutra:.0%})", naziv)); continue
    if not MIN_KM <= km <= MAX_KM: odb.append((rid, f"duljina {km:.1f} km", naziv)); continue
    kruzna = hav(line[0], line[-1]) < 300
    ls = LineString(line)
    simp_d = [[(round(x, 5), round(y, 5)) for x, y in LineString(c).simplify(0.00006).coords] for c in dij if len(c) > 1]
    st = []
    for p in GLAVNE:
        pt = Point(p["lon"], p["lat"])
        if not ls.envelope.buffer(0.005).contains(pt): continue
        if ls.distance(pt) * 111320 * math.cos(math.radians(p["lat"])) <= 300: st.append((ls.project(pt), p["id"]))
    st = [i for _, i in sorted(st)][:10]
    (od, od_en), (do, do_en) = mjesto(line[0]), mjesto(line[-1])
    vd = (t.get("operator") or "") == "Via Dinarica" or "via dinarica" in naziv.lower()
    ime, ime_en = IME.get(rid, (None, None))
    if not ime:
        ime = re.sub(r"\s+-\s+", " – ", naziv); ime = ime[0].upper() + ime[1:]
        if vd and not ime.startswith("Via Dinarica"): ime = "Via Dinarica: " + ime
        ime_en = ime
    uvod, uvod_en = OPIS.get(rid, ("", ""))
    smjer = (f"kružna iz mjesta {od}" if kruzna else f"od mjesta {od} do mjesta {do}, u jednom smjeru")
    smjer_en = (f"a loop from {od_en}" if kruzna else f"from {od_en} to {do_en}, one way")
    opis = (uvod + " " if uvod else "") + f"Markirana staza od {km_txt(km)} km, {smjer}." + (" Dio je dugog puta Via Dinarica." if vd else "")
    opis_en = (uvod_en + " " if uvod_en else "") + f"A waymarked trail of {km:.1f} km, {smjer_en}." + (" Part of the long-distance Via Dinarica." if vd else "")
    if NP_RISNJAK.search(t.get("operator") or "") or "risnjak" in naziv.lower():
        opis += " U nacionalnom parku plaća se ulaznica i vrijede pravila parka."
        opis_en += " Risnjak National Park charges admission and its rules apply."
    opis += " Trasa je iz OpenStreetMapa; prije polaska provjeri stanje staze i markacije."
    opis_en += " The route comes from OpenStreetMap; check the trail and waymarks before you set off."
    sid = f"PL{rid}"
    open(os.path.join(GPX, sid + ".gpx"), "w", encoding="utf-8").write(gpx(ime, dij, rid))
    r = {"id": sid, "vrsta": "planinarska",
         "tekst": {"hr": {"naziv": ime, "opis": opis, "parking": f"početak: {od}"}, "en": {"naziv": ime_en, "opis": opis_en, "parking": f"start: {od_en}"}},
         "tezina": "srednje", "km": round(km, 1), "km_gpx": round(km, 1), "sati": "", "uspon_m": None,
         "tocke": st, "besplatno": False, "polazista": [], "oblik": "kruzna" if kruzna else "linijska",
         "izvor_trase": f"OpenStreetMap (ODbL), relacija {rid}", "osm": f"r{rid}", "ref": t.get("ref"),
         "odrzava": t.get("operator"), "gpx": f"gpx/{sid}.gpx", "status": "iz OSM-a", "nacin": nacin}
    if len(simp_d) == 1: r["trasa"] = simp_d[0]
    else: r["trasa_dijelovi"] = simp_d
    out.append({k: v for k, v in r.items() if v is not None or k == "uspon_m"})

out.sort(key=lambda r: r["km"])
json.dump({"izvor": "OpenStreetMap (ODbL) – © OpenStreetMap suradnici", "rute": out},
          open(os.path.join(DOCS, "data", "rute_planinarske.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
print(len(out), "staza; odbačeno", len(odb))
for r in odb: print("  x", r)
for r in out: print(f"  {r['id']:11} {r['km']:5} km {r['nacin']:7} {'dij=' + str(len(r.get('trasa_dijelovi', [1]))):6} st={len(r['tocke'])} {r['tekst']['hr']['naziv']}")
