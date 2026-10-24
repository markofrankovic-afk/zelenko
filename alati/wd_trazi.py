"""Pretraga Wikidate po imenu preko query.wikidata.org (mwapi EntitySearch), samo stavke s koordinatama u području."""
import json, sys, urllib.parse, urllib.request
sys.path.insert(0, __file__.rsplit("/", 1)[0]); from gk_poligon import unutra
def trazi(pojmovi):
    out = {}
    for p in pojmovi:
        Q = f"""SELECT ?item ?itemLabel ?coord ?tipLabel ?opis ?hrwiki ?slika ?visina WHERE {{
          SERVICE wikibase:mwapi {{ bd:serviceParam wikibase:endpoint "www.wikidata.org"; wikibase:api "EntitySearch";
            mwapi:search "{p}"; mwapi:language "hr"; mwapi:limit "30". ?item wikibase:apiOutputItem mwapi:item. }}
          ?item wdt:P625 ?coord .
          OPTIONAL {{ ?item wdt:P31 ?tip }} OPTIONAL {{ ?item schema:description ?opis FILTER(lang(?opis)="hr") }}
          OPTIONAL {{ ?hrwiki schema:about ?item ; schema:isPartOf <https://hr.wikipedia.org/> }}
          OPTIONAL {{ ?item wdt:P18 ?slika }} OPTIONAL {{ ?item wdt:P2044 ?visina }}
          SERVICE wikibase:label {{ bd:serviceParam wikibase:language "hr,en". }} }}"""
        url = "https://query.wikidata.org/sparql?" + urllib.parse.urlencode({"query": Q, "format": "json"})
        rows = json.load(urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "GK-vodic/0.1"}), timeout=90))["results"]["bindings"]
        for r in rows:
            g = lambda k: r.get(k, {}).get("value")
            lon, lat = map(float, g("coord")[6:-1].split())
            if not unutra(lon, lat): continue
            q = g("item").rsplit("/", 1)[1]
            d = out.setdefault(q, {"qid": q, "hr": g("itemLabel"), "lat": round(lat, 6), "lon": round(lon, 6), "tipovi": [],
                                   "opis_wd": g("opis"), "hrwiki": g("hrwiki"), "slika": g("slika"), "visina": g("visina"), "pojam": p})
            if g("tipLabel") and g("tipLabel") not in d["tipovi"]: d["tipovi"].append(g("tipLabel"))
    return out
if __name__ == "__main__":
    r = trazi(sys.argv[2:])
    json.dump(list(r.values()), open(sys.argv[1], "w"), ensure_ascii=False, indent=1)
    for x in r.values(): print(x["pojam"], "|", x["qid"], x["hr"], "|", ",".join(x["tipovi"])[:35], "|", x["lat"], x["lon"], "|", x["visina"] or "", "|", (x["opis_wd"] or "")[:50], "|", "W" if x["hrwiki"] else "")
