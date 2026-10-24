/* Service worker: vodič radi i bez signala.
   - Ljuska, tekstovi i podaci (točke, rute): spremljeni unaprijed, uvijek dostupni.
   - Kartice karte (OpenStreetMap) i fontovi: spremaju se dok ih gledaš, s ograničenjem broja.
   - Vremenska prognoza: uvijek s mreže; aplikacija sama čuva zadnju. */
const VERSION = "gk-v0.5.2";
const SHELL = ["./", "index.html", "app.js", "manifest.webmanifest",
  "i18n/hr.json", "data/tocke.json", "data/rute.json", "data/kategorije.json", "data/danas.json", "data/podloga.json", "data/slike.json", "data/usluge.json", "data/putovnica.json",
  "vendor/leaflet.js", "vendor/leaflet.css", "vendor/images/layers.png", "vendor/images/marker-icon.png", "vendor/images/marker-shadow.png",
  "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png", "icons/favicon-64.png", "icons/maskable-512.png"];
const LIMITS = { "gk-tiles": 3000, "gk-fonts": 40, "gk-foto": 600 };

self.addEventListener("install", e => {
  /* fotografije (data/slike.json) spremaju se odmah, da rade i bez signala:
     lokalne u ljusku, one s Wikimedia Commonsa u gk-foto */
  e.waitUntil(caches.open(VERSION).then(async c => {
    await c.addAll(SHELL);
    try {
      const sl = Object.values(await (await c.match("data/slike.json")).json());
      const lok = [...new Set(sl.map(s => s.datoteka).filter(Boolean))];
      const vani = [...new Set(sl.filter(s => !s.datoteka).map(s => s.url))];
      const f = await caches.open("gk-foto");
      await Promise.allSettled(lok.map(u => c.add(u)).concat(vani.map(u => f.match(u).then(h => h || f.add(new Request(u, { mode: "cors" }))))));
    } catch (err) { /* bez fotografija aplikacija i dalje radi */ }
  }).then(() => self.skipWaiting()));
});
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
  if (url.hostname === "tile.openstreetmap.org") { e.respondWith(cacheFirst(req, "gk-tiles")); return; }
  if (url.hostname === "upload.wikimedia.org") { e.respondWith(cacheFirst(req, "gk-foto")); return; }
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") { e.respondWith(cacheFirst(req, "gk-fonts")); return; }
  if (url.origin === location.origin && (url.pathname.includes("/data/") || url.pathname.includes("/i18n/"))) { e.respondWith(networkFirst(req)); return; }
  if (url.origin === location.origin) {
    e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match("index.html"))));
  }
});
