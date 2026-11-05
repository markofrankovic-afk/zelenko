"""Autorove fotografije u aplikaciju: smanjuje originale u docs/slike/ i upisuje ih u docs/data/slike.json.

  python3 alati/vlastite_fotke.py <docs_dir> <mapa_s_originalima>

Popis je u izvori/vlastite_fotke.json (točka → datoteka). Vlastita fotka ima prednost pred fotkom s
Wikimedia Commonsa za istu točku. Originali nisu u repozitoriju; bez njih se postojeće .webp datoteke zadržavaju.
"""
import json, os, re, sys
from PIL import Image, ImageOps
Image.MAX_IMAGE_PIXELS = None
docs, src = sys.argv[1], sys.argv[2]
BASE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
V = json.load(open(f"{BASE}/izvori/vlastite_fotke.json", encoding="utf-8"))
put = f"{docs}/data/slike.json"
sl = json.load(open(put, encoding="utf-8"))
sl = {k: v for k, v in sl.items() if not v.get("vlastita") or k in V["odabrane"]}   # makni fotke koje više nisu odabrane
for tid, dat in V["odabrane"].items():
    ime = "vlastita-" + re.sub(r"[^a-z0-9]+", "-", os.path.splitext(dat)[0].lower()) + ".webp"
    cilj = f"{docs}/slike/{ime}"
    if os.path.exists(os.path.join(src, dat)):
        im = Image.open(os.path.join(src, dat)); im.draft("RGB", (2000, 2000))
        im = ImageOps.exif_transpose(im).convert("RGB"); im.thumbnail((960, 960), Image.LANCZOS)
        im.save(cilj, "WEBP", quality=74, method=4)   # bez EXIF-a (GPS i uređaj ne idu u aplikaciju)
    elif not os.path.exists(cilj):
        sys.exit(f"nema originala ni gotove slike: {dat}")
    sl[tid] = {"datoteka": "slike/" + ime, "autor": V["autor"], "vlastita": True, "naslov": dat}
json.dump(sl, open(put, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("vlastitih fotki:", len(V["odabrane"]))
