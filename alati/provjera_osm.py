"""Provjera i dopuna točaka iz OpenStreetMapa (Overpass API, licenca ODbL).

Treba pristup domeni overpass-api.de.

  python3 alati/provjera_osm.py provjeri   # za svaku točku traži OSM objekt po imenu i blizini
  python3 alati/provjera_osm.py dopuni     # skuplja kandidate (vrhovi, izvori, slapovi, špilje,
                                           # vidikovci, domovi, baština) za popunu do 100–150

Rezultat:
  data/tocke.json         – upisuje osm_id, točne koordinate, pomak u metrima i status
  data/kandidati_osm.json – kandidati za ručni odabir (dopuni)
Ništa se ne briše; točke bez pogotka ostaju "za provjeru".
"""
import json, math, os, re, sys, time, unicodedata, urllib.parse, urllib.request

OVERPASS = "https://overpass-api.de/api/interpreter"
BBOX = (45.10, 14.50, 45.65, 15.25)  # j, z, s, i – Gorski kotar s rubom
UA = "GK-vodic-faza1/0.1 (marko.frankovic@gmail.com)"
OSNOVA = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data")
RADIJUS = {"V": 1000, "S": 3000, "N": 8000}  # metara, prema pouzdanosti


def overpass(q, pokusaj=3):
    data = urllib.parse.urlencode({"data": q}).encode()
    for i in range(pokusaj):
        try:
            req = urllib.request.Request(OVERPASS, data=data, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=120) as r:
                return json.load(r)["elements"]
        except Exception as e:  # 429 / 504 – pričekaj i ponovi
            print("  Overpass greška:", e, "– ponavljam", file=sys.stderr)
            time.sleep(10 * (i + 1))
    return []


def norm(s):
    s = unicodedata.normalize("NFKD", s.lower())
    s = "".join(c for c in s if not unicodedata.combining(c))
    return re.sub(r"[^a-z0-9 ]", " ", s).split()


def kljucna_rijec(naziv):
    """'Veliki Risnjak (1528 m)' -> 'Risnjak'; 'Dvorac Zrinskih, Čabar' -> 'Zrinskih'."""
    n = re.sub(r"\(.*?\)", "", naziv).split(",")[0].split("–")[0]
    opce = {"jezero", "izvor", "slap", "spilja", "park", "suma", "staza", "poucna", "setnica",
            "dvorac", "kastel", "manastir", "kupa", "u", "na", "kod", "do", "oko", "veliki", "np",
            "ulaz", "rijeka", "polaziste", "dom", "ce", "i"}
    rijeci = [w for w in norm(n) if w not in opce and len(w) > 2]
    return max(rijeci, key=len) if rijeci else (norm(n) or [""])[0]


def udaljenost(a, b, c, d):
    r = 6371000
    p1, p2 = math.radians(a), math.radians(c)
    dp, dl = p2 - p1, math.radians(d - b)
    h = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(h))


def sredina(el):
    if "lat" in el:
        return el["lat"], el["lon"]
    c = el.get("center") or {}
    return c.get("lat"), c.get("lon")


def provjeri():
    put = os.path.join(OSNOVA, "tocke.json")
    baza = json.load(open(put, encoding="utf-8"))
    for t in baza["tocke"]:
        if t["izvor"].get("osm_id"):
            continue
        naziv = t["tekst"]["hr"]["naziv"]
        kr = t.get("osm_trazi") or kljucna_rijec(naziv)
        rad = RADIJUS[t["pouzdanost"]]
        q = (f'[out:json][timeout:60];nwr(around:{rad},{t["lat"]},{t["lon"]})'
             f'["name"~"{kr}",i];out center tags;')
        el = overpass(q)
        najbolji = None
        for e in el:
            la, lo = sredina(e)
            if la is None:
                continue
            d = udaljenost(t["lat"], t["lon"], la, lo)
            ocjena = d
            if "place" in e.get("tags", {}) and t["podvrsta"] != "naselje":
                ocjena += 2000  # za prirodne točke radije objekt nego naselje istog imena
            if najbolji is None or ocjena < najbolji[0]:
                najbolji = (ocjena, e, la, lo, d)
        if najbolji:
            _, e, la, lo, d = najbolji
            t["izvor"].update({
                "osm_id": f'{e["type"]}/{e["id"]}',
                "osm_naziv": e.get("tags", {}).get("name"),
                "wikidata": e.get("tags", {}).get("wikidata"),
                "koordinate": "OpenStreetMap (ODbL)",
            })
            t["pomak_m"] = round(d)
            t["lat"], t["lon"] = round(la, 6), round(lo, 6)
            t["status"] = "OSM pronađen – pogledati" if d > 500 else "OSM pronađen"
            print(f'{t["id"]} {naziv}: {e.get("tags",{}).get("name")} ({round(d)} m)')
        else:
            print(f'{t["id"]} {naziv}: nema pogotka za "{kr}"')
        time.sleep(1.5)  # pristojno prema javnom poslužitelju
    json.dump(baza, open(put, "w", encoding="utf-8"), ensure_ascii=False, indent=1)


UPITI = {
    "planina": ['node["natural"="peak"]["name"]', 'nwr["tourism"="viewpoint"]',
                'nwr["tourism"="alpine_hut"]', 'nwr["tourism"="wilderness_hut"]'],
    "voda": ['nwr["waterway"="waterfall"]', 'node["natural"="spring"]["name"]',
             'nwr["natural"="water"]["name"]'],
    "spilja": ['node["natural"="cave_entrance"]'],
    "bastina": ['nwr["historic"]["name"]', 'nwr["amenity"="place_of_worship"]["name"]',
                'nwr["tourism"="museum"]'],
    "zasticeno": ['nwr["boundary"="protected_area"]["name"]', 'nwr["leisure"="nature_reserve"]["name"]'],
    "staza": ['relation["route"="hiking"]["name"]'],
    "bicikl": ['relation["route"~"bicycle|mtb"]["name"]'],
}


def dopuni():
    s, z, n, i = BBOX
    postojece = json.load(open(os.path.join(OSNOVA, "tocke.json"), encoding="utf-8"))["tocke"]
    zauzeto = {t["izvor"].get("osm_id") for t in postojece}
    kandidati = []
    for kat, filtri in UPITI.items():
        tijelo = "".join(f"{f}({s},{z},{n},{i});" for f in filtri)
        el = overpass(f"[out:json][timeout:120];({tijelo});out center tags;")
        for e in el:
            oid = f'{e["type"]}/{e["id"]}'
            la, lo = sredina(e)
            if oid in zauzeto or la is None:
                continue
            tg = e.get("tags", {})
            kandidati.append({
                "kategorija": kat, "osm_id": oid, "naziv": tg.get("name", "(bez imena)"),
                "lat": round(la, 6), "lon": round(lo, 6),
                "oznake": {k: v for k, v in tg.items() if k in (
                    "natural", "tourism", "historic", "waterway", "ele", "wikidata",
                    "wikipedia", "route", "operator", "religion", "protect_class")},
                "licenca": "ODbL – © OpenStreetMap suradnici",
            })
        print(kat, len(el))
        time.sleep(5)
    json.dump(kandidati, open(os.path.join(OSNOVA, "kandidati_osm.json"), "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)
    print(len(kandidati), "kandidata u data/kandidati_osm.json")


if __name__ == "__main__":
    {"provjeri": provjeri, "dopuni": dopuni}.get(sys.argv[1] if len(sys.argv) > 1 else "", lambda: print(__doc__))()
