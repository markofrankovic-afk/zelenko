"""Za svaku točku traži Wikidata stavku (CC0) po imenu i blizini; upisuje QID i koordinate."""
import json, math, re, sys, time, urllib.parse, urllib.request
sys.path.insert(0, __file__.rsplit("/", 1)[0])
from gk_poligon import unutra
UA = {"User-Agent": "GK-vodic-faza1/0.1 (marko.frankovic@gmail.com)"}
API = "https://www.wikidata.org/w/api.php?"
def get(params):
    return json.load(urllib.request.urlopen(urllib.request.Request(API + urllib.parse.urlencode(params), headers=UA), timeout=60))
def dist(a,b,c,d):
    p1,p2=math.radians(a),math.radians(c); h=math.sin((p2-p1)/2)**2+math.cos(p1)*math.cos(p2)*math.sin(math.radians(d-b)/2)**2
    return 2*6371000*math.asin(math.sqrt(h))
lokalno = json.load(open("izvori/wikidata_podrucje.json")) + json.load(open("izvori/wikidata_gk.json"))
po_qid = {x["qid"]: x for x in lokalno}
def kandidati(pojam):
    q = set()
    for jez in ("hr", "en"):
        r = get({"action":"wbsearchentities","search":pojam,"language":jez,"limit":15,"format":"json"})
        q |= {s["id"] for s in r.get("search", [])}
    q -= set(po_qid)
    if q:
        r = get({"action":"wbgetentities","ids":"|".join(list(q)[:50]),"props":"claims|labels|sitelinks","format":"json"})
        for qid, e in r.get("entities", {}).items():
            c = e.get("claims", {}).get("P625")
            if not c: continue
            v = c[0]["mainsnak"].get("datavalue", {}).get("value")
            if not v: continue
            po_qid[qid] = {"qid": qid, "hr": e.get("labels", {}).get("hr", {}).get("value") or e.get("labels", {}).get("en", {}).get("value"),
                           "lat": round(v["latitude"], 6), "lon": round(v["longitude"], 6),
                           "hrwiki": "hrwiki" in e.get("sitelinks", {}), "tipovi": []}
baza = json.load(open("data/tocke.json"))
RAD = {"V": 1500, "S": 4000, "N": 7000}
for t in baza["tocke"]:
    naziv = t["tekst"]["hr"]["naziv"]
    pojmovi = [p.strip("^$") for p in t["osm_trazi"].split("|")]
    for p in pojmovi:
        try: kandidati(p)
        except Exception as e: print("greška", p, e)
        time.sleep(0.3)
    best = None
    for x in po_qid.values():
        if not x.get("hr") or not unutra(x["lon"], x["lat"]): continue
        ime = x["hr"].lower()
        if not any((ime == p.lower()) if t["osm_trazi"].startswith("^") else (p.lower() in ime) for p in pojmovi): continue
        d = dist(t["lat"], t["lon"], x["lat"], x["lon"])
        if d <= RAD[t["pouzdanost"]] and (best is None or d < best[0]): best = (d, x)
    if best:
        d, x = best
        t["wd_kandidat"] = {"qid": x["qid"], "naziv": x["hr"], "lat": x["lat"], "lon": x["lon"], "pomak_m": round(d), "tipovi": x.get("tipovi", [])}
        print(f'{t["id"]:4} {naziv[:34]:34} -> {x["qid"]:11} {x["hr"][:40]:40} {round(d):5} m')
    else:
        print(f'{t["id"]:4} {naziv[:34]:34} -> —')
json.dump(baza, open("data/tocke_wd.json", "w"), ensure_ascii=False, indent=1)
