"""Vlastita topografska karta Gorskog kotara za rad bez signala.

  python3 alati/osm_karta.py <izvadak.osm.pbf> <docs_dir> <dem.tif> [<dem.tif> ...]

Iz OSM izvatka (ODbL) i modela terena Copernicus DEM GLO-30 gradi:
  docs/karta/v/{z}/{x}/{y}.mvt   vektorske pločice z8–14 (šuma, livade, vode, ceste, staze, zgrade,
                                 markirane planinarske staze, slojnice, mjesta, vrhovi)
  docs/karta/s/{z}/{x}/{y}.webp  sjenčanje terena z8–13 (prozirno, crta se preko karte)
  docs/karta/popis.json          popis svih pločica (za preuzimanje cijele karte) i veličina
Aplikacija crta pločice sama (protomaps-leaflet), a iznad z14 povećava podatke iz z14.
"""
import json, math, os, shutil, sys
from collections import defaultdict
import numpy as np, osmium, osmium.geom, shapely, shapely.wkb as wkb
from shapely.geometry import LineString, Point, box
from shapely.strtree import STRtree
import mapbox_vector_tile as mvt, mercantile
from scipy.ndimage import gaussian_filter, map_coordinates
import rasterio
from rasterio.merge import merge
from skimage.measure import find_contours
from PIL import Image

SRC, DOCS, DEMS = sys.argv[1], sys.argv[2], sys.argv[3:]
OUT = os.path.join(DOCS, "karta")
W, S, E, N = 14.42, 45.15, 15.33, 45.70  # lon/lat okvir karte
ZMIN, ZMAX, ZSJ = 8, 14, 13
R = 6378137.0


def merc(xy):
    xy = np.asarray(xy, dtype=float)
    x = np.radians(xy[:, 0]) * R
    y = np.log(np.tan(np.pi / 4 + np.radians(np.clip(xy[:, 1], -85, 85)) / 2)) * R
    return np.column_stack([x, y])


def m(g): return shapely.transform(g, merc)


# ---------------- OSM ----------------
SUMA = {("landuse", "forest"), ("natural", "wood")}
LIVADA = {("landuse", "meadow"), ("natural", "grassland"), ("landuse", "grass"), ("natural", "heath"), ("landuse", "farmland"),
          ("landuse", "orchard"), ("natural", "scrub"), ("landuse", "allotments")}
NASELJE = {("landuse", "residential"), ("landuse", "commercial"), ("landuse", "industrial"), ("landuse", "retail")}
STIJENE = {("natural", "bare_rock"), ("natural", "scree"), ("natural", "cliff")}
CESTA = {"motorway": "autocesta", "motorway_link": "autocesta", "trunk": "autocesta", "trunk_link": "autocesta",
         "primary": "glavna", "primary_link": "glavna", "secondary": "sporedna", "secondary_link": "sporedna",
         "tertiary": "sporedna", "tertiary_link": "sporedna", "unclassified": "lokalna", "residential": "lokalna",
         "living_street": "lokalna", "service": "servis", "track": "makadam", "path": "staza", "footway": "staza",
         "bridleway": "staza", "steps": "staza", "cycleway": "staza", "pedestrian": "lokalna"}
CESTA_Z = {"autocesta": 8, "glavna": 8, "sporedna": 10, "lokalna": 12, "servis": 14, "makadam": 12, "staza": 13, "pruga": 10}
MJESTO_Z = {"city": 8, "town": 8, "village": 10, "hamlet": 12, "isolated_dwelling": 14, "locality": 14}

L = defaultdict(list)  # sloj -> [(geom_merc, props, minzoom)]
bb = box(W, S, E, N)
fab = osmium.geom.WKBFactory()

# planinarske relacije (markirane staze)
HIKE = set()
for o in osmium.FileProcessor(SRC).with_filter(osmium.filter.EntityFilter(osmium.osm.RELATION)):
    if o.tags.get("type") == "route" and o.tags.get("route") in ("hiking", "foot"):
        HIKE.update(mm.ref for mm in o.members if mm.type == "w")

