/* Zelenko – offline vodič za Gorski kotar (prototip, faza 2)
   Tekstovi sučelja: i18n/<jezik>.json · sadržaj: data/*.json (tekstovi pod "tekst.<jezik>") */
"use strict";

const CONFIG = {
  verzija: "0.5.4",
  jezik: "hr",
  goatcounter: "",                 // npr. "https://gkvodic.goatcounter.com/count" kad otvoriš račun
  kontakt: "marko.frankovic@gmail.com",
  centar: [45.37, 14.82], zoom: 10,
  glavnaMjesta: ["H09", "H10", "H11", "H12", "H13", "H14", "H15", "H16", "H17"]
};

/* Pregled unutar Claudea (artifact): bez podloge karte, s demo lokacijom; PWA ostaje nepromijenjena */
const PREGLED = !!window.GK_PREGLED;
const DEMO_POS = { latitude: 45.3050, longitude: 14.7136, accuracy: 15, altitude: 730 };
const GEO = PREGLED ? {
  getCurrentPosition(ok) { setTimeout(() => ok({ coords: DEMO_POS }), 300); },
  watchPosition(ok) { const id = setInterval(() => ok({ coords: DEMO_POS }), 5000); setTimeout(() => ok({ coords: DEMO_POS }), 300); return id; },
  clearWatch(id) { clearInterval(id); }
} : navigator.geolocation;
const $ = s => document.querySelector(s);
const cv = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const ICON = {
  check: '<path d="M20 6 9 17l-5-5"/>', x: '<path d="M18 6 6 18M6 6l12 12"/>', nav: '<path d="m3 11 19-9-9 19-2-8-8-2z"/>',
  star: '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>',
  share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>',
  phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
  msg: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>', copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  alert: '<path d="m21.7 18-8-14a2 2 0 0 0-3.4 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3z"/><path d="M12 9v4M12 17h.01"/>',
  route: '<circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>',
  map: '<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path d="M9 4v14M15 6v14"/>', lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>', download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
  wifi_off: '<path d="M2 2l20 20M8.5 16.5a5 5 0 0 1 7 0M2 8.8a15 15 0 0 1 4.2-2.7M10.7 5.1A15 15 0 0 1 22 8.8M5 12.9a10 10 0 0 1 5.2-2.8M19 12.9a10 10 0 0 0-1.6-1.2M12 20h.01"/>',
  chevron: '<path d="m9 18 6-6-6-6"/>', car: '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>'
};
const ic = (n, cls = "ic") => `<svg class="${cls}" aria-hidden="true" viewBox="0 0 24 24">${ICON[n] || ""}</svg>`;
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
};
let T = {}, TOCKE = [], BY = {}, RUTE = [], RBY = {}, KAT = {}, DANAS = {}, PODLOGA = null, SLIKE = {}, PUT = { pecati: [], razine: [] };
function t(k, v) { let s = T[k] ?? k; if (v) for (const x in v) s = s.split("{" + x + "}").join(v[x]); return s; }
const tx = o => (o && o.tekst && (o.tekst[CONFIG.jezik] || o.tekst.hr)) || {};

const S = {
  view: "karta", grupa: "", pos: null, watch: null,
  favs: store.get("gk-fav", []), moja: store.get("gk-moja", []), car: store.get("gk-car", null), pecati: store.get("gk-pecati", {}),
  plan: { vrijeme: "pola", s: "drustvo", kako: "pjesice" }
};

/* ---------- pomoćne ---------- */
function hav(a, b) { const R = 6371e3, r = Math.PI / 180, dLa = (b.lat - a.lat) * r, dLo = (b.lon - a.lon) * r; const x = Math.sin(dLa / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLo / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(x)); }
function brg(a, b) { const r = Math.PI / 180, y = Math.sin((b.lon - a.lon) * r) * Math.cos(b.lat * r), x = Math.cos(a.lat * r) * Math.sin(b.lat * r) - Math.sin(a.lat * r) * Math.cos(b.lat * r) * Math.cos((b.lon - a.lon) * r); return (Math.atan2(y, x) / r + 360) % 360; }
function fmtDist(m) { return m < 1000 ? Math.round(m / 10) * 10 + " m" : (m / 1000).toFixed(m < 10000 ? 1 : 0).replace(".", ",") + " km"; }
function fmtTime(d) { return d.toLocaleTimeString("hr-HR", { hour: "2-digit", minute: "2-digit" }); }
function fmtCoord(x) { return x.toFixed(5).replace(".", ","); }
function norm(s) { return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d"); }
function toast(msg) { const el = $("#toast"); el.textContent = msg; el.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => el.hidden = true, 2200); }
function copy(text) { (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(() => toast(t("kopirano")), () => { window.prompt("", text); }); }
function ref() { if (S.pos) return S.pos; const c = map ? map.getCenter() : { lat: CONFIG.centar[0], lng: CONFIG.centar[1] }; return { lat: c.lat, lon: c.lng }; }
function nearestPlace(p) { let best = null; for (const x of TOCKE) if (x.podvrsta === "naselje") { const d = hav(p, x); if (!best || d < best.d) best = { d, x }; } return best ? tx(best.x).naziv : ""; }
function boja(p) { return p.moje ? cv("--accent") : (KAT.boje[p.podvrsta === "naselje" ? "naselje" : p.kategorija] || "#56606B"); }
function katNaziv(p) { if (p.moje) return t("kat_moje"); if (p.podvrsta === "naselje") return t("kat_naselje"); const k = "pod_" + p.podvrsta; return T[k] || t("kat_" + p.kategorija); }
function grupeOd(p) {
  return KAT.grupe.filter(g => g.pravila.some(([k, pod]) => k === p.kategorija && (pod === "*" || pod === p.podvrsta || (pod[0] === "!" && pod.slice(1) !== p.podvrsta)))).map(g => g.id);
}
function sezona(d = new Date()) { const m = d.getMonth() + 1; return m <= 2 || m === 12 ? "zima" : m <= 5 ? "proljece" : m <= 8 ? "ljeto" : "jesen"; }
function satiMax(s) { const n = String(s).replace(/,/g, ".").match(/[\d.]+/g) || ["0"]; return Math.max(...n.map(Number)); }

/* izlazak i zalazak sunca (NOAA) */
function sunTimes(date, lat, lon) {
  const start = Date.UTC(date.getFullYear(), 0, 0), n = Math.floor((Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - start) / 864e5);
  const g = 2 * Math.PI / 365 * (n - 1);
  const eq = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
  const dec = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
  const r = Math.PI / 180, cosH = Math.cos(90.833 * r) / (Math.cos(lat * r) * Math.cos(dec)) - Math.tan(lat * r) * Math.tan(dec);
  if (cosH > 1 || cosH < -1) return null;
  const ha = Math.acos(cosH) / r, base = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  return { rise: new Date(base + (720 - 4 * (lon + ha) - eq) * 6e4), set: new Date(base + (720 - 4 * (lon - ha) - eq) * 6e4) };
}

/* ---------- tema: sustav / svijetla / tamna ---------- */
function primijeniTemu(v) {
  if (v === "light" || v === "dark") document.documentElement.setAttribute("data-theme", v); else document.documentElement.removeAttribute("data-theme");
  store.set("gk-tema", v || "sustav");
  if (map) { skiniPodlogu(); skiniPodlogu = addPodloga(map); renderMarkers(); renderCarMarker(); if (S.ruta) pokaziRutu(S.ruta);
    if (userMarker) { userMarker.setStyle({ color: cv("--marker-stroke"), fillColor: cv("--accent") }); userHalo.setStyle({ color: cv("--accent") }); } }
}
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => { if (store.get("gk-tema", "sustav") === "sustav") primijeniTemu("sustav"); });

/* ---------- statistika (GoatCounter, bez kolačića; isključena dok nema adrese) ---------- */
function gcInit() {
  if (!CONFIG.goatcounter) return;
  const standalone = matchMedia("(display-mode: standalone)").matches;
  window.goatcounter = { path: p => (standalone ? "/app" : "/web") + (p || "/") };
  const sc = document.createElement("script"); sc.async = true; sc.src = "https://gc.zgo.at/count.js"; sc.dataset.goatcounter = CONFIG.goatcounter; document.head.appendChild(sc);
}
function gcEv(name) { try { if (window.goatcounter && window.goatcounter.count) window.goatcounter.count({ path: "ev/" + name, event: true }); } catch (e) {} }

