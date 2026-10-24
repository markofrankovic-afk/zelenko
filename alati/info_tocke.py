"""Praktični podaci za točke (blok „Informacije” u aplikaciji).

  python3 alati/info_tocke.py <docs_dir>

Spaja dva izvora u docs/data/info.json:
  1. izvori/info_rucno.json – glavna mjesta, sa službenih stranica (izvor i datum provjere uz svako mjesto),
  2. OSM oznake (izvori/osm_gk.json): opening_hours, fee, website, operator – za sve točke koje ih imaju.
Ručni podaci imaju prednost; OSM popunjava samo ono što fali i označen je kao izvor.
"""
import json, os, sys

BASE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
docs = sys.argv[1]
tocke = json.load(open(f"{docs}/data/tocke.json", encoding="utf-8"))["tocke"]
osm = {x["osm"]: x["oznake"] for x in json.load(open(f"{BASE}/izvori/osm_gk.json", encoding="utf-8"))["tocke"]}
rucno = json.load(open(f"{BASE}/izvori/info_rucno.json", encoding="utf-8"))["info"]

out = {}
for t in tocke:
    iz = t.get("izvor") or {}
    oz = osm.get(iz.get("osm") or "", {})
    i = {}
    if oz.get("opening_hours"): i["rv"] = oz["opening_hours"]
    if oz.get("fee") in ("yes", "no"): i["ulaz"] = "placa" if oz["fee"] == "yes" else "besplatno"
    if oz.get("website"):
        w = oz["website"].split(";")[0].strip()
        i["web"] = w if w.startswith("http") else "https://" + w
    if oz.get("operator"): i["upravitelj"] = oz["operator"]
    if i: i["izvor"] = "OpenStreetMap"
    r = rucno.get(t["id"])
    if r:
        osm_rv = i.get("rv") if "rv" not in r else None
        i = {**{k: v for k, v in i.items() if k not in ("izvor",)}, **r}
        if osm_rv: i["rv_izvor"] = "OpenStreetMap"
    if i: out[t["id"]] = i

json.dump(out, open(f"{docs}/data/info.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(len(out), "točaka s informacijama;", sum(1 for v in out.values() if v.get("rv")), "s radnim vremenom;",
      sum(1 for v in out.values() if v.get("provjereno")), "ručno provjerenih")