for o in osmium.FileProcessor(SRC).with_areas().with_locations():
    t = o.tags
    try:
        if o.is_area():
            kv = None
            for k in ("landuse", "natural", "leisure", "waterway", "water", "building", "boundary"):
                if k in t: kv = (k, t[k]); break
            if not kv: continue
            g = None
            def geom():
                return wkb.loads(fab.create_multipolygon(o), hex=True)
            if kv in SUMA: lay, p, z = "pokrov", {"k": "suma"}, 8
            elif kv in LIVADA: lay, p, z = "pokrov", {"k": "livada"}, 11
            elif kv in NASELJE: lay, p, z = "pokrov", {"k": "naselje"}, 10
            elif kv in STIJENE and kv != ("natural", "cliff"): lay, p, z = "pokrov", {"k": "stijene"}, 11
            elif kv == ("natural", "wetland"): lay, p, z = "pokrov", {"k": "mocvara"}, 11
            elif kv == ("leisure", "park") or kv == ("landuse", "cemetery"): lay, p, z = "pokrov", {"k": "park"}, 13
            elif t.get("natural") == "water" or t.get("waterway") == "riverbank" or t.get("landuse") == "reservoir":
                lay, p, z = "voda", {}, 8
            elif "building" in t: lay, p, z = "zgrade", {}, 14
            elif t.get("boundary") == "national_park" or (t.get("boundary") == "protected_area" and t.get("protect_class") in ("1", "1a", "1b", "2")):
                lay, p, z = "zastita", {"n": t.get("name", "")}, 9
            else: continue
            g = geom()
            if not g.intersects(bb): continue
            L[lay].append((m(g.intersection(bb.buffer(0.02)) if lay != "zastita" else g), p, z))
        elif o.is_way():
            hw, ww, rw = t.get("highway"), t.get("waterway"), t.get("railway")
            if not (hw in CESTA or ww in ("river", "stream", "canal") or rw == "rail" or o.id in HIKE): continue
            c = [(n.lon, n.lat) for n in o.nodes if n.location.valid()]
            if len(c) < 2: continue
            g = LineString(c)
            if not g.intersects(bb): continue
            gm = m(g)
            if hw in CESTA:
                k = CESTA[hw]
                if k == "makadam" and t.get("tracktype") in ("grade4", "grade5"): k = "staza"
                p = {"k": k}
                if t.get("name"): p["n"] = t["name"]
                if t.get("ref") and k in ("autocesta", "glavna", "sporedna"): p["r"] = t["ref"]
                if t.get("tunnel") == "yes": p["t"] = 1
                L["ceste"].append((gm, p, CESTA_Z[k]))
            if rw == "rail": L["ceste"].append((gm, {"k": "pruga"}, CESTA_Z["pruga"]))
            if ww in ("river", "canal"): L["vodotoci"].append((gm, {"k": "rijeka", **({"n": t["name"]} if t.get("name") else {})}, 9))
            elif ww == "stream": L["vodotoci"].append((gm, {"k": "potok"}, 12))
            if o.id in HIKE: L["markirane"].append((gm, {}, 11))
        elif o.is_node():
            if not (W <= o.location.lon <= E and S <= o.location.lat <= N): continue
            pt = m(Point(o.location.lon, o.location.lat))
            if t.get("place") in MJESTO_Z and t.get("name"):
                pl = t["place"]
                L["mjesta"].append((pt, {"n": t["name"], "k": pl, "r": {"city": 1, "town": 1, "village": 2, "hamlet": 3}.get(pl, 4)}, MJESTO_Z[pl]))
            elif t.get("natural") == "peak" and t.get("name"):
                p = {"n": t["name"]}
                try: p["e"] = round(float(t.get("ele", "").replace(",", ".")))
                except ValueError: pass
                p["l"] = f'{p["n"]} {p["e"]}' if "e" in p else p["n"]
                L["vrhovi"].append((pt, p, 11 if p.get("e", 0) >= 1200 else 12))
    except Exception:
        continue
