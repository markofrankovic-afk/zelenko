"""Fotografije s Wikimedia Commonsa za točke na karti: traženje, provjera licence, priprema.

Upotreba: python3 commons_slike.py <docs_dir> <izvorne_tocke.json> <osm_gk.json>

Izvori fotografije za točku, redom prednosti:
  1. slika (P18) s Wikidata stavke točke (ručni popis ili OSM oznaka wikidata),
  2. fotografije s Commonsa snimljene u blizini (geooznaka) čiji naziv sadrži ime točke.
     Ime mjesta samo po sebi ne vrijedi (fotografija sela nije fotografija crkve u selu).
Licenca: samo ono što dopušta komercijalnu upotrebu: javno dobro, CC0, CC BY, CC BY-SA.
Odbija NC, ND, fair use i samo-GFDL. Autor i licenca spremaju se uz svaku sliku.
Rezultat: docs/slike/<datoteka>.webp (720 px) i docs/data/slike.json.
"""
import json, re, sys, io, os, time, html, math, unicodedata, urllib.parse, urllib.request
from concurrent.futures import ThreadPoolExecutor
from PIL import Image

UA = {"User-Agent": "GorskiKotarVodic/0.3 (https://github.com/markofrankovic-afk; marko.frankovic@gmail.com) python-urllib/3"}
API = "https://commons.wikimedia.org/w/api.php"
SIRINA = 720
CACHE = "/tmp/claude-0/-home-claude/59acbbd8-2078-53fe-a99d-cb1b163ccd71/scratchpad/commons_cache.json"
# ručni popis: slika s Wikidate ne prikazuje baš tu točku
PRESKOCI = {"V06", "S01", "S04", "S07", "B02"}
# ručno pregledano: fotografija iz okolice prikazuje nešto drugo (tunel, susjedni vrh, dvorac umjesto rijeke)
ODBACI = {"On11653879228", "On3693176057", "On3724313174", "On8207139324", "V06"}
OPCE = set("""crkva crkvica kapela kapelica sv sveti svetog svete svetoga svetih sv. hram manastir zupna župna
vrh vrhovi veliki velika veliko mali mala malo gornji donji gornja donja stari stara novi nova
jezero slap izvor vrelo spilja špilja jama rijeka potok most park suma šuma dom kuca kuća planinarski
spomenik spomen ploca ploča groblje kriz križ kula toranj dvorac kastel kaštel grad gradina
the of and di de na u od do za kod pri ob in im am church chapel lake mountain peak hill view pogled
panoramio croatia hrvatska gorski kotar jpg jpeg png""".split())
LOSE = re.compile(r"\b(map|karta|location|lokacija|grb|coat of arms|logo|wappen|plan|diagram|scheme)\b", re.I)


def get(url, tries=4):
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
                return r.read()
        except urllib.error.HTTPError as e:
            if e.code in (429, 503) and i < tries - 1:
                time.sleep(int(e.headers.get("Retry-After") or 0) or 20 * (i + 1)); continue
            raise


def api(**p):
    p.update(format="json", formatversion="2")
    return json.loads(get(API + "?" + urllib.parse.urlencode(p)))


def norm(s):
    s = unicodedata.normalize("NFKD", (s or "").lower())
    s = "".join(c for c in s if not unicodedata.combining(c)).replace("đ", "d")
    return re.findall(r"[a-z]+", s)


def cist(t):
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", t or ""))).strip()


def dopustena(lic):
    l = (lic or "").lower().replace("-", " ")
    if not l or re.search(r"\bnc\b|\bnd\b|fair use|non commercial|noncommercial", l):
        return False
    return l.startswith(("cc0", "public domain", "pd", "cc by", "no restrictions", "attribution"))


II = dict(prop="imageinfo", iiprop="extmetadata|url|size|mime", iiurlwidth="960",
          iiextmetadatafilter="LicenseShortName|LicenseUrl|Artist|Credit")


def info(p):
    ii = (p.get("imageinfo") or [{}])[0]; em = ii.get("extmetadata", {})
    v = lambda k: (em.get(k) or {}).get("value")
    return {"naslov": p["title"][5:], "licenca": cist(v("LicenseShortName")), "licenca_url": v("LicenseUrl"),
            "autor": cist(v("Artist")) or cist(v("Credit")), "thumb": ii.get("thumburl"), "izvor": ii.get("descriptionurl"),
            "mime": ii.get("mime"), "w": ii.get("width"), "h": ii.get("height")}


