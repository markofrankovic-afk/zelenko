"""Spaja OSM točke (izvori/osm_gk.json) s ručnim popisom (data/tocke.json) u konačni popis za aplikaciju.

  python3 alati/spoji_osm.py <izlaz tocke.json>

- Ručne točke ostaju (važnost 1); ako im OSM ima isti objekt, dobivaju osm_id, a procijenjene (N) i OSM koordinate.
- Ostale OSM točke dobivaju ID "O<tip><broj>", generirani naziv i kratak opis iz oznaka (važnost 2 ili 3).
"""
import json, math, re, sys, unicodedata
from collections import Counter
OUT = sys.argv[1]
B = json.load(open("data/tocke.json", encoding="utf-8"))
O = json.load(open("izvori/osm_gk.json", encoding="utf-8"))
MJ = [m for m in O["mjesta"] if m["vrsta"] in ("town", "village")]

def hav(a, b):
    r = math.pi / 180; x = math.sin((b["lat"] - a["lat"]) * r / 2) ** 2 + math.cos(a["lat"] * r) * math.cos(b["lat"] * r) * math.sin((b["lon"] - a["lon"]) * r / 2) ** 2
    return 2 * 6371000 * math.asin(math.sqrt(x))
def norm(s): return re.sub(r"[^a-z0-9 ]", " ", unicodedata.normalize("NFKD", (s or "").lower()).encode("ascii", "ignore").decode()).split()
OPCE = {"jezero", "izvor", "slap", "spilja", "park", "suma", "staza", "dom", "planinarski", "crkva", "kapela", "sv", "svetog", "svete",
        "kastel", "dvorac", "vrh", "veliki", "mali", "kupa", "na", "u", "kod", "i", "polaziste", "np", "ulaz", "rijeka", "nacionalni"}
DRUGO = {"mali", "mala", "malo", "veliki", "velika", "veliko", "gornji", "gornja", "gornje", "donji", "donja", "donje",
         "stari", "stara", "novi", "nova", "zabavni", "climbing", "crag", "kamp", "camp", "parking", "restoran", "hotel"}
def kljuc(s): return {w for w in norm(s) if len(w) > 3 and w not in OPCE}
def najblize(p):
    m = min(MJ, key=lambda m: hav(p, m)); return m["ime"], hav(p, m)
def km(d): return (f"{d/1000:.1f}".replace(".", ",") + " km") if d >= 1000 else f"{round(d/10)*10} m"

GEN = {"vidikovac": "Vidikovac", "izvor": "Izvor", "piknik": "Izletište", "parking": "Parkiralište", "wc": "Javni WC",
       "pitka_voda": "Pitka voda", "bankomat": "Bankomat", "ljekarna": "Ljekarna", "ambulanta": "Ambulanta", "spilja": "Špilja",
       "rusevine": "Ruševine", "dom": "Planinarski dom", "skloniste": "Sklonište", "benzinska": "Benzinska postaja",
       "info": "Turistički ured", "kamp": "Kamp", "muzej": "Muzej",
       "park": "Park", "igraliste": "Dječje igralište"}
OPIS = {
 "vrh": "Vrh{ele}.", "prijevoj": "Planinski prijevoj{ele}.", "vidikovac": "Vidikovac{ele}.", "stijene": "Stijene.",
 "dom": "Planinarski dom{ele}. Prije polaska provjeri je li otvoren.", "skloniste": "Planinarsko sklonište{ele}.",
 "slap": "Slap.", "izvor": "Izvor{pitka}.", "jezero": "Jezero.", "kupaliste": "Mjesto za kupanje.",
 "spilja": "Ulaz u špilju ili jamu. Ne ulazi bez opreme i iskusnog vodiča.", "zasticeno": "{zast}.",
 "muzej": "Muzej ili zbirka. Prije posjeta provjeri radno vrijeme.", "sakralno": "Crkva ili kapela.",
 "dvorac": "Dvorac ili utvrda.", "rusevine": "Ruševine.", "spomen": "Spomenik ili spomen-obilježje.",
 "tehnicka": "Tehnička baština.", "povijesno": "Povijesno mjesto.", "kamp": "Kamp.", "piknik": "Mjesto za odmor i piknik.",
 "zanimljivost": "Zanimljivost.", "park": "Park za šetnju i odmor.", "igraliste": "Dječje igralište.", "info": "Turistički ured.", "kolodvor": "Željeznički kolodvor ili stajalište.",
 "pitka_voda": "Pitka voda.", "parking": "Parkiralište.", "wc": "Javni WC.", "ljekarna": "Ljekarna.",
 "ambulanta": "Ambulanta ili liječnička ordinacija.", "benzinska": "Benzinska postaja.", "bankomat": "Bankomat."}