/* ---------- prikazi ---------- */
function go(view) {
  S.view = view;
  for (const v of ["karta", "danas", "rute", "sigurnost"]) $("#v-" + v).hidden = v !== view;
  document.querySelectorAll(".tabs button").forEach(b => { if (b.dataset.go === view) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current"); });
  if (view === "karta" && map) setTimeout(() => map.invalidateSize(), 50);
  if (view === "danas") renderDanas();
  if (view === "rute") renderRute();
  if (view === "sigurnost") renderSigurnost();
  try { history.replaceState(null, "", "#" + view); } catch (e) {}
  if (window.goatcounter && window.goatcounter.count) window.goatcounter.count({ path: "/" + view });
}
document.addEventListener("click", e => { const b = e.target.closest("[data-go]"); if (b) { e.preventDefault(); closeSheet(); go(b.dataset.go); } });

/* ---------- karta ---------- */
let map, layer, userMarker, userHalo, carMarker;
/* Offline podloga: ceste, staze, vode i naselja iz OSM izvatka (data/podloga.json). Leži ispod OSM kartica:
   kad kartica nema (bez signala, nepregledano područje), vidi se ona. Markirane staze idu iznad kartica. */
const POD_ZOOM = { a: 0, b: 0, c: 11, d: 11, e: 13, f: 13, g: 12, h: 13 };
function addPodloga(m, small) {
  if (!PODLOGA) return () => {};
  if (!m.getPane("podloga")) { m.createPane("podloga").style.zIndex = 150; m.createPane("staze").style.zIndex = 350; m.getPane("staze").style.pointerEvents = "none"; m.getPane("podloga").style.pointerEvents = "none"; }
  const rb = L.canvas({ pane: "podloga", padding: .3 }), rs = L.canvas({ pane: "staze", padding: .3 });
  const L_ = PODLOGA.slojevi, grp = {}, ll = c => c.map(([x, y]) => [y, x]);
  const stil = {
    a: { color: cv("--map-road-a"), weight: 3.5 }, b: { color: cv("--map-road-b"), weight: 3 }, c: { color: cv("--map-road"), weight: 2.5 },
    d: { color: cv("--map-road"), weight: 2 }, e: { color: cv("--map-road"), weight: 1.5 }, f: { color: cv("--map-road"), weight: 1.2 },
    g: { color: cv("--map-track"), weight: 1.3, dashArray: "5 3" }, h: { color: cv("--map-path"), weight: 1.2, dashArray: "2 3" } };
  const add = (key, lines, opt, minZ, pane) => { if (!lines.length) return; grp[key] = { lyr: L.polyline(lines, { ...opt, renderer: pane === "s" ? rs : rb, interactive: false, smoothFactor: 1.5 }), minZ }; };
  const by = {}; for (const [k, c] of L_.ceste) (by[k] = by[k] || []).push(ll(c));
  for (const k in by) add("c" + k, by[k], stil[k], POD_ZOOM[k]);
  /* bijele ceste dobivaju tamniji rub, inače se na svijetloj podlozi ne vide */
  for (const k of ["c", "d", "e", "f"]) if (by[k]) add("k" + k, by[k], { color: cv("--map-road-casing"), weight: stil[k].weight + 1.6 }, POD_ZOOM[k]);
  add("naselja", L_.naselja.map(x => ll(x[1])), { color: cv("--map-town"), fillColor: cv("--map-town"), fill: true, fillOpacity: 1, weight: 0 }, 11);
  grp.naselja && (grp.naselja.lyr = L.polygon(L_.naselja.map(x => ll(x[1])), { renderer: rb, interactive: false, stroke: false, fillColor: cv("--map-town"), fillOpacity: 1 }));
  grp.vode = { lyr: L.polygon(L_.vode.map(x => ll(x[1])), { renderer: rb, interactive: false, stroke: false, fillColor: cv("--map-water"), fillOpacity: 1 }), minZ: 0 };
  add("rijeke", L_.rijeke.filter(x => x[0] === "r").map(x => ll(x[1])), { color: cv("--map-river"), weight: 2.2 }, 0);
  add("potoci", L_.rijeke.filter(x => x[0] !== "r").map(x => ll(x[1])), { color: cv("--map-river"), weight: 1 }, 12);
  add("pruga", L_.zeljeznica.map(x => ll(x[1])), { color: cv("--map-rail"), weight: 1.5, dashArray: "6 4" }, 10);
  add("np", L_.np.map(x => ll(x[1])), { color: cv("--map-np"), weight: 2, dashArray: "8 6", opacity: .8 }, 0);
  add("hps", L_.staze_hps.map(x => ll(x[1])), { color: cv("--map-hps"), weight: 2, dashArray: "6 4", opacity: .9 }, small ? 0 : 12, "s");
  const red = ["naselja", "vode", "potoci", "rijeke", "pruga", "cg", "ch", "kf", "ke", "kd", "kc", "cf", "ce", "cd", "cc", "cb", "ca", "np", "hps"];
  const sync = () => { const z = m.getZoom(); for (const k of red) { const g = grp[k]; if (!g) continue; const on = z >= g.minZ; if (on && !m.hasLayer(g.lyr)) g.lyr.addTo(m); else if (!on && m.hasLayer(g.lyr)) m.removeLayer(g.lyr); } };
  m.on("zoomend", sync); sync();
  return () => { m.off("zoomend", sync); for (const k in grp) if (m.hasLayer(grp[k].lyr)) m.removeLayer(grp[k].lyr); };
}
let skiniPodlogu = () => {}, tileLayer = null, rutaLayer = null;
function initMap() {
  map = L.map("map", { zoomControl: false, attributionControl: true, preferCanvas: true }).setView(CONFIG.centar, CONFIG.zoom);
  if (!PREGLED) tileLayer = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 17, className: "osm-tiles", attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> suradnici' }).addTo(map);
  else map.attributionControl.addAttribution('© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> suradnici');
  map.attributionControl.setPrefix('<a href="https://leafletjs.com">Leaflet</a>');
  skiniPodlogu = addPodloga(map);
  layer = L.layerGroup().addTo(map);
  map.on("moveend", () => { if (!S.pos) renderNear(); });
  let zPrev = map.getZoom(); map.on("zoomend", () => { const z = map.getZoom(); if (prag(z) !== prag(zPrev)) renderMarkers(); zPrev = z; });
  renderMarkers(); renderCarMarker();
}
function pokaziRutu(id) {
  const r = RBY[id]; if (!r || !r.trasa) return;
  if (rutaLayer) map.removeLayer(rutaLayer);
  const ll = r.trasa.map(([x, y]) => [y, x]);
  rutaLayer = L.layerGroup([L.polyline(ll, { color: cv("--ink"), weight: 8, opacity: .55, interactive: false }), L.polyline(ll, { color: cv("--amber"), weight: 5, interactive: false })]).addTo(map);
  S.ruta = id; const pill = $("#routePill"); pill.hidden = false;
  pill.innerHTML = `${ic("route")}<span>${esc(tx(r).naziv)}</span><span style="display:flex;padding:8px" aria-hidden="true">${ic("x")}</span>`;
  pill.setAttribute("aria-label", t("makni_rutu") + ": " + tx(r).naziv);
  map.fitBounds(L.latLngBounds(ll).pad(0.2));
}
function skloniRutu() { if (rutaLayer) map.removeLayer(rutaLayer); rutaLayer = null; S.ruta = null; $("#routePill").hidden = true; }
$("#routePill").addEventListener("click", skloniRutu);
function vidljive() {
  const g = S.grupa;
  const all = TOCKE.concat(S.moja.map(m => ({ ...m, moje: true })));
  if (!g) return all;
  if (g === "spremljeno") return all.filter(p => p.moje || S.favs.includes(p.id));
  return all.filter(p => !p.moje && p.grupe.includes(g));
}
/* bez filtra: manje točke (važnost 2 i 3) pojavljuju se tek kad približiš kartu */
function prag(z) { return z < 11 ? 1 : z < 13 ? 2 : 3; }
function renderMarkers() {
  layer.clearLayers();
  const max = S.grupa ? 3 : prag(map.getZoom()), stroke = cv("--marker-stroke");
  for (const p of vidljive()) {
    if (!p.moje && (p.vaznost || 1) > max) continue;
    const nas = p.podvrsta === "naselje", v = p.vaznost || 1;
    const m = L.circleMarker([p.lat, p.lon], { radius: (nas || p.kategorija === "prakticno") ? 4.5 : v === 1 ? 9 : v === 2 ? 7 : 5.5, color: stroke, weight: v === 3 ? 1.5 : 2, fillColor: boja(p), fillOpacity: 1 });
    m.bindTooltip(esc(tx(p).naziv || p.ime), nas && CONFIG.glavnaMjesta.includes(p.id) ? { permanent: true, direction: "right", className: "lbl", offset: [6, 0] } : { direction: "top" });
    m.on("click", () => p.moje ? openMoje(p.id) : openTocka(p.id));
    m.addTo(layer);
  }
}
function renderChips() {
  const counts = {}; for (const p of TOCKE) for (const g of p.grupe) counts[g] = (counts[g] || 0) + 1;
  const defs = [{ id: "", n: t("sve") }].concat(KAT.grupe.filter(g => counts[g.id]).map(g => ({ id: g.id, n: t("grupa_" + g.id), c: g.boja })));
  if (S.favs.length || S.moja.length) defs.push({ id: "spremljeno", n: t("grupa_spremljeno"), c: "var(--accent)" });
  $("#chips").innerHTML = defs.map(d => `<button class="chip" data-g="${d.id}" aria-pressed="${S.grupa === d.id}">${d.c && S.grupa !== d.id ? `<span class="dot" style="background:${d.c}"></span>` : ""}${esc(d.n)}</button>`).join("");
}
$("#chips").addEventListener("click", e => { const b = e.target.closest(".chip"); if (!b) return; S.grupa = b.dataset.g; renderChips(); renderMarkers(); renderNear(); gcEv("filtar-" + (S.grupa || "sve")); });

function renderNear() {
  const r = ref();
  const list = vidljive().filter(p => p.podvrsta !== "naselje" && (S.grupa || p.moje || (p.vaznost || 1) <= 2)).map(p => ({ p, d: hav(r, p) })).sort((a, b) => a.d - b.d).slice(0, 6);
  $("#near").innerHTML = `<span class="grab"></span>
    <div class="between"><h2 style="font-size:1.3em">${S.pos ? t("blizu_tebe") : t("blizu_sredista")}</h2>
    ${S.pos ? `<span class="small muted">${esc(t("zracno"))}</span>` : `<button class="btn" id="nearLoc" style="min-height:38px">${esc(t("ukljuci_lokaciju"))}</button>`}</div>
    <div class="near-list">${list.map(({ p, d }) => `<button class="list-row" data-open="${p.moje ? "m:" : ""}${esc(p.id)}">
      <span class="dot" style="background:${boja(p)}"></span><span class="t"><b>${esc(tx(p).naziv || p.ime)}</b><span>${esc(katNaziv(p))}</span></span>
      <span class="mono small">${fmtDist(d)}</span></button>`).join("")}</div>`;
  layoutNear();
}
document.addEventListener("click", e => {
  const o = e.target.closest("[data-open]"); if (!o) return;
  const id = o.dataset.open;
  if (id.startsWith("m:")) openMoje(id.slice(2)); else if (RBY[id]) openRuta(id); else if (BY[id]) openTocka(id);
});
$("#near").addEventListener("click", e => { if (e.target.closest("#nearLoc")) locate(true); });
function layoutNear() { const h = $("#near").offsetHeight; if (h) document.documentElement.style.setProperty("--near-h", h + "px"); }
addEventListener("resize", layoutNear);

function locate(center) {
  if (!GEO) { toast(t("lokacija_nema")); return; }
  if (S.watch == null) {
    S.watch = GEO.watchPosition(p => {
      const first = !S.pos;
      S.pos = { lat: p.coords.latitude, lon: p.coords.longitude, acc: p.coords.accuracy, alt: p.coords.altitude }; S.posT = Date.now();
      const ll = [S.pos.lat, S.pos.lon];
      if (!userMarker) { userHalo = L.circle(ll, { radius: S.pos.acc, color: cv("--accent"), weight: 1, fillOpacity: .12 }).addTo(map); userMarker = L.circleMarker(ll, { radius: 9, color: cv("--marker-stroke"), weight: 3, fillColor: cv("--accent"), fillOpacity: 1 }).addTo(map); }
      else { userMarker.setLatLng(ll); userHalo.setLatLng(ll).setRadius(S.pos.acc); }
      if (first && center) map.setView(ll, 14);
      if (first) renderNear();
    }, () => toast(t("lokacija_odbijena")), { enableHighAccuracy: true, maximumAge: 10000, timeout: 30000 });
  } else if (S.pos) map.setView([S.pos.lat, S.pos.lon], Math.max(map.getZoom(), 14));
}
$("#btnLoc").addEventListener("click", () => locate(true));
$("#btnPopis").addEventListener("click", openPopis);
$("#btnAuto").addEventListener("click", openAuto);

/* trenutna lokacija: svježi položaj iz praćenja ako postoji, inače novo mjerenje */
function getPos(ok, fail) {
  if (S.pos && Date.now() - (S.posT || 0) < 30000) { ok({ ...S.pos }); return; }
  if (!GEO) { fail && fail(); toast(t("lokacija_nema")); return; }
  GEO.getCurrentPosition(p => ok({ lat: p.coords.latitude, lon: p.coords.longitude, acc: p.coords.accuracy, alt: p.coords.altitude }),
    () => { fail && fail(); toast(t("lokacija_odbijena")); }, { enableHighAccuracy: true, timeout: 30000, maximumAge: 10000 });
}

/* pretraga */
$("#q").addEventListener("input", () => {
  const q = norm($("#q").value.trim()), box = $("#results");
  if (q.length < 2) { box.hidden = true; return; }
  const pts = TOCKE.filter(p => norm(tx(p).naziv).includes(q)).slice(0, 8);
  const rts = RUTE.filter(r => norm(tx(r).naziv).includes(q)).slice(0, 3);
  box.hidden = false;
  box.innerHTML = (pts.length + rts.length) ? rts.map(r => `<button class="list-row" data-open="${r.id}"><span class="num r">R</span><span class="t"><b>${esc(tx(r).naziv)}</b><span>${esc(t("vrsta_" + r.vrsta))}</span></span></button>`).join("") +
    pts.map(p => `<button class="list-row" data-open="${p.id}"><span class="dot" style="background:${boja(p)}"></span><span class="t"><b>${esc(tx(p).naziv)}</b><span>${esc(katNaziv(p))}</span></span></button>`).join("")
    : `<div style="padding:10px 0">${medoOblak("", t("medo_trazi_nema", { q: $("#q").value }), null, 48)}</div>`;
});
$("#results").addEventListener("click", () => { $("#results").hidden = true; $("#q").value = ""; });

function netStatus() {
  if (PREGLED) { $("#netStatus").textContent = t("pregled_status"); return; }
  $("#netStatus").innerHTML = navigator.onLine ? `<span style="color:var(--ok);display:flex">${ic("check")}</span>${esc(t("offline_spremno"))}` : `<span style="color:var(--warn);display:flex">${ic("wifi_off")}</span>${esc(t("offline_bez_mreze"))}`;
}

addEventListener("online", netStatus); addEventListener("offline", netStatus);

/* ---------- list (sheet) ---------- */
let lastFocus = null, sheetCleanup = [];
function openSheet(label, html) {
  closeSheet(true);
  lastFocus = document.activeElement;
  $("#scrim").hidden = false; const sh = $("#sheet"); sh.hidden = false;
  sh.innerHTML = `<div class="sheet-bar"><span class="eyebrow">${esc(label)}</span><button class="sheet-close" id="sheetClose" aria-label="${esc(t("zatvori"))}">${ic("x")}</button></div><div class="sheet-body">${html}</div>`;
  sh.querySelector(".sheet-body").scrollTop = 0;
  $("#sheetClose").focus();
  return sh;
}
function closeSheet(keepFocus) {
  sheetCleanup.forEach(f => { try { f(); } catch (e) {} }); sheetCleanup = [];
  if ($("#sheet").hidden) return;
  $("#sheet").hidden = true; $("#scrim").hidden = true; $("#sheet").innerHTML = "";
  if (!keepFocus && lastFocus && lastFocus.focus) lastFocus.focus();
}
$("#scrim").addEventListener("click", () => closeSheet());
document.addEventListener("click", e => { if (e.target.closest("#sheetClose")) closeSheet(); });
document.addEventListener("keydown", e => { if (e.key === "Escape" && !$("#sheet").hidden) closeSheet(); });

/* ---------- točka ---------- */
function heroSvg(c) {
  return `<svg aria-hidden="true" viewBox="0 0 390 150" preserveAspectRatio="xMidYMid slice"><rect width="390" height="150" fill="${c}"/><path d="M0 90 L40 55 L80 75 L130 35 L175 70 L220 45 L270 78 L320 50 L390 80 L390 150 L0 150Z" fill="#1E3A2F" opacity=".55"/><path d="M0 110 L60 88 L120 104 L190 82 L250 106 L320 88 L390 108 L390 150 L0 150Z" fill="#1E3A2F" opacity=".8"/></svg>`;
}
/* ---------- radno vrijeme (OSM opening_hours, najčešći oblici) ---------- */
const DANI = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const hm = m => String(Math.floor(m / 60) % 24).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");
function rvParse(s) {
  if (!s) return null; s = s.trim();
  if (s === "24/7") return "24/7";
  const week = Array.from({ length: 7 }, () => []);
  for (let r of s.split(/;\s*|,\s+(?=(?:Mo|Tu|We|Th|Fr|Sa|Su|PH)\b)/)) {
    r = r.trim(); if (!r) continue;
    const m = r.match(/^((?:(?:Mo|Tu|We|Th|Fr|Sa|Su|PH)(?:-(?:Mo|Tu|We|Th|Fr|Sa|Su))?,?)+)\s+(.*)$/);
    let days, times;
    if (m) {
      days = new Set();
      for (const part of m[1].split(",")) {
        if (!part || part === "PH") continue;
        const [a, b] = part.split("-"), ia = DANI.indexOf(a), ib = b ? DANI.indexOf(b) : ia;
        if (ia < 0 || ib < 0) return null;
        for (let i = ia; ; i = (i + 1) % 7) { days.add(i); if (i === ib) break; }
      }
      times = m[2].trim();
    } else if (/^\d/.test(r)) { days = new Set([0, 1, 2, 3, 4, 5, 6]); times = r; }
    else return null;
    if (!days.size) continue;
    for (const d of days) week[d] = [];               /* kasnije pravilo zamjenjuje ranije */
    if (times === "off" || times === "closed") continue;
    for (const iv of times.split(",")) {
      const x = iv.trim().match(/^(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})$/); if (!x) return null;
      const a = +x[1] * 60 + +x[2]; let b = +x[3] * 60 + +x[4]; if (b <= a) b += 1440;
      for (const d of days) week[d].push([a, b]);
    }
  }
  return week;
}
function rvStanje(s, now = new Date()) {
  const w = rvParse(s); if (!w) return null; if (w === "24/7") return { otvoreno: true, stalno: true };
  const day = now.getDay(), min = now.getHours() * 60 + now.getMinutes();
  for (const [a, b] of w[day]) if (min >= a && min < b) return b - a >= 1440 ? { otvoreno: true, stalno: true } : { otvoreno: true, do: hm(b) };
  for (const [a, b] of w[(day + 6) % 7]) if (b > 1440 && min < b - 1440) return { otvoreno: true, do: hm(b) };
  for (let k = 0; k < 8; k++) {
    const d = (day + k) % 7, od = w[d].map(x => x[0]).filter(a => k > 0 || a > min).sort((x, y) => x - y);
    if (od.length) return { otvoreno: false, dan: k === 0 ? t("danas_rijec") : k === 1 ? t("sutra_rijec") : t("dani_kratko").split(",")[d], vrijeme: hm(od[0]) };
  }
  return { otvoreno: false };
}
function rvOznaka(u, kratko) {
  const st = rvStanje(u.radno_vrijeme);
  if (!st) return `<span class="rv nep">${esc(t(kratko ? "rv_nepoznato_kratko" : u.telefon ? "rv_nepoznato" : "rv_nepoznato_bez"))}</span>`;
  if (st.otvoreno) return `<span class="rv ok"><span class="dot"></span>${esc(st.stalno ? t("otvoreno_stalno") : t("otvoreno_do", { vrijeme: st.do }))}</span>`;
  return `<span class="rv ne"><span class="dot"></span>${esc(st.dan ? t("zatvoreno_otvara", { dan: st.dan, vrijeme: st.vrijeme }) : t("zatvoreno"))}</span>`;
}
function rvLjudski(s) {
  const hr = { Mo: "pon", Tu: "uto", We: "sri", Th: "čet", Fr: "pet", Sa: "sub", Su: "ned", PH: "praznici", off: "zatvoreno" };
  return s.split(/;\s*/).map(r => r.replace(/\b(Mo|Tu|We|Th|Fr|Sa|Su|PH|off)\b/g, m => hr[m])).join("\n");
}
function openUsluga(p) {
  const u = p.usluga, x = tx(p), d = S.pos ? hav(S.pos, p) : null, fav = S.favs.includes(p.id);
  const mail = `mailto:${CONFIG.kontakt}?subject=${encodeURIComponent(t("vlasnik_predmet", { naziv: x.naziv, id: p.id }))}`;
  openSheet(katNaziv(p), `<div class="stack">
    ${u.partner && u.slika ? `<figure class="hero foto ok" style="background:${boja(p)}"><img src="${esc(u.slika)}" alt=""></figure>` : ""}
    <div><span class="row small muted"><span class="dot" style="background:${boja(p)}"></span>${esc(katNaziv(p))}${u.kuhinja ? " · " + esc(u.kuhinja.replace(/_/g, " ").replace(/;/g, ", ")) : ""}${d != null ? " · " + fmtDist(d) + " " + esc(t("od_tebe")) : ""}</span>
      <h1>${esc(x.naziv)}</h1>${u.partner ? `<span class="badge free">${esc(t("partner"))}</span>` : ""}</div>
    ${rvOznaka(u)}
    <div class="row" style="flex-wrap:wrap"><button class="btn primary" id="tNav" style="flex:2 1 140px">${ic("nav")}${esc(t("vodi_me"))}</button>
      ${u.telefon ? `<a class="btn" style="flex:1 1 100px" href="tel:${esc(u.telefon.replace(/\s/g, ""))}">${ic("phone")}${esc(t("nazovi"))}</a>` : ""}
      ${u.web ? `<a class="btn" style="flex:1 1 90px" href="${esc(u.web)}" target="_blank" rel="noopener">${esc(t("web"))}</a>` : ""}
      <button class="btn" id="tFav" aria-pressed="${fav}" aria-label="${esc(fav ? t("spremljeno") : t("spremi"))}" style="flex:0 0 52px">${ic("star")}</button></div>
    ${x.opis ? `<p style="margin:0;font-size:1.06em">${esc(x.opis)}</p>` : ""}
    ${u.radno_vrijeme ? `<details class="tip"><summary>${esc(t("radno_vrijeme"))}</summary><p style="white-space:pre-line">${esc(rvLjudski(u.radno_vrijeme))}</p></details>` : ""}
    ${u.adresa || u.mjesto ? `<div class="row small"><b>${esc(t("adresa"))}:</b><span>${esc([u.adresa, u.mjesto].filter(Boolean).join(", "))}${u.lokacija_priblizna ? " · " + esc(t("lokacija_priblizna")) : ""}</span></div>` : ""}
    ${u.partner ? "" : `<div class="card stack" style="gap:8px"><b>${esc(t("vlasnik_naslov"))}</b><span class="small muted">${esc(t("vlasnik_tekst"))}</span><a class="btn" style="align-self:flex-start" href="${mail}">${ic("msg")}${esc(t("vlasnik_gumb"))}</a></div>`}
    <p class="small muted" style="margin:0">${esc(t(u.osm ? "usluga_izvor" : "usluga_izvor_vlasnik"))}</p></div>`);
  $("#tNav").onclick = () => openNav({ lat: p.lat, lon: p.lon }, x.naziv);
  $("#tFav").onclick = () => { S.favs = S.favs.includes(p.id) ? S.favs.filter(f => f !== p.id) : S.favs.concat(p.id); store.set("gk-fav", S.favs); renderChips(); openUsluga(p); };
  if (map) map.panTo([p.lat, p.lon]);
  gcEv("usluga");
}

/* ---------- Zelenkova putovnica ---------- */
const pecatZa = id => PUT.pecati.find(x => x.id === id);
const brojPecata = () => PUT.pecati.filter(x => S.pecati[x.id]).length;
function razinaZa(n) {
  const r = PUT.razine.filter(x => x.od <= n).pop() || { k: "turist", od: 0 }, sl = PUT.razine.find(x => x.od > n);
  return { r, sl };
}
function pecatHtml(p) {
  const pc = pecatZa(p.id); if (!pc) return "";
  if (S.pecati[p.id]) return `<div class="pecat-box ok">${medo(48, true)}<span class="t"><b>${esc(t("pecat_naslov"))}</b><span class="small">${esc(t("pecat_imas", { datum: new Date(S.pecati[p.id]).toLocaleDateString("hr-HR") }))}</span></span></div>`;
  const d = S.pos ? hav(S.pos, p) : null, blizu = d != null && d <= pc.r;
  return `<div class="pecat-box">${medo(48, true)}<span class="t"><b>${esc(t("pecat_naslov"))}</b>
    <span class="small muted">${esc(blizu ? "" : t("pecat_dodi", { r: fmtDist(pc.r) }) + " " + (d != null ? t("pecat_daleko", { d: fmtDist(d - pc.r) }) : t("pecat_gps")))}</span></span>
    ${blizu ? `<button class="btn primary" id="tPecat">${esc(t("pecat_uzmi"))}</button>` : ""}</div>`;
}
function uzmiPecat(id) {
  const p = BY[id], pc = pecatZa(id); if (!p || !pc || !S.pos) return;
  if (hav(S.pos, p) > pc.r) { toast(t("pecat_daleko", { d: fmtDist(hav(S.pos, p) - pc.r) })); return; }
  if ((S.pos.acc || 0) > Math.max(150, pc.r * 2)) { toast(t("pecat_netocno")); return; }
  const prije = razinaZa(brojPecata()).r.k;
  S.pecati[id] = new Date().toISOString(); store.set("gk-pecati", S.pecati);
  const n = brojPecata(), sad = razinaZa(n).r;
  gcEv("pecat");
  if (sad.k !== prije) {
    openSheet(t("putovnica"), `<div class="stack" style="align-items:center;text-align:center">${medo(140)}<h1>${esc(t("razina_nova", { razina: t("razina_" + sad.k) }))}</h1>
      <p style="margin:0">${esc(t("medo_razina", { razina: t("razina_" + sad.k) }))}</p><button class="btn primary block" id="pPut">${esc(t("putovnica"))}</button></div>`);
    $("#pPut").onclick = openPutovnica;
  } else { toast(t("pecat_ok", { n, ukupno: PUT.pecati.length })); openTocka(id); }
}
function putovnicaKartica() {
  if (!PUT.pecati.length) return "";
  const n = brojPecata(), N = PUT.pecati.length;
  return `<button class="card row" id="dPut" style="gap:12px;text-align:left;width:100%">${medo(52, true)}<span class="t" style="flex:1;display:flex;flex-direction:column;gap:6px">
    <b>${esc(t("putovnica"))}</b><span class="small muted">${esc(t("putovnica_stanje", { n, ukupno: N }))} · ${esc(t("razina_" + razinaZa(n).r.k))}</span>
    <span class="prog"><i style="width:${Math.round(100 * n / N)}%"></i></span></span>${ic("chevron")}</button>`;
}
function openPutovnica() {
  const n = brojPecata(), N = PUT.pecati.length, { r, sl } = razinaZa(n);
  const poruka = n >= N ? t("razina_sve") : t("razina_jos", { n: sl.od - n, razina: t("razina_" + sl.k) });
  openSheet(t("putovnica"), `<div class="stack">
    ${medoOblak(t("razina_" + r.k), poruka, null, 64)}
    <div class="stack" style="gap:6px"><span class="small muted">${esc(t("putovnica_stanje", { n, ukupno: N }))}</span><span class="prog"><i style="width:${Math.round(100 * n / N)}%"></i></span></div>
    <p class="small muted" style="margin:0">${esc(t("putovnica_uvod"))}</p>
    <div class="pecati">${PUT.pecati.filter(x => BY[x.id]).map(x => { const p = BY[x.id], ok = S.pecati[x.id];
      return `<button class="pecat${ok ? " ok" : ""}" data-open="${x.id}"><span class="krug">${medo(46, true)}</span>${esc(tx(p).naziv.replace(/\s*\(.*?\)/, ""))}${ok ? `<small>${new Date(ok).toLocaleDateString("hr-HR")}</small>` : ""}</button>`; }).join("")}</div></div>`);
}
document.addEventListener("click", e => {
  if (e.target.closest("#tPecat")) { const id = $("#sheet").dataset.tocka; if (id) uzmiPecat(id); }
  if (e.target.closest("#dPut") || e.target.closest("#sPut")) openPutovnica();
});

/* ---------- Zelenko (medo) ---------- */
const MEDO_TIJELO = '<path d="M44 240 C44 182 78 158 120 158 C162 158 196 182 196 240 Z" fill="#7A4A26"/><path d="M86 240 C86 204 100 188 120 188 C140 188 154 204 154 240 Z" fill="#C99A6B"/><path d="M74 178 L88 240" stroke="#C2700A" stroke-width="10" stroke-linecap="round"/><path d="M166 178 L152 240" stroke="#C2700A" stroke-width="10" stroke-linecap="round"/>';
const MEDO_GLAVA = '<circle cx="66" cy="70" r="22" fill="#7A4A26"/><circle cx="66" cy="70" r="11" fill="#C99A6B"/><circle cx="174" cy="70" r="22" fill="#7A4A26"/><circle cx="174" cy="70" r="11" fill="#C99A6B"/><ellipse cx="120" cy="112" rx="64" ry="58" fill="#8B5A33"/><ellipse cx="120" cy="134" rx="30" ry="22" fill="#E8C9A0"/><ellipse cx="120" cy="123" rx="11" ry="7.5" fill="#24160D"/><path d="M120 130 Q120 140 110 142 M120 130 Q120 140 130 142" stroke="#24160D" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="96" cy="104" r="6.5" fill="#24160D"/><circle cx="98.5" cy="101.5" r="2.2" fill="#fff"/><circle cx="144" cy="104" r="6.5" fill="#24160D"/><circle cx="146.5" cy="101.5" r="2.2" fill="#fff"/><circle cx="82" cy="126" r="7" fill="#E07A5F" opacity=".45"/><circle cx="158" cy="126" r="7" fill="#E07A5F" opacity=".45"/><path d="M80 66 Q82 30 120 28 Q158 30 160 66 Z" fill="#15803D"/><rect x="81" y="55" width="78" height="10" fill="#1A4129"/><ellipse cx="120" cy="67" rx="62" ry="10" fill="#1A4129"/><circle cx="144" cy="44" r="7.5" fill="#fff" stroke="#C62828" stroke-width="4"/>';
function medo(px, samoGlava) {
  return samoGlava
    ? `<svg aria-hidden="true" width="${px}" height="${px}" viewBox="36 20 168 168">${MEDO_GLAVA}</svg>`
    : `<svg aria-hidden="true" width="${px}" height="${Math.round(px * 1.1)}" viewBox="36 20 168 220">${MEDO_TIJELO}${MEDO_GLAVA}</svg>`;
}
/* oblačić s medom: naslov, tekst i po želji gumb koji otvara točku */
function medoOblak(naslov, tekst, ref, px = 76) {
  return `<div class="medo">${medo(px)}<div class="bubble">${naslov ? `<b>${esc(naslov)}</b>` : ""}<span>${esc(tekst)}</span>${ref && BY[ref] ? `<button class="medo-go" data-open="${ref}">${esc(t("medo_pokazi"))} ${esc(tx(BY[ref]).naziv)}${ic("chevron")}</button>` : ""}</div></div>`;
}
/* savjet dana: mrak > nevrijeme > vrućina > godišnje doba */
function medoSavjet(w, st, now, sez) {
  const h = now.getHours(), pozdrav = t(h < 10 ? "medo_jutro" : h < 18 ? "medo_dan" : "medo_vecer");
  const d = w && w.d, kod = d ? d.current.weather_code : null, temp = d ? d.current.temperature_2m : null;
  const min = st ? Math.round((st.set - now) / 6e4) : null;
  let k, ref = null;
  if (min != null && min < 0) k = "mrak";
  else if (min != null && min < 90) k = "mrak_blizu";
  else if (kod >= 95) k = "oluja";
  else if ((kod >= 71 && kod <= 77) || kod === 85 || kod === 86) { k = "snijeg"; ref = "P04"; }
  else if ((kod >= 51 && kod <= 67) || (kod >= 80 && kod <= 82)) { k = "kisa"; ref = "C01"; }
  else if (kod === 45 || kod === 48) k = "magla";
  else if (temp != null && temp >= 26) { k = "vruce"; ref = "V04"; }
  else { k = sez; ref = { jesen: "V08", zima: "P04", proljece: "V11", ljeto: "V02" }[sez]; }
  return medoOblak(pozdrav, t("medo_" + k, { min }), ref);
}
function openPozdrav() {
  openSheet(t("app_ime"), `<div class="stack" style="align-items:center;text-align:center">
    ${medo(150)}<h1>${esc(t("pozdrav_naslov"))}</h1><p style="margin:0;font-size:1.06em">${esc(t("pozdrav_tekst"))}</p>
    <div class="stack" style="gap:10px;text-align:left;width:100%">${["pozdrav_1", "pozdrav_2", "pozdrav_3"].map(k => `<div class="row" style="align-items:flex-start;gap:10px"><span style="color:var(--accent);margin-top:2px">${ic("check")}</span><span>${esc(t(k))}</span></div>`).join("")}</div>
    <button class="btn primary block" id="pKreni">${esc(t("pozdrav_kreni"))}</button></div>`);
  store.set("gk-pozdrav", true);
  $("#pKreni").onclick = () => closeSheet();
}

/* fotografija s Commonsa: autor i licenca uvijek uz sliku (uvjet CC BY / CC BY-SA) */
const fotoSrc = s => s.datoteka || s.url;
function slikaHtml(id, c) {
  const s = SLIKE[id];
  if (!s) return `<div class="hero">${heroSvg(c)}<span>${esc(t("fotografija_uskoro"))}</span></div>`;
  return `<figure class="hero foto" style="background:${c}">${heroSvg(c)}<img src="${esc(fotoSrc(s))}" alt="" decoding="async" onload="this.parentNode.classList.add('ok')" onerror="this.remove()">
    <figcaption><a href="${esc(s.izvor)}" target="_blank" rel="noopener">${esc(t("foto_autor", { autor: s.autor }))}</a> · <a href="${esc(s.licenca_url || s.izvor)}" target="_blank" rel="noopener">${esc(s.licenca)}</a></figcaption></figure>`;
}
function openTocka(id) {
  const p = BY[id]; if (!p) return; if (p.usluga) return openUsluga(p); const x = tx(p);
  const d = S.pos ? hav(S.pos, p) : null;
  const fav = S.favs.includes(id);
  const uRuti = RUTE.filter(r => r.tocke.includes(id));
  const blizu = TOCKE.filter(q => q.id !== id && q.podvrsta !== "naselje" && (q.vaznost || 1) <= 2).map(q => ({ q, d: hav(p, q) })).sort((a, b) => a.d - b.d).slice(0, 3);
  const iz = p.izvor || {};
  const izvor = iz.wikidata ? `${t("licenca_cc0")}${iz.veza === "okvirno" ? " · " + t("okvirno") : ""} · <a href="https://www.wikidata.org/wiki/${esc(iz.wikidata)}" target="_blank" rel="noopener">${esc(iz.wikidata)}</a>` : t("procjena");
  const mail = `mailto:${CONFIG.kontakt}?subject=${encodeURIComponent(t("javi_predmet", { naziv: x.naziv, id }))}`;
  openSheet(katNaziv(p), `<div class="stack">
    ${slikaHtml(id, boja(p))}
    <div><span class="row small muted"><span class="dot" style="background:${boja(p)}"></span>${esc(katNaziv(p))}${d != null ? " · " + fmtDist(d) + " " + esc(t("od_tebe")) : ""}</span><h1>${esc(x.naziv)}</h1></div>
    <div class="grid3"><button class="btn primary" id="tNav">${ic("nav")}${esc(t("vodi_me"))}</button>
      <button class="btn" id="tFav" aria-pressed="${fav}" aria-label="${esc(fav ? t("spremljeno") : t("spremi"))}">${ic("star")}</button>
      <button class="btn" id="tShare" aria-label="${esc(t("podijeli"))}">${ic("share")}</button></div>
    <p style="margin:0;font-size:1.06em">${esc(x.opis)}</p>
    ${pecatHtml(p)}
    ${p.napomena ? `<div class="note warn small">${esc(t("prototip_napomena", { tekst: p.napomena }))}</div>` : ""}
    ${uRuti.length ? `<section><h3>${esc(t("dio_rute"))}</h3>${uRuti.map(r => `<button class="list-row" data-open="${r.id}"><span class="num r">R</span><span class="t"><b>${esc(tx(r).naziv)}</b><span>${esc(t("vrsta_" + r.vrsta))} · ${esc(r.tezina)} · ${kmR(r)} km</span></span><span class="badge ${r.besplatno ? "free" : "pro"}">${esc(r.besplatno ? t("besplatno") : t("pro"))}</span></button>`).join("")}</section>` : ""}
    <section><h3>${esc(t("u_blizini"))}</h3>${blizu.map(({ q, d }) => `<button class="list-row" data-open="${q.id}"><span class="dot" style="background:${boja(q)}"></span><span class="t"><b>${esc(tx(q).naziv)}</b><span>${esc(katNaziv(q))}</span></span><span class="mono small">${fmtDist(d)}</span></button>`).join("")}</section>
    <div class="small muted" style="border-top:1px solid var(--line2);padding-top:12px;display:flex;flex-direction:column;gap:6px">
      <button class="mono" id="tCoord" style="all:unset;cursor:pointer;color:var(--ink2)">${fmtCoord(p.lat)} · ${fmtCoord(p.lon)}</button>
      <span>${esc(t("pouzdanost_" + p.pouzdanost))} · ${esc(t("izvor_koordinata"))}: ${izvor} · ${esc(t("izvor_opisa"))}: ${esc(t("opis_autor"))}</span>
      <a class="btn" style="align-self:flex-start" href="${mail}">${ic("msg")}${esc(t("javi_promjenu"))}</a>
    </div></div>`);
  $("#tNav").onclick = () => openNav({ lat: p.lat, lon: p.lon }, x.naziv);
  $("#tFav").onclick = () => { S.favs = S.favs.includes(id) ? S.favs.filter(f => f !== id) : S.favs.concat(id); store.set("gk-fav", S.favs); renderChips(); openTocka(id); gcEv("spremi"); };
  $("#tShare").onclick = () => sharePlace(x.naziv, p);
  $("#sheet").dataset.tocka = id;
  $("#tCoord").onclick = () => copy(`${p.lat.toFixed(5)}, ${p.lon.toFixed(5)}`);
  if (map) map.panTo([p.lat, p.lon]);
  gcEv("tocka");
}
function sharePlace(naziv, p) {
  const url = `https://www.openstreetmap.org/?mlat=${p.lat.toFixed(5)}&mlon=${p.lon.toFixed(5)}#map=15/${p.lat.toFixed(5)}/${p.lon.toFixed(5)}`;
  const text = t("podijeli_tekst", { naziv });
  if (navigator.share) navigator.share({ title: naziv, text, url }).catch(() => {}); else copy(text + " " + url);
}

/* popis svih vidljivih točaka */
function openPopis() {
  const r = ref();
  const list = vidljive().map(p => ({ p, d: hav(r, p) })).sort((a, b) => a.d - b.d).slice(0, 300);
  openSheet(t("popis_naslov"), `<p class="small muted" style="margin:0 0 4px">${esc(S.pos ? t("zracno") : t("blizu_sredista"))} · ${list.length}</p>` +
    list.map(({ p, d }) => `<button class="list-row" data-open="${p.moje ? "m:" : ""}${esc(p.id)}"><span class="dot" style="background:${boja(p)}"></span><span class="t"><b>${esc(tx(p).naziv || p.ime)}</b><span>${esc(katNaziv(p))}</span></span><span class="mono small">${fmtDist(d)}</span></button>`).join(""));
}

/* ---------- rute ---------- */
const kmR = r => r.km_gpx != null ? String(r.km_gpx).replace(".", ",") : "~" + r.km;
function rutaGrupa(r) { const h = satiMax(r.sati); return h <= 2.5 ? "kratko" : h <= 4 ? "pola" : "dan"; }
function rutaKartica(r, feat) {
  return `<button class="card list-row${feat ? " feat" : ""}" data-open="${r.id}" style="flex-direction:column;align-items:stretch;gap:6px;padding:14px">
    <span class="between" style="align-items:flex-start"><b style="font-size:1.1em;line-height:1.25">${esc(tx(r).naziv)}</b><span class="badge ${r.besplatno ? "free" : "pro"}">${esc(r.besplatno ? t("besplatno") : t("pro"))}</span></span>
    <span class="row small meta" style="gap:14px;color:var(--ink2)"><span>${esc(t("vrsta_" + r.vrsta))}</span><span>${esc(r.tezina)}</span><span class="mono">${kmR(r)} km</span><span class="mono">${esc(r.sati)} h</span></span>${feat ? `<span class="go">${esc(t("pogledaj_rutu"))}${ic("chevron")}</span>` : ""}</button>`;
}
function renderRute() {
  const P = S.plan;
  const grp = (key, label, opts) => `<div class="stack" style="gap:6px"><span class="eyebrow">${esc(t(label))}</span><div class="row" style="flex-wrap:wrap;gap:6px">${opts.map(([v, k]) => `<button class="chip soft" data-plan="${key}:${v}" aria-pressed="${P[key] === v}">${esc(t(k))}</button>`).join("")}</div></div>`;
  const fit = RUTE.filter(r => rutaGrupa(r) === P.vrijeme && (r.vrsta === "biciklisticka" ? "bicikl" : "pjesice") === P.kako && (P.s !== "djeca" || r.tezina === "lagano"));
  $("#rute").innerHTML = `<div class="between"><h1>${esc(t("rute"))}</h1><button class="sos" data-go="sigurnost" aria-label="${esc(t("sos_aria"))}">${esc(t("sos"))}</button></div>
    <section class="card stack" style="gap:12px"><h2>${esc(t("sto_danas"))}</h2>
      ${grp("vrijeme", "koliko_vremena", [["kratko", "vrijeme_kratko"], ["pola", "vrijeme_pola"], ["dan", "vrijeme_dan"]])}
      ${grp("s", "s_kim", [["drustvo", "s_drustvo"], ["djeca", "s_djeca"]])}
      ${grp("kako", "kako", [["pjesice", "kako_pjesice"], ["bicikl", "kako_bicikl"]])}</section>
    <div class="between"><h2>${esc(t("prijedlozi"))}</h2><span class="small muted">${esc(t("od_ruta", { n: fit.length, ukupno: RUTE.length }))}</span></div>
    ${fit.length ? fit.map(r => rutaKartica(r, true)).join("") : `<p class="muted" style="margin:0">${esc(t("nema_ruta"))}</p>`}
    <h2 style="margin-top:8px">${esc(t("sve_rute"))}</h2>${RUTE.map(r => rutaKartica(r)).join("")}`;
}
$("#rute").addEventListener("click", e => { const b = e.target.closest("[data-plan]"); if (!b) return; const [k, v] = b.dataset.plan.split(":"); S.plan[k] = v; renderRute(); gcEv("planer"); });

function openRuta(id) {
  const r = RBY[id]; if (!r) return; const x = tx(r);
  const stops = r.tocke.map(i => BY[i]).filter(Boolean);
  openSheet(t("vrsta_" + r.vrsta), `<div class="stack">
    <div class="row"><span class="badge ${r.besplatno ? "free" : "pro"}">${esc(r.besplatno ? t("besplatno") : t("pro"))}</span><span class="small muted">${esc(t("vrsta_" + r.vrsta))}</span></div>
    <h1>${esc(x.naziv)}</h1>
    <div class="stats"><div><b>${kmR(r)}</b><span>${esc(t("km"))}</span></div><div><b>${esc(r.sati)}</b><span>${esc(t("sati"))}</span></div><div><b>~${r.uspon_m}</b><span>${esc(t("m_uspona"))}</span></div><div><b>${esc(r.tezina)}</b><span>${esc(t("tezina"))}</span></div></div>
    <p style="margin:0;font-size:1.04em">${esc(x.opis)}</p>
    <p class="small muted" style="margin:0">${esc(t("procjena_rute"))}</p>
    <div class="row small"><b>${esc(t("parking"))}:</b><span>${esc(x.parking)}</span></div>
    ${r.polazista && r.polazista.length ? `<section class="card"><h3>${esc(t("polazista"))}</h3>${r.polazista.map(p => `<div class="between small" style="border-top:1px solid var(--line);min-height:40px"><span>${esc(p.naziv)}</span><span class="mono">${esc(p.vrijeme)}</span></div>`).join("")}</section>` : ""}
    <div><div class="mini-map" id="rutaMap"></div><p class="small muted" style="margin:6px 0 0">${esc(t("linija_skica"))}</p></div>
    <section><h3>${esc(t("stajalista"))}</h3>${stops.map((p, i) => `<button class="list-row" data-open="${p.id}"><span class="num">${i + 1}</span><span class="t"><b>${esc(tx(p).naziv)}</b><span>${esc(katNaziv(p))}</span></span></button>`).join("")}</section>
    ${r.besplatno ? "" : `<div class="note warn">${esc(t("pro_zakljucano"))}<br>${esc(t("pro_cijena"))}</div>`}
    <div class="grid2"><button class="btn primary" id="rKreni" ${r.besplatno ? "" : "disabled"}>${ic(r.besplatno ? "nav" : "lock")}${esc(t("kreni_rutom"))}</button><button class="btn" id="rKarta">${ic("map")}${esc(t("prikazi_na_karti"))}</button></div>
  </div>`);
  const mm = L.map("rutaMap", { zoomControl: false, attributionControl: false, dragging: true, scrollWheelZoom: false, preferCanvas: true });
  if (!PREGLED) L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 17, className: "osm-tiles" }).addTo(mm);
  const skini = addPodloga(mm, true);
  const ll = r.trasa ? r.trasa.map(([x, y]) => [y, x]) : stops.map(p => [p.lat, p.lon]);
  L.polyline(ll, { color: cv("--ink"), weight: 7, opacity: .5 }).addTo(mm);
  L.polyline(ll, { color: cv("--amber"), weight: 4, dashArray: r.trasa ? null : "8 8" }).addTo(mm);
  stops.forEach((p, i) => L.marker([p.lat, p.lon], { icon: L.divIcon({ className: "num-icon", html: String(i + 1), iconSize: [24, 24] }) }).addTo(mm));
  mm.fitBounds(L.latLngBounds(ll).pad(0.25)); setTimeout(() => mm.invalidateSize(), 60);
  sheetCleanup.push(() => { skini(); mm.remove(); });
  $("#rKreni").onclick = () => { if (r.besplatno && stops[0]) { openNav({ lat: stops[0].lat, lon: stops[0].lon }, tx(stops[0]).naziv); gcEv("ruta-kreni"); } };
  $("#rKarta").onclick = () => { closeSheet(); go("karta"); setTimeout(() => r.trasa ? pokaziRutu(id) : map.fitBounds(L.latLngBounds(ll).pad(0.3)), 80); };
  gcEv("ruta");
}

