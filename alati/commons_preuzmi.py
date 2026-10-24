"""Polako preuzima fotografije iz docs/data/slike.json koje još nemaju lokalnu kopiju.

Upotreba: python3 commons_preuzmi.py <docs_dir> [pauza_s]
Wikimedia ograničava automatsko skidanje, pa ide jedna slika po pauzi; kod odbijanja čeka 10 minuta.
Svaka uspješna slika odmah se upisuje u slike.json (može se prekinuti i nastaviti).
"""
import io, json, os, re, sys, time, unicodedata, urllib.request
from PIL import Image

UA = {"User-Agent": "GorskiKotarVodic/0.3 (https://github.com/markofrankovic-afk; marko.frankovic@gmail.com) python-urllib/3"}


def ime(naslov):
    s = unicodedata.normalize("NFKD", os.path.splitext(naslov)[0].lower())
    s = "".join(c for c in s if not unicodedata.combining(c)).replace("đ", "d")
    return re.sub(r"[^a-z0-9]+", "-", s)[:70].strip("-") + ".webp"


def main(docs, pauza=20):
    put = f"{docs}/data/slike.json"
    while True:
        sl = json.load(open(put))
        ceka = {}
        for tid, v in sl.items():
            if not v.get("datoteka"): ceka.setdefault(v["url"], []).append(tid)
        print("preostalo", len(ceka), flush=True)
        if not ceka: break
        url, ids = next(iter(ceka.items()))
        dat = ime(sl[ids[0]]["naslov"])
        if not os.path.exists(f"{docs}/slike/{dat}"):
            try:
                with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
                    raw = r.read()
            except urllib.error.HTTPError as e:
                print("odbijeno", e.code, "čekam 10 min", flush=True); time.sleep(600); continue
            img = Image.open(io.BytesIO(raw)).convert("RGB")
            img.save(f"{docs}/slike/{dat}", "WEBP", quality=72, method=6)
        for tid in ids: sl[tid]["datoteka"] = "slike/" + dat
        json.dump(sl, open(put, "w"), ensure_ascii=False, indent=1)
        print("ok", dat, flush=True)
        time.sleep(float(pauza))
    print("gotovo", flush=True)


if __name__ == "__main__":
    main(*sys.argv[1:3])