def geo(lat, lon, r):
    """Geopretraga Commonsa preko Wikidata servisa za upite (Commons API izravno jako ograničava brzinu)."""
    out = {n: f"?{n} wikibase:apiOutput \"imageinfo/ii/{x}\"." for n, x in [
        ("lic", "extmetadata/LicenseShortName/@value"), ("licurl", "extmetadata/LicenseUrl/@value"),
        ("artist", "extmetadata/Artist/@value"), ("credit", "extmetadata/Credit/@value"), ("thumb", "@thumburl"),
        ("izv", "@descriptionurl"), ("mime", "@mime"), ("w", "@width"), ("h", "@height")]}
    sp = f"""SELECT ?title {' '.join('?' + n for n in out)} WHERE {{ SERVICE wikibase:mwapi {{
      bd:serviceParam wikibase:api "Generator"; wikibase:endpoint "commons.wikimedia.org";
      mwapi:generator "geosearch"; mwapi:ggscoord "{lat}|{lon}"; mwapi:ggsradius "{r}"; mwapi:ggsnamespace "6"; mwapi:ggslimit "50";
      mwapi:prop "imageinfo"; mwapi:iiprop "extmetadata|url|size|mime"; mwapi:iiurlwidth "960";
      mwapi:iiextmetadatafilter "LicenseShortName|LicenseUrl|Artist|Credit".
      ?title wikibase:apiOutput mwapi:title. {' '.join(out.values())} }} }}"""
    d = json.loads(get("https://query.wikidata.org/sparql?" + urllib.parse.urlencode({"query": sp, "format": "json"})))
    v = lambda b, k: (b.get(k) or {}).get("value")
    rez = {}
    for b in d["results"]["bindings"]:
        rez[v(b, "title")] = {"naslov": v(b, "title")[5:], "licenca": cist(v(b, "lic")), "licenca_url": v(b, "licurl"),
            "autor": cist(v(b, "artist")) or cist(v(b, "credit")), "thumb": v(b, "thumb"), "izvor": v(b, "izv"),
            "mime": v(b, "mime"), "w": int(v(b, "w") or 0), "h": int(v(b, "h") or 0)}
    return list(rez.values())


def po_naslovu(naslovi):
    out = {}
    for i in range(0, len(naslovi), 40):
        d = api(action="query", titles="|".join("File:" + n for n in naslovi[i:i + 40]), **II)
        for p in d["query"]["pages"]:
            if "imageinfo" in p: out[p["title"][5:]] = info(p)
        time.sleep(0.5)
    return out


def p18(qids):
    vals = " ".join("wd:" + q for q in qids)
    s = f"SELECT ?q ?img WHERE {{ VALUES ?q {{ {vals} }} ?q wdt:P18 ?img }}"
    d = json.loads(get("https://query.wikidata.org/sparql?" + urllib.parse.urlencode({"query": s, "format": "json"})))
    out = {}
    for b in d["results"]["bindings"]:
        out.setdefault(b["q"]["value"].rsplit("/", 1)[1], urllib.parse.unquote(b["img"]["value"].split("FilePath/")[1]).replace("_", " "))
    return out