/* ---------- vodi me (GPS + kompas, radi bez signala) – preuzeto iz Gljiva Hrvatske ---------- */
const NAV = { watch: null, target: null, pos: null, head: null };
function onHead(e) { let h = null; if (e.webkitCompassHeading != null) h = e.webkitCompassHeading; else if (e.absolute && e.alpha != null) h = 360 - e.alpha; if (h != null) { NAV.head = h; navDraw(); } }
function navDraw() {
  const box = $("#navBox"); if (!box) return;
  if (!NAV.pos) { box.innerHTML = `<p class="muted" style="text-align:center">${esc(t("lokacija_trazim"))}</p>`; return; }
  const d = hav(NAV.pos, NAV.target), b = brg(NAV.pos, NAV.target), rel = NAV.head != null ? (b - NAV.head + 360) % 360 : b;
  const here = d < 25, dirs = T.smjerovi || [];
  const st = sunTimes(new Date(), NAV.pos.lat, NAV.pos.lon), now = new Date();
  let mrak = "–"; if (st) { const m = Math.round((st.set - now) / 6e4); mrak = m <= 0 ? t("mrak") : (m >= 60 ? Math.floor(m / 60) + " h " : "") + (m % 60) + " min"; }
  box.innerHTML = `<div class="nav-dist">${here ? esc(t("nav_stigao")) : fmtDist(d)}</div>
    <p style="text-align:center;margin:4px 0 0">${here ? "" : esc(t("nav_smjer", { smjer: dirs[Math.round(b / 45) % 8] || "", stupnjevi: Math.round(b) }))}</p>
    <div class="compass"><span class="c" style="top:8px;color:var(--sos)">S</span><span class="c" style="bottom:8px">J</span><span class="c" style="left:10px">Z</span><span class="c" style="right:10px">I</span>
      <svg viewBox="0 0 100 100" style="transform:rotate(${rel}deg)" role="img" aria-label="${esc(t("vodi_me"))}"><path d="M50 6 L80 88 L50 70 L20 88 Z" fill="${here ? cv("--ok") : cv("--accent")}"/></svg></div>
    <div class="grid2"><div class="card"><span class="eyebrow">${esc(t("do_mraka"))}</span><b style="display:block;font-size:1.15em">${esc(mrak)}</b><span class="small muted">${st ? esc(t("zalazak")) + " " + fmtTime(st.set) : ""}</span></div>
      <div class="card"><span class="eyebrow">GPS</span><b style="display:block;font-size:1.15em">±${Math.round(NAV.pos.acc || 0)} m</b><span class="small muted">${NAV.pos.alt != null ? esc(t("visina", { m: Math.round(NAV.pos.alt) })) : ""}</span></div></div>
    <p class="small muted" style="margin:0">${esc(NAV.head == null ? t("nav_kompas_nema") : t("nav_drzi"))} ${esc(t("nav_tocnost", { m: Math.round(NAV.pos.acc || 0) }))}</p>`;
}
function openNav(target, label) {
  NAV.target = target; NAV.pos = S.pos; NAV.head = null;
  openSheet(t("vodi_me") + " · " + label, `<div class="stack"><div id="navBox"></div><button class="btn" id="navCompass" hidden>${esc(t("nav_ukljuci_kompas"))}</button>
    <div class="grid2"><button class="btn" data-go="sigurnost">${esc(t("gdje_sam"))}</button><a class="btn danger" href="tel:112">112</a></div></div>`);
  navDraw();
  if (!GEO) { $("#navBox").innerHTML = `<p class="note warn">${esc(t("lokacija_nema"))}</p>`; return; }
  NAV.watch = GEO.watchPosition(p => { NAV.pos = { lat: p.coords.latitude, lon: p.coords.longitude, acc: p.coords.accuracy, alt: p.coords.altitude }; navDraw(); },
    () => { const b = $("#navBox"); if (b) b.innerHTML = `<p class="note warn">${esc(t("lokacija_odbijena"))}</p>`; }, { enableHighAccuracy: true, maximumAge: 5000, timeout: 30000 });
  const start = () => { addEventListener("deviceorientationabsolute", onHead); addEventListener("deviceorientation", onHead); };
  if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function") {
    const b = $("#navCompass"); const ask = () => DeviceOrientationEvent.requestPermission().then(r => { if (r === "granted") { start(); b.hidden = true; } else b.hidden = false; }).catch(() => { b.hidden = false; });
    b.onclick = ask; ask();
  } else start();
  sheetCleanup.push(() => { if (NAV.watch != null) GEO.clearWatch(NAV.watch); NAV.watch = null; removeEventListener("deviceorientationabsolute", onHead); removeEventListener("deviceorientation", onHead); });
  gcEv("navigacija");
}

