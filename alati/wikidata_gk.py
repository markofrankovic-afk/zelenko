"""Wikidata stavke (CC0) unutar 9 goranskih gradova/općina, s tipom, visinom, hr Wikipedijom i Commons kategorijom."""
import json, urllib.parse, urllib.request, sys
JLS = ["Čabar","Delnice","Vrbovsko","Brod Moravice","Fužine","Lokve","Mrkopalj","Ravna Gora","Skrad"]
vals = " ".join(f'"{n}"@hr' for n in JLS)
Q = f"""
SELECT ?item ?itemLabel ?enLabel ?deLabel ?coord ?tipLabel ?jlsLabel ?hrwiki ?commons ?visina ?slika WHERE {{
  VALUES ?ime {{ {vals} }}
  ?jls rdfs:label ?ime ; wdt:P17 wd:Q224 .
  ?jls wdt:P31/wdt:P279* ?jt . VALUES ?jt {{ wd:Q15105893 wd:Q57058 wd:Q1076776 wd:Q11952 }}
  ?item wdt:P131+ ?jls ; wdt:P625 ?coord .
  OPTIONAL {{ ?item wdt:P31 ?tip . }}
  OPTIONAL {{ ?item rdfs:label ?enLabel FILTER(lang(?enLabel)="en") }}
  OPTIONAL {{ ?item rdfs:label ?deLabel FILTER(lang(?deLabel)="de") }}
  OPTIONAL {{ ?hrwiki schema:about ?item ; schema:isPartOf <https://hr.wikipedia.org/> . }}
  OPTIONAL {{ ?item wdt:P373 ?commons . }}
  OPTIONAL {{ ?item wdt:P2044 ?visina . }}
  OPTIONAL {{ ?item wdt:P18 ?slika . }}
  SERVICE wikibase:label {{ bd:serviceParam wikibase:language "hr,en" . }}
}}"""
url = "https://query.wikidata.org/sparql?" + urllib.parse.urlencode({"query": Q, "format": "json"})
req = urllib.request.Request(url, headers={"User-Agent": "GK-vodic-faza1/0.1 (marko.frankovic@gmail.com)"})
rows = json.load(urllib.request.urlopen(req, timeout=180))["results"]["bindings"]
out = {}
for r in rows:
    g = lambda k: r.get(k, {}).get("value")
    qid = g("item").rsplit("/", 1)[1]
    lon, lat = map(float, g("coord")[6:-1].split())
    d = out.setdefault(qid, {"qid": qid, "hr": g("itemLabel"), "en": g("enLabel"), "de": g("deLabel"),
        "lat": round(lat, 6), "lon": round(lon, 6), "tipovi": [], "jls": g("jlsLabel"),
        "hrwiki": g("hrwiki"), "commons": g("commons"), "visina": g("visina"), "slika": g("slika")})
    if g("tipLabel") and g("tipLabel") not in d["tipovi"]: d["tipovi"].append(g("tipLabel"))
json.dump(list(out.values()), open(sys.argv[1], "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(len(out), "stavki")
