"""Skida sve Wikidata stavke s koordinatama u području Gorskog kotara (CC0)."""
import json, urllib.parse, urllib.request, sys
Q = """
SELECT ?item ?itemLabel ?enLabel ?deLabel ?coord ?tip ?tipLabel ?hrwiki ?commons ?visina ?drzava ?slika ?opisHr WHERE {
  SERVICE wikibase:box {
    ?item wdt:P625 ?coord .
    bd:serviceParam wikibase:cornerSouthWest "Point(14.50 45.10)"^^geo:wktLiteral .
    bd:serviceParam wikibase:cornerNorthEast "Point(15.25 45.65)"^^geo:wktLiteral .
  }
  OPTIONAL { ?item wdt:P31 ?tip . }
  OPTIONAL { ?item rdfs:label ?enLabel FILTER(lang(?enLabel)="en") }
  OPTIONAL { ?item rdfs:label ?deLabel FILTER(lang(?deLabel)="de") }
  OPTIONAL { ?hrwiki schema:about ?item ; schema:isPartOf <https://hr.wikipedia.org/> . }
  OPTIONAL { ?item wdt:P373 ?commons . }
  OPTIONAL { ?item wdt:P17 ?drzava . }
  OPTIONAL { ?item wdt:P18 ?slika . }
  OPTIONAL { ?item schema:description ?opisHr FILTER(lang(?opisHr)="hr") }
  OPTIONAL { ?item wdt:P2044 ?visina . }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "hr,en,de,sl" . }
}"""
url = "https://query.wikidata.org/sparql?" + urllib.parse.urlencode({"query": Q, "format": "json"})
req = urllib.request.Request(url, headers={"User-Agent": "GK-vodic-faza1/0.1 (marko.frankovic@gmail.com)"})
rows = json.load(urllib.request.urlopen(req, timeout=120))["results"]["bindings"]
out = {}
for r in rows:
    qid = r["item"]["value"].rsplit("/", 1)[1]
    lon, lat = map(float, r["coord"]["value"][6:-1].split())
    d = out.setdefault(qid, {"qid": qid, "hr": r.get("itemLabel", {}).get("value"),
        "en": r.get("enLabel", {}).get("value"), "de": r.get("deLabel", {}).get("value"),
        "lat": round(lat, 6), "lon": round(lon, 6), "tipovi": [],
        "hrwiki": r.get("hrwiki", {}).get("value"), "commons": r.get("commons", {}).get("value"),
        "visina": r.get("visina", {}).get("value"), "slika": r.get("slika", {}).get("value"), "opis_wd": r.get("opisHr", {}).get("value"), "drzava": []})
    dz = r.get("drzava", {}).get("value")
    if dz and dz.rsplit("/",1)[1] not in d["drzava"]: d["drzava"].append(dz.rsplit("/",1)[1])
    t = r.get("tipLabel", {}).get("value")
    if t and t not in d["tipovi"]: d["tipovi"].append(t)
json.dump(list(out.values()), open(sys.argv[1], "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(len(out), "stavki")
