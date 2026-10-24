"""Čišćenje dvostrukih točaka u docs/data/tocke.json (pokreće se nakon spoji_osm.py).

  python3 alati/ocisti_duplikate.py <docs_dir>

Pravila (u ovom redu):
  1. Ručno pregledani duplikati (UKLONI): ista stvar upisana i ručno i iz OSM-a, ili dvaput u OSM-u.
  2. Neimenovani OSM vidikovac do 150 m od imenovanog vrha ili vidikovca: vrh već pokazuje to mjesto.
  3. Neimenovane OSM točke iste vrste do 100 m jedna od druge (npr. dijelovi istog parkirališta): ostaje jedna.
  4. Imenovane OSM točke istog imena i vrste do 200 m: ostaje jedna.
  5. Ručna točka i OSM točka istog imena i vrste do 600 m: ostaje ručna.
Uklonjene točke brišu se i iz slike.json i info.json. Kolodvori dobivaju ime "Kolodvor X".
"""
import json, math, os, sys, unicodedata

docs = sys.argv[1]
BASE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
UKLONI = {
    # ručno pregledano 24. 10. 2026.
    "On13282724732": "vidikovac na Preradovićevom vrhu (dupli 'Vidikovac – Vrata')",
    "Or4684430": "isto što i H03 Kaštel Severin na Kupi",
    "Ow433262942": "isto što i H04 Manastir Gomirje",
    "Ow432375440": "isto što i H32 crkva u Zamostu",
    "On12059271480": "isto što i H37 crkva sv. Ilije, Damalj",
    "Ow625930948": "isto što i H40 kapela sv. Trojstva, Čedanj",
    "Ow432559073": "isto što i H42 kapelica u Čabru",
    "Ow321389356": "isto što i Svetište Majke Božje Svetogorske",
    "On7651739302": "isto što i P22 Maj vrh", "On7651739303": "isto što i P22 Maj vrh",
    "On8867484417": "vidikovac na samom vrhu Treska",
    "On11841887243": "vrh nazvan samo 'Vidikovac', 50 m od vidikovca kod Bele Vodice",
    # 24. 10. 2026: OSM objekti koji su sad ručne točke s našim nazivom i opisom
    "Ow333577471": "isto što i H05 Memorijalni muzej I. G. Kovačića",
    "Ow436526341": "isto što i E02 Zabavni i paintball park Vrata",
    "Ow433249369": "isto što i H49 Svetište Majke Božje Snježne",
    "Ow1534944649": "isto što i E01 Kaubojsko selo Roswell",
}

tp = f"{docs}/data/tocke.json"
data = json.load(open(tp, encoding="utf-8")); T = data["tocke"]
osm = {x["osm"]: x["oznake"] for x in json.load(open(f"{BASE}/izvori/osm_gk.json", encoding="utf-8"))["tocke"]}
ime_osm = lambda p: osm.get((p.get("izvor") or {}).get("osm") or "", {}).get("name")
je_osm = lambda p: p["id"].startswith("O")
OPCA_IMENA = {"vidikovac", "viewpoint", "pogled", "izvor", "spring", "parking", "parkiralište"}
neimenovana = lambda p: je_osm(p) and (not ime_osm(p) or ime_osm(p).strip().lower() in OPCA_IMENA)
naziv = lambda p: p["tekst"]["hr"]["naziv"]


def norm(s):
    s = unicodedata.normalize("NFKD", s.lower())
    return "".join(c for c in s if not unicodedata.combining(c)).replace("đ", "d").strip()


def d(a, b):
    la = math.radians((a["lat"] + b["lat"]) / 2)
    return math.hypot((a["lat"] - b["lat"]) * 111320, (a["lon"] - b["lon"]) * 111320 * math.cos(la))


ukloni = dict(UKLONI)
ids = {p["id"] for p in T}
for i, a in enumerate(T):
    for b in T[i + 1:]:
        if abs(a["lat"] - b["lat"]) > 0.01 or abs(a["lon"] - b["lon"]) > 0.015: continue
        if a["id"] in ukloni or b["id"] in ukloni: continue
        dd = d(a, b)
        for x, y in ((a, b), (b, a)):
            # 2) neimenovani vidikovac uz imenovani vrh/vidikovac
            if x["podvrsta"] == "vidikovac" and neimenovana(x) and y["podvrsta"] in ("vrh", "vidikovac") and not neimenovana(y) and dd < 150:
                ukloni[x["id"]] = f"neimenovani vidikovac {round(dd)} m od '{naziv(y)}'"; break
        else:
            if a["podvrsta"] != b["podvrsta"]: continue
            if neimenovana(a) and neimenovana(b) and dd < 100:                     # 3)
                ukloni[b["id"]] = f"ista vrsta {round(dd)} m od {a['id']}"
            elif je_osm(a) and je_osm(b) and norm(naziv(a)) == norm(naziv(b)) and dd < 200:  # 4)
                ukloni[b["id"]] = f"isto ime {round(dd)} m od {a['id']}"
            elif je_osm(a) != je_osm(b) and norm(naziv(a)) == norm(naziv(b)) and dd < 600:  # 5)
                x = a if je_osm(a) else b
                ukloni[x["id"]] = f"isto kao ručna točka {(b if x is a else a)['id']}"

ukloni = {k: v for k, v in ukloni.items() if k in ids}
data["tocke"] = [p for p in T if p["id"] not in ukloni]
for p in data["tocke"]:
    if p["podvrsta"] == "kolodvor" and not norm(naziv(p)).startswith(("kolodvor", "stajaliste", "zeljeznick")):
        p["tekst"]["hr"]["naziv"] = "Kolodvor " + naziv(p)
json.dump(data, open(tp, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
for f in ("slike.json", "info.json"):
    fp = f"{docs}/data/{f}"
    if os.path.exists(fp):
        x = json.load(open(fp, encoding="utf-8"))
        json.dump({k: v for k, v in x.items() if k not in ukloni}, open(fp, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"uklonjeno {len(ukloni)} od {len(T)} točaka:")
for k, v in sorted(ukloni.items(), key=lambda kv: kv[1]):
    print(" ", k, "|", v)
