import json, os
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
t = json.load(open(f"{D}/data/tocke.json", encoding="utf-8")); r = json.load(open(f"{D}/data/rute.json", encoding="utf-8"))
data = json.dumps({"kategorije": t["kategorije"], "tocke": t["tocke"], "rute": r["rute"]}, ensure_ascii=False).replace("</", "<\\/")
html = open(f"{D}/alati/stranica_predlozak.html", encoding="utf-8").read().replace("__DATA__", data)
open(f"{D}/tocke-i-rute.html", "w", encoding="utf-8").write(html); print(len(html), "bajtova")
