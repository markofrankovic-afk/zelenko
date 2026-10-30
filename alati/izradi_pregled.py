"""Gradi jednu HTML stranicu za pregled u Claudeu (artifact) iz docs/."""
import json, re, os
D = "docs"
html = open(f"{D}/index.html", encoding="utf-8").read()
style = re.search(r"<style>(.*?)</style>", html, re.S).group(1)
body = re.search(r"<body>(.*?)<script src=\"vendor/leaflet.js\"></script>", html, re.S).group(1)
lcss = open(f"{D}/vendor/leaflet.css", encoding="utf-8").read()
lcss = re.sub(r"url\([^)]*images/[^)]*\)", "none", lcss)   # slike Leafleta se ne koriste
app = open(f"{D}/put.js", encoding="utf-8").read() + "\n" + open(f"{D}/app.js", encoding="utf-8").read()
data = {u: json.load(open(f"{D}/{u}", encoding="utf-8")) for u in
        ["i18n/hr.json", "data/tocke.json", "data/rute.json", "data/kategorije.json", "data/danas.json", "data/podloga.json", "data/usluge.json", "data/putovnica.json", "data/info.json", "data/specijaliteti.json", "data/rute_bicikl.json", "data/mreza.json", "data/lynx.json"]}
# fotografije ugrađene kao data URI (pregled nema pristup mapi slike/)
import base64, io
from PIL import Image
male = {}
def umanji(put, w=420):
    im = Image.open(put); im = im.resize((w, round(im.height * w / im.width))) if im.width > w else im
    b = io.BytesIO(); im.save(b, "WEBP", quality=55); return "data:image/webp;base64," + base64.b64encode(b.getvalue()).decode()
if os.path.exists(f"{D}/data/slike.json"):
    sl = json.load(open(f"{D}/data/slike.json", encoding="utf-8"))
    for v in sl.values():
        if v.get("datoteka"): v["datoteka"] = male.setdefault(v["datoteka"], umanji(f"{D}/{v['datoteka']}"))
    data["data/slike.json"] = sl
sp = data["data/specijaliteti.json"]
for x in sp["specijaliteti"]:
    if x.get("slika") and x["slika"].get("datoteka"):
        x["slika"] = dict(x["slika"], datoteka=male.setdefault(x["slika"]["datoteka"], umanji(f"{D}/{x['slika']['datoteka']}", 330)))
blob = json.dumps(data, ensure_ascii=False).replace("</", "<\\/")
out = f"""<title>Zelenko – Gorski kotar</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=Barlow:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500&display=swap">
<style>
{lcss}
{style}
</style>
{body}
<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
<script>window.GK_PREGLED = true; window.GK_DATA = {blob};</script>
<script>
{app}
</script>
"""
os.makedirs("pregled", exist_ok=True)
open("pregled/gorski-kotar-vodic.html", "w", encoding="utf-8").write(out)
print(len(out), "bajtova")
