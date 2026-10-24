"""Detalji Wikidata stavki (CC0): nazivi hr/en/de, koordinate s preciznošću, slika (Commons), hr Wikipedija, visina."""
import json, sys, urllib.parse, urllib.request
def detalji(qids):
    out = {}
    for i in range(0, len(qids), 80):
        vals = " ".join("wd:" + q for q in qids[i:i+80])
        Q = f"""SELECT ?item ?hr ?en ?de ?lat ?lon ?prec ?slika ?hrwiki ?visina WHERE {{
          VALUES ?item {{ {vals} }}
          ?item p:P625/psv:P625 [ wikibase:geoLatitude ?lat ; wikibase:geoLongitude ?lon ; wikibase:geoPrecision ?prec ] .
          OPTIONAL {{ ?item rdfs:label ?hr FILTER(lang(?hr)="hr") }} OPTIONAL {{ ?item rdfs:label ?en FILTER(lang(?en)="en") }}
          OPTIONAL {{ ?item rdfs:label ?de FILTER(lang(?de)="de") }} OPTIONAL {{ ?item wdt:P18 ?slika }}
          OPTIONAL {{ ?hrwiki schema:about ?item ; schema:isPartOf <https://hr.wikipedia.org/> }}
          OPTIONAL {{ ?item wdt:P2044 ?visina }} }}"""
        url = "https://query.wikidata.org/sparql?" + urllib.parse.urlencode({"query": Q, "format": "json"})
        for r in json.load(urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "GK-vodic/0.1"}), timeout=120))["results"]["bindings"]:
            g = lambda k: r.get(k, {}).get("value")
            q = g("item").rsplit("/", 1)[1]
            if q in out: continue
            out[q] = {"qid": q, "hr": g("hr"), "en": g("en"), "de": g("de"), "lat": round(float(g("lat")), 6), "lon": round(float(g("lon")), 6),
                      "preciznost": float(g("prec")) if g("prec") else None, "slika": g("slika"),
                      "hrwiki": urllib.parse.unquote(g("hrwiki")) if g("hrwiki") else None, "visina": g("visina")}
    return out
if __name__ == "__main__":
    qs = sys.argv[2:]
    d = detalji(qs); json.dump(d, open(sys.argv[1], "w"), ensure_ascii=False, indent=1)
    for q in qs:
        x = d.get(q); print(q, "NEMA" if not x else f'{x["hr"]} | {x["en"]} | {x["lat"]},{x["lon"]} p={x["preciznost"]} | {"img" if x["slika"] else ""} | {x["visina"] or ""}')