# zgrade koje nedostaju u OSM-u: Microsoft Global ML Building Footprints (ODbL), izvori/ms_zgrade/*.csv.gz
# (jedna GeoJSON značajka po retku; quadkeyi 120230320–120230323). Uzimaju se samo one koje ne dodiruju OSM zgradu.
import glob, gzip
MS = sorted(glob.glob(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "izvori", "ms_zgrade", "*.csv.gz")))
if MS:
    osm_z = STRtree([g for g, _, _ in L["zgrade"]]); dodano = 0
    for f in MS:
        for red in gzip.open(f, "rt", encoding="utf-8"):
            g = shapely.geometry.shape(json.loads(red)["geometry"])
            c = g.centroid
            if not (W <= c.x <= E and S <= c.y <= N): continue
            gm = m(g)
            if len(osm_z.query(gm, predicate="intersects")): continue
            L["zgrade"].append((gm, {"ms": 1}, 14)); dodano += 1
    print("Microsoft zgrade dodane:", dodano)
print({k: len(v) for k, v in L.items()})

# ---------------- teren: slojnice i sjenčanje ----------------
srcs = [rasterio.open(d) for d in DEMS]
dem, tr = merge(srcs)  # cijeli DEM (45–46° N, 14–16° E): pločice z8 sežu daleko izvan okvira
dem = dem[0].astype("float32"); dem[dem < -100] = np.nan
dem = np.nan_to_num(dem, nan=float(np.nanmean(dem)))
glatko = gaussian_filter(dem, 2.0)  # DSM sadrži i krošnje: izgladi da slojnice ne prate drveće
px_lon, px_lat = tr.a, tr.e  # stupnjevi po pikselu (e je negativan)


def pix2ll(rc):
    r, c = rc[:, 0], rc[:, 1]
    return np.column_stack([tr.c + (c + 0.5) * px_lon, tr.f + (r + 0.5) * px_lat])


# slojnice samo za okvir karte (cijeli DEM je za sjenčanje)
r0, c0 = int((N + 0.03 - tr.f) / px_lat), int((W - 0.03 - tr.c) / px_lon)
r1, c1 = int((S - 0.03 - tr.f) / px_lat), int((E + 0.03 - tr.c) / px_lon)
KROJ = glatko[r0:r1, c0:c1]
def pix2ll(rc):
    r, c = rc[:, 0] + r0, rc[:, 1] + c0
    return np.column_stack([tr.c + (c + 0.5) * px_lon, tr.f + (r + 0.5) * px_lat])