tocke = B["tocke"]
for t in tocke: t["vaznost"] = 1
spojeno, nove = 0, []
for o in O["tocke"]:
    tg = o["oznake"]; ime = tg.get("name")
    # isti objekt kao ručna točka?
    k = kljuc(ime) if ime else set()
    best = None
    for t in tocke:
        d = hav(o, t)
        if d > 4000: continue
        # samo isti objekt iste vrste: benzinska, ambulanta, kolodvor, kamp ili penjalište nisu rijeka, staza ni park
        if o["kategorija"] == "prakticno" and t["kategorija"] != "prakticno": continue
        if o["podvrsta"] in ("kamp", "stijene", "dom", "skloniste") and o["podvrsta"] != t["podvrsta"]: continue
        kt = kljuc(t["tekst"]["hr"]["naziv"])
        # isto ime: OSM-ovo je dio ručnog ("Bajer" ~ "Jezero Bajer") ili obrnuto, ali bez riječi koje znače drugo mjesto ("Mali Platak" nije "Platak")
        srodno = o["kategorija"] == t["kategorija"] or {o["kategorija"], t["kategorija"]} in ({"izlet", "zasticeno"}, {"planina", "zasticeno"}, {"voda", "zasticeno"}, {"staza", "zasticeno"})
        do, dt = set(norm(ime)) & DRUGO, set(norm(t["tekst"]["hr"]["naziv"])) & DRUGO
        suprotno = do and dt and do != dt                     # "Mali Kozarac" i "Veliki Kozarac": dva vrha
        isto = srodno and k and kt and not suprotno and (
            ((k <= kt or kt <= k) and (do == dt or d < 500))   # isto ime, ili "Veliki Bitoraj" ~ "Bitoraj" na istom mjestu
            or (k & kt and d < 500))                           # slično ime na istom mjestu ("Kanculova glava" ~ "glavica")
        if isto and t["podvrsta"] != "naselje":
            if not best or d < best[0]: best = (d, t)
    if best and best[0] < {"N": 4000, "S": 1500}.get(best[1]["pouzdanost"], 600):
        t = best[1]
        if not t["izvor"].get("osm"):
            t["izvor"]["osm"] = o["osm"]
            if t["pouzdanost"] == "N" or (t["pouzdanost"] == "S" and t["izvor"].get("veza") != "okvirno"):
                t["lat"], t["lon"], t["pouzdanost"] = o["lat"], o["lon"], "V"
                t["izvor"]["koordinate"] = "OpenStreetMap"
                t["licenca"] = "koordinate: ODbL (© OpenStreetMap suradnici); opis: naš tekst"
                if t["napomena"].startswith(("Nema u Wikidati", "Wikidata ima")): t["napomena"] = ""
            spojeno += 1
            continue
    mj, dmj = najblize(o)
    naziv = ime or (GEN.get(o["podvrsta"], "Točka") + " – " + mj)
    if o["podvrsta"] == "bankomat" and not ime and tg.get("operator"): naziv = f"Bankomat {tg['operator']} – {mj}"
    ele = tg.get("ele", "").replace(",", ".").split(";")[0]
    try: ele_s = f", {round(float(ele))} m" if ele else ""
    except ValueError: ele_s = ""
    pitka = {"yes": ", pitka voda (prema OSM-u)", "no": ", voda nije za piće"}.get(tg.get("drinking_water"), "")
    zast = tg.get("protection_title") or "Zaštićeno područje"
    opis = OPIS[o["podvrsta"]].format(ele=ele_s, pitka=pitka, zast=zast[0].upper() + zast[1:])
    opis += f" Najbliže mjesto: {mj} ({km(dmj)})."
    if tg.get("opening_hours"): opis += f" Radno vrijeme (OSM): {tg['opening_hours']}."
    try: elev = float(ele) if ele else 0
    except ValueError: elev = 0
    vazno = 2
    if o["podvrsta"] in ("parking", "wc", "bankomat", "benzinska", "pitka_voda", "ljekarna", "ambulanta", "piknik", "info"): vazno = 3
    if o["podvrsta"] == "vrh" and elev < 1000 and not tg.get("wikidata"): vazno = 3
    if o["podvrsta"] in ("vidikovac", "izvor", "spilja", "igraliste") and not ime: vazno = 3
    nove.append({
        "id": "O" + o["osm"], "kategorija": o["kategorija"], "podvrsta": o["podvrsta"],
        "tekst": {"hr": {"naziv": naziv, "opis": opis}},
        "lat": o["lat"], "lon": o["lon"], "pouzdanost": "V", "vaznost": vazno,
        "izvor": {"koordinate": "OpenStreetMap", "osm": o["osm"], "wikidata": tg.get("wikidata"), "opis": "generiran iz OSM oznaka"},
        "licenca": "ODbL – © OpenStreetMap suradnici", "napomena": "", "status": "iz OSM-a, opis za doradu"})

# ručne ispravke: Petehovac je u OSM-u lokalitet jugoistočno od Delnica (n4582333878)
for t in tocke:
    if t["id"] == "P12" and not t["izvor"].get("osm"):
        t.update(lat=45.380177, lon=14.820399, pouzdanost="S"); t["izvor"].update(osm="n4582333878", koordinate="OpenStreetMap (lokalitet)")
        t["licenca"] = "koordinate: ODbL (© OpenStreetMap suradnici); opis: naš tekst"
        t["napomena"] = "Koordinata lokaliteta Petehovac; točan položaj tornja provjeriti."
B["tocke"] = tocke + nove
B["kategorije"].update({"izlet": "Izletišta", "prakticno": "Praktično"})
B["izvor_osm"] = O["izvor"]
json.dump(B, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
print("ručne:", len(tocke), "| spojene s OSM-om:", spojeno, "| nove iz OSM-a:", len(nove), "| ukupno:", len(B["tocke"]))
print("važnost:", Counter(t["vaznost"] for t in B["tocke"]))
print("ručne i dalje N:", [t["id"] for t in tocke if t["pouzdanost"] == "N"])