/* ---------- auto ---------- */
function renderCarMarker() {
  if (!map) return; if (carMarker) { carMarker.remove(); carMarker = null; }
  if (S.car) carMarker = L.marker([S.car.lat, S.car.lon], { icon: L.divIcon({ className: "num-icon", html: "P", iconSize: [26, 26] }) }).addTo(map).on("click", openAuto);
}
function saveCar(after) {
  getPos(p => { S.car = { lat: p.lat, lon: p.lon, acc: p.acc, t: Date.now() }; store.set("gk-car", S.car); renderCarMarker(); gcEv("auto-spremljen"); if (after) after(); });
}
function carHtml() {
  return S.car ? `<p style="margin:0">${esc(t("auto_spremljen", { vrijeme: fmtTime(new Date(S.car.t)) }))}</p>
      <div class="grid2"><button class="btn primary" data-car="vodi">${esc(t("auto_vodi"))}</button><button class="btn" data-car="spremi">${esc(t("auto_spremi"))}</button></div>
      <button class="btn" data-car="obrisi" style="align-self:flex-start;min-height:40px">${esc(t("auto_obrisi"))}</button>`
    : `<p class="muted" style="margin:0">${esc(t("auto_nema"))}</p><button class="btn primary block" data-car="spremi">${esc(t("auto_spremi"))}</button>`;
}
function openAuto() { openSheet(t("auto_naslov"), `<div class="stack carbox">${carHtml()}</div>`); }
document.addEventListener("click", e => {
  const b = e.target.closest("[data-car]"); if (!b) return; const a = b.dataset.car;
  const refresh = () => document.querySelectorAll(".carbox").forEach(el => el.innerHTML = carHtml());
  if (a === "spremi") saveCar(refresh);
  if (a === "obrisi") { S.car = null; store.set("gk-car", null); renderCarMarker(); refresh(); }
  if (a === "vodi" && S.car) openNav({ lat: S.car.lat, lon: S.car.lon }, t("auto_cilj", { vrijeme: fmtTime(new Date(S.car.t)) }));
});

