// Kopira web aplikaciju iz ../docs u www/ za Android paket.
// Bez pločica karte (karta/v, karta/s: dolaze s weba i spremaju se na mobitel), bez service workera
// i bez internih stranica. Fontovi karte ostaju u paketu.
import { cpSync, rmSync, existsSync } from "node:fs";
const IZOSTAVI = ["karta/v", "karta/s", "sw.js", "pribadace.html", "karta/popis.json"];
if (existsSync("www")) rmSync("www", { recursive: true });
cpSync("../docs", "www", {
  recursive: true,
  filter: src => { const r = src.replace(/^\.\.\/docs\/?/, ""); return !IZOSTAVI.some(x => r === x || r.startsWith(x + "/")); }
});
console.log("www/ spreman");
