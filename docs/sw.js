/* Service worker: vodič radi i bez signala.
   - Ljuska, tekstovi i podaci (točke, rute): spremljeni unaprijed, uvijek dostupni.
   - Kartice karte (OpenStreetMap) i fontovi: spremaju se dok ih gledaš, s ograničenjem broja.
   - Vremenska prognoza: uvijek s mreže; aplikacija sama čuva zadnju. */
const VERSION = "gk-v0.15.0";
const SHELL = ["./", "index.html", "app.js", "put.js", "manifest.webmanifest",
  "i18n/hr.json", "i18n/en.json", "privatnost.html", "data/tocke.json", "data/rute.json", "data/kategorije.json", "data/danas.json", "data/podloga.json", "data/slike.json", "data/usluge.json", "data/putovnica.json", "data/info.json", "data/specijaliteti.json", "data/rute_bicikl.json", "data/rute_planinarske.json", "data/izleti.json", "data/mreza.json", "data/lynx.json",
  "vendor/leaflet.js", "vendor/leaflet.css", "vendor/maplibre-gl.js", "vendor/maplibre-gl.css", "vendor/leaflet-maplibre-gl.js", "karta.js", "karta/popis.json", "vendor/images/layers.png", "vendor/images/marker-icon.png", "vendor/images/marker-shadow.png",
  "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png", "icons/favicon-64.png", "icons/maskable-512.png"];
const LIMITS = { "gk-tiles": 4000, "gk-tiles-t": 4000, "gk-fonts": 40, "gk-foto": 600 };

self.addEventListener("install", e => {
  /* u instalaciji samo ljuska: nova verzija mora se brzo instalirati i preuzeti stranicu */
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
/* fotografije (data/slike.json) spremaju se zasebno i trajno (gk-foto), da rade bez signala;
   aplikacija to traži porukom „fotke“ pri svakom pokretanju, a već spremljene se preskaču */
async function spremiFotke() {
  try {
    const c = await caches.open(VERSION), f = await caches.open("gk-foto");
    const json = async u => (await (await c.match(u) || await fetch(u)).json());
    const sl = Object.values(await json("data/slike.json")).concat(((await json("data/specijaliteti.json")).specijaliteti || []).map(x => x.slika).filter(Boolean));
    const lok = [...new Set(sl.map(s => s.datoteka).filter(Boolean))].map(u => new URL(u, self.registration.scope).href);
    const vani = [...new Set(sl.filter(s => !s.datoteka).map(s => s.url))];
    await Promise.allSettled(lok.map(u => f.match(u).then(h => h || f.add(u)))
      .concat(vani.map(u => f.match(u).then(h => h || f.add(new Request(u, { mode: "cors" }))))));
  } catch (err) { /* bez fotografija aplikacija i dalje radi */ }
}
self.addEventListener("message", e => { if (e.data === "fotke") e.waitUntil(spremiFotke()); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(k => k.startsWith("gk-v") && k !== VERSION).map(k => caches.delete(k))
  )).then(() => self.clients.claim()));
});

async function trim(name) {
  const max = LIMITS[name]; if (!max) return;
  const c = await caches.open(name), keys = await c.keys();
  for (let i = 0; i < keys.length - max; i++) await c.delete(keys[i]);
}
async function cacheFirst(req, name) {
  const c = await caches.open(name), hit = await c.match(req);
  if (hit) return hit;
  try {
    const res = await fetch(req);
    if (res.ok || res.type === "opaque") { c.put(req, res.clone()); trim(name); }
    return res;
  } catch (e) { return hit || Response.error(); }
}
/* kartice karte: odmah iz spremljenog, a starije od 7 dana osvježe se u pozadini kad ima signala
   (pravila OSM poslužitelja traže barem 7 dana čuvanja; bez osvježavanja karta bi zauvijek ostala stara) */
const TILE_DANA = 7;
async function tileSWR(e, req) {
  const c = await caches.open("gk-tiles"), meta = await caches.open("gk-tiles-t"), hit = await c.match(req);
  const osvjezi = () => fetch(req).then(res => {
    if (res.ok || res.type === "opaque") { c.put(req, res.clone()); meta.put(req.url, new Response(String(Date.now()))); trim("gk-tiles"); trim("gk-tiles-t"); }
    return res;
  });
  if (!hit) { try { return await osvjezi(); } catch (err) { return Response.error(); } }
  const tm = await meta.match(req.url), kad = tm ? +(await tm.text()) : 0;
  if (Date.now() - kad > TILE_DANA * 864e5) e.waitUntil(osvjezi().catch(() => {}));
  return hit;
}
/* podaci: s mreže kad ima signala (svježe izmjene), inače iz spremljenog */
async function networkFirst(req) {
  const c = await caches.open(VERSION);
  try { const res = await fetch(req); if (res.ok) c.put(req, res.clone()); return res; }
  catch (e) { return (await c.match(req, { ignoreSearch: true })) || Response.error(); }
}

self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET") return;
  if (url.hostname.endsWith("open-meteo.com") || url.hostname.endsWith("goatcounter.com") || url.hostname === "gc.zgo.at") return;
  if (url.hostname === "tile.openstreetmap.org") { e.respondWith(tileSWR(e, req)); return; }
  if (url.hostname === "upload.wikimedia.org") { e.respondWith(cacheFirst(req, "gk-foto")); return; }
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") { e.respondWith(cacheFirst(req, "gk-fonts")); return; }
  /* vlastita karta: pločice se čuvaju trajno (nova izrada ima novi ?v=), popis s mreže */
  if (url.origin === location.origin && url.pathname.includes("/karta/") && !url.pathname.endsWith("popis.json")) { e.respondWith(cacheFirst(req, "gk-karta")); return; }
  if (url.origin === location.origin && (url.pathname.includes("/data/") || url.pathname.endsWith("popis.json") || url.pathname.includes("/i18n/"))) { e.respondWith(networkFirst(req)); return; }
  if (url.origin === location.origin) {
    e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match("index.html"))));
  }
});