/* ---------- danas ---------- */
async function weather(lat, lon) {
  const c = store.get("gk-wx", null);
  if (c && Date.now() - c.t < 3600e3 && hav(c, { lat, lon }) < 15000) return c;
  if (!navigator.onLine) return c;
  try {
    const u = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(3)}&longitude=${lon.toFixed(3)}&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=Europe%2FZagreb&forecast_days=2`;
    const r = await fetch(u); if (!r.ok) throw 0; const d = await r.json();
    const v = { t: Date.now(), lat, lon, d }; store.set("gk-wx", v); return v;
  } catch (e) { return c; }
}
function wmo(c) { return (T.wmo && T.wmo[String(c)]) || ""; }
async function renderDanas() {
  const r = ref(), now = new Date(), st = sunTimes(now, r.lat, r.lon), sez = sezona(now);
  const datum = now.toLocaleDateString("hr-HR", { weekday: "long", day: "numeric", month: "long" });
  const wxCell = (lbl, big, small) => `<div><span class="eyebrow">${esc(lbl)}</span><b>${esc(big)}</b><span class="s">${esc(small)}</span></div>`;
  const draw = w => {
    const d = w && w.d;
    const cur = d ? wxCell(t("sada"), Math.round(d.current.temperature_2m) + "°", wmo(d.current.weather_code)) : wxCell(t("sada"), "–", "");
    const tom = d ? wxCell(t("sutra"), Math.round(d.daily.temperature_2m_max[1]) + "° / " + Math.round(d.daily.temperature_2m_min[1]) + "°", wmo(d.daily.weather_code[1])) : wxCell(t("sutra"), "–", "");
    return `<div class="wx">${cur}${wxCell(t("zalazak"), st ? fmtTime(st.set) : "–", t("vrati_se_prije_mraka"))}${tom}
      <span class="foot">${esc(w ? t("prognoza_spremljena", { vrijeme: fmtTime(new Date(w.t)) }) : t("prognoza_nema"))} ${esc(t("prognoza_izvor"))}</span></div>`;
  };
  const ideje = (DANAS.ideje || []).filter(i => i.sezone.includes(sez));
  const jelo = TOCKE.filter(p => p.kategorija === "jelo").map(p => ({ p, d: hav(r, p) })).sort((a, b) => a.d - b.d).slice(0, 3);
  const gladan = jelo.length ? `<section class="stack" style="gap:4px"><h2>${esc(t("gladan_naslov"))}</h2>${jelo.map(({ p, d }) => `<button class="list-row" data-open="${p.id}"><span class="dot" style="background:${boja(p)}"></span><span class="t"><b>${esc(tx(p).naziv)}</b><span>${esc(katNaziv(p))} · ${rvOznaka(p.usluga, true)}</span></span><span class="mono small">${fmtDist(d)}</span></button>`).join("")}</section>` : "";
  $("#danas").innerHTML = `<div class="between" style="align-items:flex-start"><div><span class="small muted">${esc(datum)} · ${esc(nearestPlace(r))}</span><h1>${esc(t("danas"))}</h1></div>
      <button class="sos" data-go="sigurnost" aria-label="${esc(t("sos_aria"))}">${esc(t("sos"))}</button></div>
    <div id="medoBox">${medoSavjet(store.get("gk-wx", null), st, now, sez)}</div>
    <div id="wxBox">${draw(store.get("gk-wx", null))}</div>
    ${putovnicaKartica()}
    <section class="stack" style="gap:8px"><h2>${esc(t("stanje_na_terenu"))}</h2>
      ${(DANAS.stanje || []).map(s => `<button class="card list-row" ${s.ref ? `data-open="${s.ref}"` : ""} style="align-items:flex-start;padding:12px 14px">
        <span class="dot" style="margin-top:6px;background:${s.razina === "upozorenje" ? "var(--warn)" : "var(--muted)"}"></span>
        <span class="t"><b>${esc(tx(s).naslov)}</b><span style="color:var(--ink2)">${esc(tx(s).opis)}</span><span>${esc(s.provjereno ? t("provjereno", { datum: new Date(s.provjereno).toLocaleDateString("hr-HR") }) : t("opce_upozorenje"))}</span></span></button>`).join("")}</section>
    ${ideje.length ? `<section class="stack" style="gap:8px"><h2>${esc(t("ideje_" + sez))}</h2><div class="ideas">${ideje.map(i => `<button class="idea" data-open="${i.ref}"><span class="top${SLIKE[i.ref] ? " foto" : ""}" style="background:${i.boja}${SLIKE[i.ref] ? `;background-image:url('${esc(fotoSrc(SLIKE[i.ref]))}')` : ""}"><span>${esc(tx(i).oznaka)}</span></span><span class="b"><b>${esc(tx(i).naslov)}</b><span>${esc(tx(i).opis)}</span></span></button>`).join("")}</div></section>` : ""}
    ${gladan}
    <a class="card row" href="${esc(DANAS.gljive_url)}" target="_blank" rel="noopener" style="text-decoration:none;color:var(--ink);gap:12px">
      <svg aria-hidden="true" width="36" height="36" viewBox="0 0 36 36"><path d="M4 18 C4 9 12 5 18 5 C24 5 32 9 32 18 Z" fill="#8A5A2B"/><rect x="14" y="18" width="8" height="12" rx="3" fill="#E9DCC6"/></svg>
      <span class="t" style="display:flex;flex-direction:column"><b>${esc(t("gljive_naslov"))}</b><span class="small muted">${esc(t("gljive_opis"))}</span></span></a>`;
  const w = await weather(r.lat, r.lon); const box = $("#wxBox"); if (box && w) { box.innerHTML = draw(w); const mb = $("#medoBox"); if (mb) mb.innerHTML = medoSavjet(w, st, now, sez); }
}

/* ---------- sigurnost ---------- */
let gdje = null;
function renderSigurnost() {
  const r = ref(), st = sunTimes(new Date(), r.lat, r.lon);
  const povratak = new Date(Date.now() + 4 * 3600e3); povratak.setMinutes(Math.ceil(povratak.getMinutes() / 15) * 15 % 60);
  const pv = String(povratak.getHours()).padStart(2, "0") + ":" + String(povratak.getMinutes()).padStart(2, "0");
  const tips = ["signal", "krpelji", "snijeg"];
  $("#sigurnost").innerHTML = `<h1>${esc(t("sigurnost"))}</h1>
    <a class="call" href="tel:112"><b>112</b><span style="display:flex;flex-direction:column;line-height:1.25"><strong>${esc(t("hitni_poziv"))}</strong><span>${esc(t("hgss_hitna"))}</span></span></a>
    <section class="card stack" style="gap:10px"><div class="between"><h2>${esc(t("gdje_sam"))}</h2><span class="small" style="color:var(--ok);font-weight:600">${esc(t("gps_bez_signala"))}</span></div>
      <div id="gdjeBox">${gdjeHtml()}</div></section>
    <section class="card stack" style="gap:10px"><h2>${esc(t("auto_naslov"))}</h2><div class="stack carbox" style="gap:10px">${carHtml()}</div></section>
    <section class="card stack" style="gap:10px"><h2>${esc(t("prije_polaska"))}</h2>
      <b>${esc(t("javi_kamo"))}</b><span class="small muted" style="margin-top:-8px">${esc(t("javi_kamo_opis"))}</span>
      <div class="grid2"><div class="field"><label for="jRuta">${esc(t("javi_ruta"))}</label><select id="jRuta">${RUTE.map(x => `<option>${esc(tx(x).naziv)}</option>`).join("")}<option>${esc(t("drugo"))}</option></select></div>
        <div class="field"><label for="jVrijeme">${esc(t("javi_povratak"))}</label><input id="jVrijeme" type="time" value="${pv}"></div></div>
      <button class="btn dark" id="jPosalji">${esc(t("javi_posalji"))}</button>
      <div class="between" style="border-top:1px solid var(--line);padding-top:8px"><span>${esc(t("zalazak_danas"))}</span><span class="mono">${st ? fmtTime(st.set) : "–"}</span></div></section>
    <section class="stack" style="gap:8px"><h2>${esc(t("u_sumi"))}</h2>${medoOblak(t("medo_sigurnost_n"), t("medo_sigurnost"), null, 64)}${tips.map(k => `<details class="tip"><summary>${esc(t("savjet_" + k + "_n"))}</summary><p>${esc(t("savjet_" + k + "_d"))}</p></details>`).join("")}</section>
    <section class="stack" style="gap:8px"><h2>${esc(t("vise"))}</h2>
      <button class="card list-row" id="sPut" style="padding:12px 14px"><span class="t"><b>${esc(t("putovnica"))}</b><span>${esc(t("putovnica_stanje", { n: brojPecata(), ukupno: PUT.pecati.length }))}</span></span></button>
      <button class="card list-row" id="sMoja" style="padding:12px 14px"><span class="t"><b>${esc(t("moja_mjesta"))}</b><span>${S.favs.length + S.moja.length}</span></span></button>
      <div class="card stack" style="gap:8px"><b>${esc(t("sigurnosna_kopija"))}</b><span class="small muted">${esc(t("kopija_opis"))}</span>
        <div class="grid2"><button class="btn" id="kIzvoz">${esc(t("kopija_izvoz"))}</button><label class="btn" for="kUvoz" style="cursor:pointer">${esc(t("kopija_uvoz"))}</label></div><input type="file" id="kUvoz" accept="application/json,.json" hidden></div>
      <div class="card stack" style="gap:8px"><b>${esc(t("tema"))}</b><div class="seg" role="group" aria-label="${esc(t("tema"))}">${[["sustav", "tema_sustav"], ["light", "tema_svijetla"], ["dark", "tema_tamna"]].map(([v, k]) => `<button data-tema="${v}" aria-pressed="${store.get("gk-tema", "sustav") === v}">${esc(t(k))}</button>`).join("")}</div></div>
      <label class="card row" for="bigTxt" style="justify-content:space-between;min-height:52px"><b>${esc(t("veliki_tekst"))}</b><input type="checkbox" id="bigTxt" ${document.documentElement.classList.contains("big") ? "checked" : ""} style="width:22px;height:22px;accent-color:var(--accent)"></label>
      <details class="tip"><summary>${esc(t("izvori_licence"))}</summary><p>${esc(t("izvori_tekst"))}</p>${Object.keys(SLIKE).length ? `<button class="btn" id="sFoto" style="margin-top:10px">${esc(t("foto_zasluge"))}</button>` : ""}</details>
      <details class="tip"><summary>${esc(t("o_aplikaciji"))}</summary><p>${esc(t("o_tekst"))} ${esc(t("verzija", { v: CONFIG.verzija }))}</p></details>
    </section>`;
}
function openFotoZasluge() {
  const po = {};
  for (const [id, s] of Object.entries(SLIKE)) (po[s.naslov] = po[s.naslov] || { s, ids: [] }).ids.push(id);
  openSheet(t("foto_zasluge"), `<p class="small muted" style="margin:0 0 8px">${esc(t("foto_zasluge_uvod"))}</p>` +
    Object.values(po).map(({ s, ids }) => `<div class="list-row" style="align-items:flex-start"><span class="t"><b>${esc(ids.map(i => BY[i] ? tx(BY[i]).naziv : i).join(", "))}</b>
      <span>${esc(t("foto_autor", { autor: s.autor }))} · <a href="${esc(s.licenca_url || s.izvor)}" target="_blank" rel="noopener">${esc(s.licenca)}</a> · <a href="${esc(s.izvor)}" target="_blank" rel="noopener">Wikimedia Commons</a></span></span></div>`).join(""));
}
function gdjeHtml() {
  if (!gdje) return `<button class="btn dark block" id="gdjeBtn">${esc(t("odredi_lokaciju"))}</button>`;
  const lat = gdje.lat.toFixed(5), lon = gdje.lon.toFixed(5), acc = Math.round(gdje.acc || 0);
  const body = t("sms_lokacija", { lat, lon, acc });
  return `<div class="mono" style="font-size:1.35em">${fmtCoord(gdje.lat)} · ${fmtCoord(gdje.lon)}</div>
    <span class="small muted">${esc(t("kod_mjesta", { mjesto: nearestPlace(gdje) }))}${gdje.alt != null ? " · " + esc(t("visina", { m: Math.round(gdje.alt) })) : ""} · ${esc(t("tocnost", { m: acc }))}</span>
    <div class="grid2" style="margin-top:8px"><a class="btn dark" href="sms:?&body=${encodeURIComponent(body)}">${esc(t("posalji_sms"))}</a><button class="btn" id="gdjeCopy">${esc(t("kopiraj"))}</button></div>`;
}
$("#sigurnost").addEventListener("click", e => {
  if (e.target.closest("#gdjeBtn")) {
    $("#gdjeBox").innerHTML = `<p class="muted">${esc(t("lokacija_trazim"))}</p>`;
    getPos(p => { gdje = p; $("#gdjeBox").innerHTML = gdjeHtml(); gcEv("gdje-sam"); },
      () => { $("#gdjeBox").innerHTML = `<p class="note warn">${esc(t("lokacija_odbijena"))}</p>`; });
  }
  if (e.target.closest("#gdjeCopy") && gdje) copy(`${gdje.lat.toFixed(5)}, ${gdje.lon.toFixed(5)}`);
  if (e.target.closest("#jPosalji")) { const body = t("sms_plan", { ruta: $("#jRuta").value, vrijeme: $("#jVrijeme").value }); location.href = "sms:?&body=" + encodeURIComponent(body); gcEv("javi-kamo"); }
  if (e.target.closest("#sMoja")) openMojaMjesta();
  if (e.target.closest("#sFoto")) openFotoZasluge();
  if (e.target.closest("#kIzvoz")) izvozKopije();
  const tb = e.target.closest("[data-tema]"); if (tb) { primijeniTemu(tb.dataset.tema); renderSigurnost(); }
});
$("#sigurnost").addEventListener("change", e => {
  if (e.target.id === "bigTxt") { document.documentElement.classList.toggle("big", e.target.checked); store.set("gk-big", e.target.checked); }
  if (e.target.id === "kUvoz" && e.target.files[0]) uvozKopije(e.target.files[0]);
});

/* ---------- moja mjesta ---------- */
function openMojaMjesta() {
  const favs = S.favs.map(i => BY[i]).filter(Boolean);
  openSheet(t("moja_mjesta"), `<div class="stack">
    ${favs.length + S.moja.length ? "" : medoOblak("", t("medo_prazno"), null, 64)}
    <div>${favs.map(p => `<button class="list-row" data-open="${p.id}"><span class="dot" style="background:${boja(p)}"></span><span class="t"><b>${esc(tx(p).naziv)}</b><span>${esc(katNaziv(p))}</span></span></button>`).join("")}
      ${S.moja.map(m => `<button class="list-row" data-open="m:${esc(m.id)}"><span class="dot" style="background:var(--accent)"></span><span class="t"><b>${esc(m.ime)}</b><span>${esc(t("kat_moje"))} · ${new Date(m.t).toLocaleDateString("hr-HR")}</span></span></button>`).join("")}</div>
    <div class="field"><label for="mIme">${esc(t("moje_mjesto_ime"))}</label><input id="mIme" maxlength="60" placeholder="${esc(t("moje_mjesto_zadano"))}"></div>
    <button class="btn primary" id="mDodaj">${esc(t("dodaj_moje_mjesto"))}</button></div>`);
  $("#mDodaj").onclick = () => {
    const ime = $("#mIme").value.trim() || t("moje_mjesto_zadano");
    getPos(p => {
      S.moja.push({ id: "m" + Date.now(), ime, lat: p.lat, lon: p.lon, t: Date.now() }); store.set("gk-moja", S.moja);
      renderChips(); renderMarkers(); openMojaMjesta(); gcEv("moje-mjesto");
    });
  };
}
function openMoje(id) {
  const m = S.moja.find(x => x.id === id); if (!m) return;
  openSheet(t("kat_moje"), `<div class="stack"><h1>${esc(m.ime)}</h1><span class="mono muted">${fmtCoord(m.lat)} · ${fmtCoord(m.lon)}</span>
    <div class="grid2"><button class="btn primary" id="mNav">${esc(t("vodi_me"))}</button><button class="btn" id="mDel">${esc(t("obrisi"))}</button></div></div>`);
  $("#mNav").onclick = () => openNav({ lat: m.lat, lon: m.lon }, m.ime);
  $("#mDel").onclick = () => { S.moja = S.moja.filter(x => x.id !== id); store.set("gk-moja", S.moja); renderChips(); renderMarkers(); closeSheet(); };
}

/* ---------- sigurnosna kopija ---------- */
async function izvozKopije() {
  const data = { app: "gk-vodic", v: 1, t: new Date().toISOString(), favs: S.favs, moja: S.moja, car: S.car, pecati: S.pecati, big: store.get("gk-big", false) };
  if (PREGLED) {
    const dl = window.claude && window.claude.use ? await window.claude.use("downloads") : null;
    if (!dl) { toast(t("pregled_nema_spremanja")); return; }
    try { await dl.save({ filename: "gorski-kotar-kopija-" + new Date().toISOString().slice(0, 10) + ".json", data: JSON.stringify(data, null, 1) }); } catch (e) {}
    return;
  }
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 1)], { type: "application/json" }));
  a.download = "gorski-kotar-kopija-" + new Date().toISOString().slice(0, 10) + ".json"; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
function uvozKopije(file) {
  file.text().then(s => {
    const d = JSON.parse(s); if (d.app !== "gk-vodic") throw 0;
    S.favs = Array.isArray(d.favs) ? d.favs.filter(i => BY[i]) : []; S.moja = Array.isArray(d.moja) ? d.moja : []; S.car = d.car || null; S.pecati = d.pecati && typeof d.pecati === "object" ? d.pecati : {};
    store.set("gk-pecati", S.pecati); store.set("gk-fav", S.favs); store.set("gk-moja", S.moja); store.set("gk-car", S.car); store.set("gk-big", !!d.big);
    document.documentElement.classList.toggle("big", !!d.big);
    renderChips(); renderMarkers(); renderCarMarker(); renderSigurnost(); toast(t("kopija_ok"));
  }).catch(() => toast(t("kopija_greska")));
}

/* ---------- pokretanje ---------- */
function applyI18n() {
  document.documentElement.lang = CONFIG.jezik;
  document.querySelectorAll("[data-t]").forEach(el => el.textContent = t(el.dataset.t));
  document.querySelectorAll("[data-ph]").forEach(el => el.placeholder = t(el.dataset.ph));
  document.querySelectorAll("[data-t-aria]").forEach(el => el.setAttribute("aria-label", t(el.dataset.tAria)));
}
async function boot() {
  { const tm = store.get("gk-tema", "sustav"); if (tm === "light" || tm === "dark") document.documentElement.setAttribute("data-theme", tm); }
  if (store.get("gk-big", false)) document.documentElement.classList.add("big");
  const get = u => PREGLED ? Promise.resolve(window.GK_DATA[u]) : fetch(u).then(r => { if (!r.ok) throw new Error(u); return r.json(); });
  get("data/podloga.json").then(d => { PODLOGA = d; if (map) { skiniPodlogu(); skiniPodlogu = addPodloga(map); } }).catch(() => {});
  const [i18n, tocke, rute, kat, danas, slike, usluge, put] = await Promise.all([get(`i18n/${CONFIG.jezik}.json`), get("data/tocke.json"), get("data/rute.json"), get("data/kategorije.json"), get("data/danas.json"), get("data/slike.json").catch(() => ({})), get("data/usluge.json").catch(() => ({ usluge: [] })), get("data/putovnica.json").catch(() => null)]);
  T = i18n; KAT = kat; DANAS = danas; SLIKE = slike || {}; if (put) PUT = put;
  TOCKE = tocke.tocke; RUTE = rute.rute;
  /* usluge (jelo, smještaj, kupnja) idu na kartu kao točke; partneri su istaknuti */
  for (const u of (usluge && usluge.usluge) || []) TOCKE.push({ id: u.id, kategorija: u.vrsta, podvrsta: u.podvrsta, tekst: { hr: { naziv: u.naziv, opis: u.opis || "" } }, lat: u.lat, lon: u.lon, vaznost: u.partner || u.podvrsta === "opg" ? 2 : 3, usluga: u });
  for (const p of TOCKE) { p.grupe = grupeOd(p); BY[p.id] = p; }
  for (const r of RUTE) RBY[r.id] = r;
  applyI18n(); netStatus(); renderChips(); initMap(); renderNear();
  const h = location.hash.slice(1); go(["karta", "danas", "rute", "sigurnost"].includes(h) ? h : "karta");
  gcInit();
  if (!store.get("gk-pozdrav", false)) setTimeout(openPozdrav, 500);
  if (!PREGLED && "serviceWorker" in navigator && location.protocol !== "file:") navigator.serviceWorker.register("sw.js").catch(() => {});
}
boot().catch(e => { document.body.innerHTML = `<p style="padding:24px;font:16px system-ui">Podaci se nisu učitali. Osvježi stranicu dok imaš signal.</p>`; console.error(e); });
