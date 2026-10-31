"""Visinski profil, uspon i spust za rute iz modela terena Copernicus DEM GLO-30.

  python3 alati/visine.py <docs_dir> <dem.tif> [<dem.tif> ...]

Za svaku rutu (data/rute.json i data/rute_bicikl.json): uzorkuje trasu svakih 20 m,
izgladi šum modela (DSM uključuje i krošnje), zbroji uspon i spust s pragom od 3 m
i spremi profil (do ~160 točaka) za graf u aplikaciji.
Za naše rute (R..) težina i trajanje ostaju ručni; za rute iz OSM-a (B..) računaju se
iz duljine i uspona (pješice: DAV formula; bicikl: brzina + uspon).

Copernicus DEM: © DLR e.V. 2010-2014 i © Airbus Defence and Space GmbH 2014-2018,
dobavlja Europska komisija (program Copernicus); dopuštena je i komercijalna upotreba uz navođenje.
"""
import json, math, sys
import numpy as np, rasterio

DOCS, DEMS = sys.argv[1], sys.argv[2:]
RAST = [rasterio.open(f) for f in DEMS]
POLJA = [(r, r.read(1), r.transform) for r in RAST]


def visina(lon, lat):
    for r, a, tr in POLJA:
        b = r.bounds
        if b.left <= lon < b.right and b.bottom <= lat < b.top:
            # bilinearno
            c, rr = ~tr * (lon, lat)
            c -= 0.5; rr -= 0.5
            c0, r0 = int(math.floor(c)), int(math.floor(rr)); fc, fr = c - c0, rr - r0
            c0 = max(0, min(a.shape[1] - 2, c0)); r0 = max(0, min(a.shape[0] - 2, r0))
            v = (a[r0, c0] * (1 - fc) * (1 - fr) + a[r0, c0 + 1] * fc * (1 - fr) + a[r0 + 1, c0] * (1 - fc) * fr + a[r0 + 1, c0 + 1] * fc * fr)
            return float(v)
    return None


def hav(a, b):
    r = math.pi / 180; x = math.sin((b[1] - a[1]) * r / 2) ** 2 + math.cos(a[1] * r) * math.cos(b[1] * r) * math.sin((b[0] - a[0]) * r / 2) ** 2
    return 2 * 6371000 * math.asin(math.sqrt(x))


def uzorci(dijelovi, korak=20.0):
    """točke svakih `korak` m duž trase (dijelovi se nastavljaju; skok među njima ne broji uspon)"""
    out, s = [], 0.0
    for di, d in enumerate(dijelovi):
        if len(d) < 2: continue
        if out and di: out.append(None)  # prekid
        out.append((s, d[0]))
        ost = 0.0
        for a, b in zip(d, d[1:]):
            L = hav(a, b)
            t = korak - ost
            while t <= L:
                f = t / L; out.append((s + t, (a[0] + f * (b[0] - a[0]), a[1] + f * (b[1] - a[1]))))
                t += korak
            ost = L - (t - korak); s += L
        out.append((s, d[-1]))
    return out


def profil(dijelovi):
    pts = uzorci(dijelovi)
    segs, cur = [], []
    for p in pts:
        if p is None:
            if cur: segs.append(cur); cur = []
            continue
        v = visina(*p[1])
        if v is not None: cur.append((p[0], v))
    if cur: segs.append(cur)
    up = down = 0.0; sve = []
    for seg in segs:
        z = np.array([v for _, v in seg])
        if len(z) >= 5:  # izglađivanje: medijan pa pomični prosjek (krošnje, šum)
            k = 2; zm = np.array([np.median(z[max(0, i - k):i + k + 1]) for i in range(len(z))])
            z = np.convolve(np.pad(zm, 2, mode="edge"), np.ones(5) / 5, mode="valid")
        ref = z[0]
        for v in z[1:]:
            if v - ref >= 3: up += v - ref; ref = v
            elif ref - v >= 3: down += ref - v; ref = v
        sve += [(d, float(v)) for (d, _), v in zip(seg, z)]
    if not sve: return None
    n = len(sve); krok = max(1, n // 160)
    pr = [[round(d / 1000, 2), round(v)] for d, v in sve[::krok]]
    if pr[-1][0] != round(sve[-1][0] / 1000, 2): pr.append([round(sve[-1][0] / 1000, 2), round(sve[-1][1])])
    vis = [v for _, v in sve]
    return {"uspon": round(up), "spust": round(down), "min": round(min(vis)), "max": round(max(vis)), "profil": pr}


def sati_raspon(h):
    lo, hi = max(0.5, round(h * 0.85 * 2) / 2), max(1, round(h * 1.15 * 2) / 2)
    f = lambda x: (f"{x:.1f}".rstrip("0").rstrip(".")).replace(".", ",")
    return f(lo) if lo == hi else f"{f(lo)}–{f(hi)}"


for ime in ("rute.json", "rute_bicikl.json"):
    p = f"{DOCS}/data/{ime}"
    d = json.load(open(p, encoding="utf-8"))
    for r in d["rute"]:
        dij = r.get("trasa_dijelovi") or ([r["trasa"]] if r.get("trasa") else None)
        if not dij: continue
        v = profil(dij)
        if not v: continue
        r["uspon_m"] = v["uspon"]
        r["visina"] = {"spust": v["spust"], "min": v["min"], "max": v["max"], "profil": v["profil"],
                       "izvor": "Copernicus DEM GLO-30 (© DLR e.V., © Airbus DS; Copernicus/EK)"}
        if r["id"].startswith("B"):
            km = r.get("km_gpx") or r["km"]
            mtb = r.get("bicikl") == "mtb"
            h = km / (10 if mtb else 16) + v["uspon"] / (450 if mtb else 600)
            r["sati"] = sati_raspon(h)
            if mtb: r["tezina"] = "srednje" if v["uspon"] < 500 and km < 25 else "zahtjevno"
            else: r["tezina"] = "lagano" if v["uspon"] < 300 and km < 25 else "zahtjevno" if v["uspon"] > 900 or km > 60 else "srednje"
            r["napomena"] = "Duljina iz OSM trase, uspon iz modela terena (Copernicus DEM); trajanje je procjena."
        else:
            r["napomena"] = "Duljina iz OSM trase, uspon i profil iz modela terena (Copernicus DEM); trajanje je procjena."
        print(f"  {r['id']:10} {r.get('km_gpx') or r['km']:6} km  ↑{v['uspon']:5} ↓{v['spust']:5}  {v['min']}–{v['max']} m  {r['sati']:8} {r['tezina']:9} {r['tekst']['hr']['naziv'][:45]}")
    json.dump(d, open(p, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":") if ime == "rute_bicikl.json" else None, indent=None if ime == "rute_bicikl.json" else 1)
