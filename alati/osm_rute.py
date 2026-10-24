"""Trase ruta po OSM mreži putova (ODbL): najkraći put između stajališta, GPX i stvarna duljina.

  python3 alati/osm_rute.py <izvadak.osm.pbf> <tocke.json> <rute.json> <mapa za gpx>

Pješačke rute preferiraju staze i šumske ceste, biciklističke ceste. Visine nema u OSM-u:
uspon ostaje procjena dok se ne doda model terena.
"""
import json, math, sys, os
import numpy as np, networkx as nx, osmium

SRC, TOCKE, RUTE, GPXDIR = sys.argv[1:5]
os.makedirs(GPXDIR, exist_ok=True)
T = {t["id"]: t for t in json.load(open(TOCKE, encoding="utf-8"))["tocke"]}
RJ = json.load(open(RUTE, encoding="utf-8"))

def hav(a, b):
    r = math.pi / 180; x = math.sin((b[1] - a[1]) * r / 2) ** 2 + math.cos(a[1] * r) * math.cos(b[1] * r) * math.sin((b[0] - a[0]) * r / 2) ** 2
    return 2 * 6371000 * math.asin(math.sqrt(x))

# težine: manje = poželjnije
PJ = {"path": 1.0, "footway": 1.0, "bridleway": 1.0, "steps": 1.2, "track": 1.05, "service": 1.15, "unclassified": 1.2,
      "residential": 1.15, "living_street": 1.1, "pedestrian": 1.0, "tertiary": 1.5, "secondary": 2.5, "primary": 4.0, "cycleway": 1.1}
BI = {"track": 1.3, "service": 1.1, "unclassified": 1.0, "residential": 1.0, "living_street": 1.1, "tertiary": 1.0,
      "secondary": 1.3, "primary": 2.0, "cycleway": 0.9, "path": 2.5, "bridleway": 2.0}
VOZNO = {"track", "service", "unclassified", "residential", "living_street", "tertiary", "secondary", "primary"}
G = {"pj": nx.Graph(), "bi": nx.Graph()}
coords = {}
for w in osmium.FileProcessor(SRC, osmium.osm.NODE | osmium.osm.WAY).with_locations():
    if not w.is_way(): continue
    hw = w.tags.get("highway")
    if hw not in PJ and hw not in BI: continue
    if w.tags.get("access") in ("private", "no"): continue
    ns = [(n.ref, n.lon, n.lat) for n in w.nodes if n.location.valid()]
    for (a, ax, ay), (b, bx, by) in zip(ns, ns[1:]):
        coords[a] = (ax, ay); coords[b] = (bx, by)
        d = hav((ax, ay), (bx, by))
        for k, tb in (("pj", PJ), ("bi", BI)):
            if hw in tb: G[k].add_edge(a, b, w=d * tb[hw], d=d, hw=hw)
for k in G:
    G[k] = G[k].subgraph(max(nx.connected_components(G[k]), key=len)).copy()
    print(k, G[k].number_of_nodes(), "čvorova")
IDX = {k: (np.array(list(g.nodes)), np.array([coords[n] for n in g.nodes])) for k, g in G.items()}
def snap(k, lon, lat):
    ids, xy = IDX[k]
    d = (xy[:, 0] - lon) ** 2 * math.cos(math.radians(lat)) ** 2 + (xy[:, 1] - lat) ** 2
    i = int(d.argmin()); return int(ids[i]), math.sqrt(d[i]) * 111000

OBLIK = {"R01": "kruzna", "R02": "kruzna", "R03": "kruzna", "R04": "tamo_natrag", "R05": "tamo_natrag", "R06": "tamo_natrag",
         "R07": "tamo_natrag", "R08": "tamo_natrag_od_ceste", "R09": "tamo_natrag", "R10": "kruzna"}
for r in RJ["rute"]:
    k = "bi" if r["vrsta"] == "biciklisticka" else "pj"
    stops = [T[i] for i in r["tocke"]]
    nodes, snaps = [], []
    for s in stops:
        n, dist = snap(k, s["lon"], s["lat"]); nodes.append(n); snaps.append(round(dist))
    path = [nodes[0]]
    for a, b in zip(nodes, nodes[1:]):
        if a == b: continue
        path += nx.shortest_path(G[k], a, b, weight="w")[1:]
    oblik = OBLIK.get(r["id"], "tamo_natrag")
    if oblik == "tamo_natrag_od_ceste":
        # parking = zadnja točka do koje se može autom (prijelaz na stazu)
        cut = 0
        for i in range(len(path) - 1):
            if G[k][path[i]][path[i + 1]]["hw"] in VOZNO: cut = i + 1
        path = path[cut:] if cut < len(path) - 1 else path
    jedan = path[:]
    if oblik == "kruzna" and path[-1] != path[0]:
        path += nx.shortest_path(G[k], path[-1], path[0], weight="w")[1:]
    elif oblik.startswith("tamo_natrag"):
        path += path[-2::-1]
    xy = [coords[n] for n in path]
    m = sum(hav(a, b) for a, b in zip(xy, xy[1:]))
    # pojednostavi za prikaz (~5 m)
    from shapely.geometry import LineString
    simp = list(LineString(xy).simplify(0.00005).coords)
    r["trasa"] = [[round(x, 5), round(y, 5)] for x, y in simp]
    r["km_gpx"] = round(m / 1000, 1)
    r["oblik"] = oblik
    r["parking_tocka"] = [round(coords[path[0]][0], 5), round(coords[path[0]][1], 5)]
    r["izvor_trase"] = "OpenStreetMap (ODbL), izračunato po putovima i stazama; provjeriti na terenu"
    r["gpx"] = f"gpx/{r['id']}.gpx"
    r["napomena"] = "Duljina iz trase; trajanje i uspon su procjena dok ne dodamo visine."
    pts = "\n".join(f'   <trkpt lat="{y:.6f}" lon="{x:.6f}"/>' for x, y in xy)
    name = r["tekst"]["hr"]["naziv"]
    open(os.path.join(GPXDIR, f"{r['id']}.gpx"), "w", encoding="utf-8").write(
        f'<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="Gorski kotar vodič" xmlns="http://www.topografix.com/GPX/1/1">\n'
        f' <metadata><name>{name}</name><copyright author="OpenStreetMap suradnici"><license>https://opendatacommons.org/licenses/odbl/</license></copyright></metadata>\n'
        f' <trk><name>{name}</name><trkseg>\n{pts}\n </trkseg></trk>\n</gpx>\n')
    print(f"{r['id']} {name[:34]:34} procjena {r['km']:>4} km → trasa {r['km_gpx']:>5} km | {oblik} | odmak stajališta od puta (m): {snaps}")
json.dump(RJ, open(RUTE, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
