"""Prijevodi naših tekstova u podatke aplikacije (izvori/prijevod_<jezik>.json → docs/data).

  python3 alati/prevedi.py <docs_dir> [en]

Dodaje tekst.<jezik> točkama, rutama i stanju/idejama u data/danas.json, a podatke bez
„tekst” strukture (specijaliteti, Lynx, informacije, polazišta) dopunjuje poljem "<jezik>".
OSM točke i biciklističke rute svoj engleski opis dobivaju već u spoji_osm.py i osm_bike_rute.py.
Pokreće se nakon svih ostalih alata (info_tocke.py, osm_rute.py, visine.py).
"""
import json, os, sys
docs = sys.argv[1]; J = sys.argv[2] if len(sys.argv) > 2 else "en"
BASE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
P = json.load(open(f"{BASE}/izvori/prijevod_{J}.json", encoding="utf-8"))
ld = lambda f: json.load(open(f"{docs}/data/{f}", encoding="utf-8"))
def sp(f, d, kompakt=False): json.dump(d, open(f"{docs}/data/{f}", "w", encoding="utf-8"), ensure_ascii=False, **({"separators": (",", ":")} if kompakt else {"indent": 1}))

d = ld("tocke.json"); n = 0
for t in d["tocke"]:
    tr = P["tocke"].get(t["id"])
    if tr: t["tekst"][J] = {"naziv": tr[0] or t["tekst"]["hr"]["naziv"], "opis": tr[1]}; n += 1
sp("tocke.json", d, True); print("točke:", n)

d = ld("rute.json")
for r in d["rute"]:
    tr = P["rute"].get(r["id"])
    if tr: r["tekst"][J] = {"naziv": tr[0], "opis": tr[1], "parking": tr[2]}
    for pz in r.get("polazista", []):
        pz[J] = {"naziv": P["polazista"].get(pz["naziv"], pz["naziv"]), "vrijeme": P["polazista"].get(pz["vrijeme"], pz["vrijeme"])}
sp("rute.json", d)

d = ld("specijaliteti.json")
for x in d["specijaliteti"]:
    if x["id"] in P["specijaliteti"]: x[J] = P["specijaliteti"][x["id"]]
sp("specijaliteti.json", d)

d = ld("lynx.json")
for c in d["cinjenice"]:
    if c["id"] in P["lynx"]: c[J] = {"tekst": P["lynx"][c["id"]]}
sp("lynx.json", d)

d = ld("info.json")
for k, v in d.items():
    if k in P["info"]: v[J] = P["info"][k]
sp("info.json", d)

d = ld("danas.json")
for s in d.get("stanje", []):
    tr = P["danas"]["stanje"].get(s["id"])
    if tr: s["tekst"][J] = {"naslov": tr[0], "opis": tr[1]}
for i in d.get("ideje", []):
    tr = P["danas"]["ideje"].get(i["ref"])
    if tr: i["tekst"][J] = {"oznaka": tr[0], "naslov": tr[1], "opis": tr[2]}
sp("danas.json", d)
print("gotovo:", J)