for korak, z in ((100, 11), (50, 12), (20, 13)):
    for v in range(int(KROJ.min() // korak + 1) * korak, int(KROJ.max()) + 1, korak):
        if korak == 50 and v % 100 == 0: continue
        if korak == 20 and v % 50 == 0 and v % 100 != 0: pass
        if korak == 20 and v % 100 == 0: continue
        for cnt in find_contours(KROJ, v):
            if len(cnt) < 8: continue
            g = LineString(pix2ll(cnt)).simplify(0.00012)
            if g.length < 0.003: continue
            p = {"e": v, "i": 1 if v % 100 == 0 else 0}
            if v % 100 == 0: p["et"] = f"{v} m"  # natpis mora biti tekst
            # 100 m od z11; 50 m od z12; ostale (20, 40, 60, 80) od z13
            L["slojnice"].append((m(g), p, 11 if v % 100 == 0 else 12 if v % 50 == 0 else 13))
print("slojnice:", len(L["slojnice"]))


def sjencanje(z, x, y, vel=256):
    """Sjenčanje za pločicu: svjetlo sa sjeverozapada, prozirnost prema nagibu (ravno = prozirno)."""
    b = mercantile.bounds(x, y, z)
    lon = np.linspace(b.west, b.east, vel, endpoint=False) + (b.east - b.west) / vel / 2
    ty = np.linspace(0, 1, vel, endpoint=False) + 0.5 / vel
    mb = mercantile.xy_bounds(x, y, z)
    my = mb.top - ty * (mb.top - mb.bottom)
    lat = np.degrees(2 * np.arctan(np.exp(my / R)) - np.pi / 2)
    LON, LAT = np.meshgrid(lon, lat)
    cc = (LON - tr.c) / px_lon - 0.5; rr = (LAT - tr.f) / px_lat - 0.5
    h = map_coordinates(glatko, [rr, cc], order=1, mode="nearest")
    vani = (rr < 0) | (cc < 0) | (rr > glatko.shape[0] - 1) | (cc > glatko.shape[1] - 1)
    dx = (b.east - b.west) / vel * 111320 * math.cos(math.radians((b.north + b.south) / 2))
    dy = (b.north - b.south) / vel * 111320
    gy, gx = np.gradient(h, dy, dx)
    nagib = np.arctan(np.hypot(gx, gy)); aspekt = np.arctan2(-gx, gy)
    az, alt = math.radians(315), math.radians(45)
    sv = np.sin(alt) * np.cos(nagib) + np.cos(alt) * np.sin(nagib) * np.cos(az - aspekt)
    tama = np.clip((np.cos(np.radians(45)) - sv) / 0.9, 0, 1)  # 0 = ravno osvijetljeno, 1 = sjena
    svj = np.clip((sv - np.cos(np.radians(45))) / 0.4, 0, 1)
    a = np.clip(tama * 150 + svj * 60, 0, 170); a[vani] = 0; a = a.astype("uint8")
    rgb = np.where(tama[..., None] > 0, [40, 52, 46], [255, 255, 240]).astype("uint8")
    return Image.fromarray(np.dstack([rgb, a]), "RGBA")


# ---------------- pločice ----------------
# Rezanje ide od roditelja prema djeci: svaka pločica reže samo komade koje je dobila od roditelja,
# pa velike površine (šume) ne režemo iznova za svaku od tisuća pločica. Podstabla z10 rade paralelno.
POLY = {"pokrov", "voda", "zgrade", "zastita"}
OKVIR_M = box(*merc(np.array([[W, S], [E, N]])).ravel())


def okvir_pl(z, x, y, px=8):
    xb = mercantile.xy_bounds(x, y, z); sz = xb.right - xb.left; buf = sz * px / 256
    return xb, sz, (xb.left - buf, xb.bottom - buf, xb.right + buf, xb.top + buf)


def izreži(kandidati, okvir):
    out = []
    for ime, g, p, mz in kandidati:
        gc = shapely.clip_by_rect(g, *okvir)
        if not gc.is_empty: out.append((ime, gc, p, mz))
    return out


def ocisti(gc, poly):
    if gc.geom_type != "GeometryCollection": return gc
    parts = [q for q in gc.geoms if (q.geom_type.endswith("Polygon") if poly else q.geom_type.endswith("LineString"))]
    if not parts: return None
    return shapely.union_all(parts) if poly else shapely.line_merge(shapely.union_all(parts))


def zapisi(z, x, y, kandidati):
    xb, sz, _ = okvir_pl(z, x, y)
    tol = sz / 512; slojevi = defaultdict(list)
    for ime, g, p, mz in kandidati:
        if z < mz: continue
        if ime == "slojnice" and z >= 13 and p["e"] % 20: continue  # na z13+ samo svakih 20 m
        if ime in POLY and g.area < (sz / 256) ** 2 * (2 if z < 12 else 0.5): continue
        if z < 14 or ime in ("slojnice", "pokrov", "voda"): g = g.simplify(tol, preserve_topology=ime in POLY)
        if g.is_empty: continue
        g = ocisti(g, ime in POLY)
        if g is None or g.is_empty: continue
        pp = dict(p)
        if z < 13 and ime == "ceste": pp.pop("n", None)
        slojevi[ime].append({"geometry": g, "properties": pp})
    if not slojevi: return None
    data = mvt.encode([{"name": k, "features": v} for k, v in slojevi.items()],
                      default_options={"quantize_bounds": (xb.left, xb.bottom, xb.right, xb.top), "extents": 4096,
                                       "on_invalid_geometry": mvt.encoder.on_invalid_geometry_make_valid})
    d = os.path.join(OUT, "v", str(z), str(x)); os.makedirs(d, exist_ok=True)
    open(os.path.join(d, f"{y}.mvt"), "wb").write(data)
    return (f"v/{z}/{x}/{y}.mvt", len(data))


def stablo(z, x, y, kandidati):
    _, _, okv = okvir_pl(z, x, y)
    if not box(*okv).intersects(OKVIR_M): return []
    kand = izreži(kandidati, okv)
    rez = [r for r in [zapisi(z, x, y, kand)] if r]
    if z < ZMAX:
        for c in mercantile.children(mercantile.Tile(x, y, z)):
            rez += stablo(c.z, c.x, c.y, kand)
    return rez


def stablo_z10(t):
    """Podstablo od pločice z10: kandidati iz STRtree, pa rekurzivno do z14."""
    _, _, okv = okvir_pl(10, t[0], t[1])
    kand = []
    for ime, (tree, feats) in TREE.items():
        for i in tree.query(box(*okv)):
            g, p, mz = feats[i]
            kand.append((ime, g.boundary if ime == "zastita" else g, p, mz))
    return stablo(10, t[0], t[1], kand)


def sjencanje_pl(t):
    z, x, y = t
    d = os.path.join(OUT, "s", str(z), str(x)); os.makedirs(d, exist_ok=True)
    f = os.path.join(d, f"{y}.webp")
    sjencanje(z, x, y).save(f, "WEBP", quality=70, method=4)
    return (f"s/{z}/{x}/{y}.webp", os.path.getsize(f))


if os.path.exists(OUT): shutil.rmtree(OUT)
TREE = {k: (STRtree([g for g, _, _ in v]), v) for k, v in L.items()}
rezultat = []
for z in (8, 9):  # malo pločica: izravno
    for t in mercantile.tiles(W, S, E, N, z):
        _, _, okv = okvir_pl(z, t.x, t.y)
        kand = [(ime, feats[i][0].boundary if ime == "zastita" else feats[i][0], feats[i][1], feats[i][2])
                for ime, (tree, feats) in TREE.items() for i in tree.query(box(*okv))]
        r = zapisi(z, t.x, t.y, izreži(kand, okv))
        if r: rezultat.append(r)
from multiprocessing import Pool
with Pool(os.cpu_count()) as pool:
    for r in pool.imap_unordered(stablo_z10, [(t.x, t.y) for t in mercantile.tiles(W, S, E, N, 10)]):
        rezultat += r; print("vektor", len(rezultat), flush=True)
    rezultat += pool.map(sjencanje_pl, [(t.z, t.x, t.y) for z in range(ZMIN, ZSJ + 1) for t in mercantile.tiles(W, S, E, N, z)])
rezultat.sort()
popis = [r[0] for r in rezultat]; ukupno = sum(r[1] for r in rezultat)

json.dump({"verzija": 2, "okvir": [W, S, E, N], "z": [ZMIN, ZMAX], "sjencanje_z": ZSJ, "bajtova": ukupno, "plocice": popis,
           "izvor": "© OpenStreetMap suradnici (ODbL); zgrade dijelom: Microsoft Global ML Building Footprints (ODbL); teren: Copernicus DEM GLO-30 (© DLR e.V., © Airbus DS; Copernicus/EK)"},
          open(os.path.join(OUT, "popis.json"), "w", encoding="utf-8"), separators=(",", ":"))
print("gotovo:", len(popis), "pločica,", f"{ukupno / 1e6:.1f} MB")