def main(docs, izvorne, osm_path):
    tocke = json.load(open(f"{docs}/data/tocke.json"))["tocke"]
    izv = {t["id"]: t for t in json.load(open(izvorne))["tocke"]}
    osm = json.load(open(osm_path))
    imena = {x["osm"]: x["oznake"] for x in osm["tocke"]}
    mjesta = {w for m in osm.get("mjesta", []) for w in norm(m.get("ime") or "")}
    cache = json.load(open(CACHE)) if os.path.exists(CACHE) else {}

    kand = []
    for t in tocke:
        if t["kategorija"] == "prakticno": continue
        oz = imena.get((t["izvor"] or {}).get("osm"), {}) if t["id"].startswith("O") else {}
        if t["id"].startswith("O") and not oz.get("name"): continue
        kand.append((t, oz))
    print("kandidata", len(kand), flush=True)

    # 1) Wikidata P18
    qid = {}
    for t, oz in kand:
        q = (izv.get(t["id"], {}).get("izvor") or {}).get("wikidata") or oz.get("wikidata") or (t["izvor"] or {}).get("wikidata")
        if q and t["id"] not in PRESKOCI: qid[t["id"]] = q
    slika_q = p18(sorted(set(qid.values())))
    zelja = {tid: slika_q[q] for tid, q in qid.items() if q in slika_q}
    meta = po_naslovu(sorted(set(zelja.values())))
    print("P18:", len(zelja))

    # 2) geooznačene fotografije u blizini, s imenom točke u nazivu datoteke
    def trazi(tp):
        t, oz = tp
        if t["id"] in zelja: return t["id"], None
        k = f'{t["id"]}'
        if k not in cache:
            r = 1500 if t["kategorija"] == "planina" else 800
            try: cache[k] = geo(t["lat"], t["lon"], r)
            except Exception as e: print("greška", k, e, flush=True); return t["id"], None
            if len(cache) % 25 == 0:
                json.dump(cache, open(CACHE, "w")); print("pretraženo", len(cache), flush=True)
            time.sleep(0.4)
        naziv = t["tekst"]["hr"]["naziv"].split(",")[0]
        naziv = re.sub(r"\(.*?\)", "", naziv)
        tok = [w for w in norm(naziv) if len(w) >= 4 and w not in OPCE]
        if t["podvrsta"] != "naselje" and not t["id"].startswith("H"):
            tok = [w for w in tok if w not in mjesta] or ([] if not tok else [])
        if not tok: return t["id"], None
        bolji = []
        for f in cache[k]:
            if not f.get("thumb") or f.get("mime") not in ("image/jpeg", "image/png", "image/webp"): continue
            if LOSE.search(f["naslov"]): continue
            fn = set(norm(f["naslov"]))
            pog = sum(1 for w in tok if any(x.startswith(w[:5]) for x in fn))
            if pog == 0 or pog < min(2, len(tok)): continue
            if not dopustena(f["licenca"]): continue
            bolji.append((-(pog), -(f.get("w") or 0) * (1 if (f.get("w") or 0) >= (f.get("h") or 0) else 0.6), f))
        if not bolji: return t["id"], None
        bolji.sort(key=lambda x: x[:2])
        return t["id"], bolji[0][2]

    nadeno = dict(map(trazi, kand))
    json.dump(cache, open(CACHE, "w"))

    izbor = {}
    for tid, ime in zelja.items():
        m = meta.get(ime)
        if m and dopustena(m["licenca"]) and m.get("thumb"): izbor[tid] = m
        elif m: print("  ODBIJENO", tid, ime, m["licenca"])
    for tid, f in nadeno.items():
        if f and tid not in izbor and tid not in ODBACI: izbor[tid] = f
    print("odabrano", len(izbor))

    # Slike se NE preuzimaju odavde (Wikimedia ograničava automatsko skidanje): aplikacija ih učitava
    # izravno s upload.wikimedia.org (standardna sličica 500 px) i sprema za rad bez signala.
    # Ako lokalna kopija u docs/slike već postoji, koristi se ona.
    rez = {}
    for tid, m in sorted(izbor.items()):
        url = m["thumb"].replace("thumb.wikimedia.org", "upload.wikimedia.org").split("?")[0]
        url = re.sub(r"/\d+px-", "/500px-", url)
        dat = re.sub(r"[^a-z0-9]+", "-", "-".join(norm(os.path.splitext(m["naslov"])[0])))[:70].strip("-") + ".webp"
        lok = f"slike/{dat}" if os.path.exists(f"{docs}/slike/{dat}") else None
        rez[tid] = {"url": url, "datoteka": lok, "autor": m["autor"] or "nepoznat autor", "licenca": m["licenca"],
                    "licenca_url": m["licenca_url"], "izvor": m["izvor"], "naslov": m["naslov"]}
    json.dump(rez, open(f"{docs}/data/slike.json", "w"), ensure_ascii=False, indent=1)
    print(f"gotovo: {len(rez)} točaka, {len({r['naslov'] for r in rez.values()})} fotografija, lokalno {sum(1 for r in rez.values() if r['datoteka'])}")


if __name__ == "__main__":
    main(*sys.argv[1:4])
