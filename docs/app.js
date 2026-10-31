/* Zelenko – offline vodič za Gorski kotar (prototip, faza 2)
   Tekstovi sučelja: i18n/<jezik>.json · sadržaj: data/*.json (tekstovi pod "tekst.<jezik>") */
"use strict";

const CONFIG = {
  verzija: "0.10.1",
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
  loc: '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
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
let T = {}, TOCKE = [], BY = {}, RUTE = [], RBY = {}, KAT = {}, DANAS = {}, PODLOGA = null, SLIKE = {}, PUT = { pecati: [], razine: [] }, INFO = {}, SPEC = { specijaliteti: [], izvori: [] }, LYNX = { cinjenice: [] };
function t(k, v) { let s = T[k] ?? k; if (v) for (const x in v) s = s.split("{" + x + "}").join(v[x]); return s; }
/* jezik: izbor u postavkama, inače po jeziku preglednika (hr, bs, sr, sh → hrvatski; ostalo → engleski) */
const JEZICI = ["hr", "en"];
CONFIG.jezik = (() => { const j = store.get("gk-jezik", null); if (JEZICI.includes(j)) return j;
  return (navigator.languages || [navigator.language || "hr"]).some(l => /^(hr|bs|sr|sh)\b/i.test(l)) ? "hr" : "en"; })();
const LOC = () => CONFIG.jezik === "hr" ? "hr-HR" : "en-GB";
/* prijevod podataka bez „tekst” strukture (specijaliteti, Lynx, informacije, polazišta): polje "<jezik>" preko hrvatskog */
const preko = o => { if (o && CONFIG.jezik !== "hr" && o[CONFIG.jezik]) Object.assign(o, o[CONFIG.jezik]); return o; };
const tx = o => (o && o.tekst && (o.tekst[CONFIG.jezik] || o.tekst.hr)) || {};

const S = {
  view: "karta", grupa: "", pos: null, watch: null,
  favs: store.get("gk-fav", []), moja: store.get("gk-moja", []), car: store.get("gk-car", null), pecati: store.get("gk-pecati", {}),
  plan: { vrijeme: "pola", s: "drustvo", kako: "pjesice" }
};

/* ---------- pomoćne ---------- */
function hav(a, b) { const R = 6371e3, r = Math.PI / 180, dLa = (b.lat - a.lat) * r, dLo = (b.lon - a.lon) * r; const x = Math.sin(dLa / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLo / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(x)); }
function brg(a, b) { const r = Math.PI / 180, y = Math.sin((b.lon - a.lon) * r) * Math.cos(b.lat * r), x = Math.cos(a.lat * r) * Math.sin(b.lat * r) - Math.sin(a.lat * r) * Math.cos(b.lat * r) * Math.cos((b.lon - a.lon) * r); return (Math.atan2(y, x) / r + 360) % 360; }
/* decimalni zarez na hrvatskom, točka na engleskom */
const dec = x => CONFIG.jezik === "hr" ? String(x).replace(/\./g, ",") : String(x).replace(/,/g, ".");
const tez = r => t("tez_" + r.tezina) || r.tezina;
function fmtDist(m) { return m < 1000 ? Math.round(m / 10) * 10 + " m" : dec((m / 1000).toFixed(m < 10000 ? 1 : 0)) + " km"; }
function fmtTime(d) { return d.toLocaleTimeString(LOC(), { hour: "2-digit", minute: "2-digit" }); }
function fmtCoord(x) { return dec(x.toFixed(5)); }
function norm(s) { return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d"); }
function toast(msg) { const el = $("#toast"); el.textContent = msg; el.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => el.hidden = true, 2200); }
function copy(text) { (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(() => toast(t("kopirano")), () => { window.prompt("", text); }); }
function ref() { if (S.pos) return S.pos; const c = map ? map.getCenter() : { lat: CONFIG.centar[0], lng: CONFIG.centar[1] }; return { lat: c.lat, lon: c.lng }; }
function nearestPlace(p) { let best = null; for (const x of TOCKE) if (x.podvrsta === "naselje") { const d = hav(p, x); if (!best || d < best.d) best = { d, x }; } return best ? tx(best.x).naziv : ""; }
function boja(p) { return p.moje ? cv("--accent") : (KAT.boje[p.podvrsta === "naselje" ? "naselje" : p.kategorija] || "#56606B"); }
function katNaziv(p) { if (p.moje) return t("kat_moje"); if (p.usluga && p.usluga.i_jelo) return t("pod_" + p.podvrsta) + " · " + t("pod_restoran").toLowerCase(); if (p.usluga && p.usluga.i_spavanje) return t("pod_" + p.podvrsta) + " · " + t("sobe"); if (p.podvrsta === "naselje") return t("kat_naselje"); const k = "pod_" + p.podvrsta; return T[k] || t("kat_" + p.kategorija); }
function grupeOd(p) {
  return KAT.grupe.filter(g => g.pravila.some(([k, pod]) => k === p.kategorija && (pod === "*" || pod === p.podvrsta || (pod[0] === "!" && pod.slice(1) !== p.podvrsta)))).map(g => g.id);
}
const zimskiMjesec = (d = new Date()) => [11, 12, 1, 2, 3].includes(d.getMonth() + 1);
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
  for (const v of ["karta", "danas", "gastro", "rute", "moje", "sigurnost"]) $("#v-" + v).hidden = v !== view;
  document.querySelectorAll(".tabs button").forEach(b => { if (b.dataset.go === view) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current"); });
  if (view === "karta" && map) setTimeout(() => map.invalidateSize(), 50);
  if (view === "danas") renderDanas();
  if (view === "rute") renderRute();
  if (view === "sigurnost") renderSigurnost();
  if (view === "gastro") renderGastro();
  if (view === "moje") renderMoje();
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
const trasaLL = r => r.trasa_dijelovi ? r.trasa_dijelovi.map(d => d.map(([x, y]) => [y, x])) : r.trasa ? [r.trasa.map(([x, y]) => [y, x])] : null;
function pokaziRutu(id) {
  const r = RBY[id]; if (!r || !trasaLL(r)) return;
  if (rutaLayer) map.removeLayer(rutaLayer);
  const ll = trasaLL(r);
  rutaLayer = L.layerGroup([L.polyline(ll, { color: cv("--ink"), weight: 8, opacity: .55, interactive: false }), L.polyline(ll, { color: cv("--amber"), weight: 5, interactive: false })]).addTo(map);
  S.ruta = id; const pill = $("#routePill"); pill.hidden = false;
  pill.innerHTML = `${ic("route")}<span>${esc(tx(r).naziv)}</span><span style="display:flex;padding:8px" aria-hidden="true">${ic("x")}</span>`;
  pill.setAttribute("aria-label", t("makni_rutu") + ": " + tx(r).naziv);
  map.fitBounds(L.latLngBounds(ll.flat()).pad(0.2));
}
function skloniRutu() { if (rutaLayer) map.removeLayer(rutaLayer); rutaLayer = null; S.ruta = null; $("#routePill").hidden = true; }
$("#routePill").addEventListener("click", skloniRutu);
function vidljive() {
  const g = S.grupa;
  const all = TOCKE.concat(S.moja.map(m => ({ ...m, moje: true })));
  if (S.trazi) return all.filter(p => !p.moje && S.trazi.ids.has(p.id));
  if (!g) return all;
  if (g === "spremljeno") return all.filter(p => p.moje || S.favs.includes(p.id));
  return all.filter(p => !p.moje && p.grupe.includes(g));
}
/* bez filtra: manje točke (važnost 2 i 3) pojavljuju se tek kad približiš kartu */
function prag(z) { return z < 11 ? 1 : z < 13 ? 2 : 3; }
function renderMarkers() {
  layer.clearLayers();
  const max = S.grupa || S.trazi ? 3 : prag(map.getZoom()), stroke = cv("--marker-stroke");
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
  let gr = KAT.grupe.filter(g => counts[g.id]);
  if (zimskiMjesec()) gr = gr.filter(g => g.id === "zima").concat(gr.filter(g => g.id !== "zima"));   /* zimi je „Zima” prvi filter */
  const defs = [{ id: "", n: t("sve") }].concat(gr.map(g => ({ id: g.id, n: t("grupa_" + g.id), c: g.boja })));
  if (S.favs.length || S.moja.length) defs.push({ id: "spremljeno", n: t("grupa_spremljeno"), c: "var(--accent)" });
  $("#chips").innerHTML = defs.map(d => `<button class="chip" data-g="${d.id}" aria-pressed="${S.grupa === d.id}">${d.c && S.grupa !== d.id ? `<span class="dot" style="background:${d.c}"></span>` : ""}${esc(d.n)}</button>`).join("");
}
$("#chips").addEventListener("click", e => { const b = e.target.closest(".chip"); if (!b) return; if (S.trazi) { S.trazi = null; $("#searchPill").hidden = true; } S.grupa = b.dataset.g; renderChips(); renderMarkers(); renderNear(); gcEv("filtar-" + (S.grupa || "sve")); });

function renderNear() {
  const r = ref();
  const list = vidljive().filter(p => (S.trazi || p.podvrsta !== "naselje") && (S.grupa || S.trazi || p.moje || (p.vaznost || 1) <= 2)).map(p => ({ p, d: hav(r, p) })).sort((a, b) => a.d - b.d).slice(0, 6);
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

/* pretraga: svaka riječ upita traži se u nazivu, vrsti, mjestu i opisu; rezultati po poklapanju, važnosti i udaljenosti */
let IDX = null, MJESTA_K = new Set();
const rijeci = s => norm(s).split(/[^a-z0-9]+/).filter(Boolean);
/* lagano skidanje padežnih nastavaka: „Fužinama” i „Fužine” → „fuzin”, „crkve” i „crkva” → „crkv” */
const NASTAVCI = ["ama", "ima", "ovi", "ova", "eve", "om", "em", "ih", "oj", "u", "a", "e", "i", "o"];
const korijen = w => { for (const n of NASTAVCI) if (w.endsWith(n) && w.length - n.length >= 4) return w.slice(0, -n.length); return w; };
function gradiIndeks() {
  const MJ = TOCKE.filter(x => x.podvrsta === "naselje");
  const sin = T.trazi_sinonimi || {};            /* {"jelo": "hrana jesti ...", ...} po grupi ili podvrsti */
  const ul = (naziv, vrsta, mjesto, opis, vrsta2 = "") => {
    const n = rijeci(naziv), k = rijeci(vrsta), k2 = rijeci(vrsta2), m = rijeci(mjesto);
    return { n, nn: norm(naziv), k, k2, m, nk: n.map(korijen), kk: k.map(korijen), kk2: k2.map(korijen), mk: m.map(korijen), o: norm(opis || "") };
  };
  MJESTA_K = new Set(MJ.flatMap(x => rijeci(tx(x).naziv).map(korijen)));
  IDX = TOCKE.map(p => {
    let mj = ""; if (p.podvrsta !== "naselje") { let best = null; for (const x of MJ) { const d = hav(p, x); if (!best || d < best.d) best = { d, x }; } if (best && best.d < 6000) mj = tx(best.x).naziv; }
    const mjd = mj; if (p.usluga && p.usluga.mjesto) mj += " " + p.usluga.mjesto;
    const vr = katNaziv(p) + " " + (sin[p.podvrsta] || ""), vr2 = [t("kat_" + p.kategorija)].concat(p.grupe.map(g => t("grupa_" + g)), p.grupe.map(k => sin[k] || "")).join(" ");
    return { tip: "t", id: p.id, p, ...ul(tx(p).naziv, vr, mj, tx(p).opis, vr2), mjd, nas: p.podvrsta === "naselje", v: p.vaznost || 1 };
  }).concat(RUTE.map(r => ({ tip: "r", id: r.id, r, ...ul(tx(r).naziv, vrstaR(r) + " " + t("rute") + " " + (sin[r.bicikl === "mtb" ? "mtb" : r.vrsta] || ""), tx(r).parking || "", tx(r).opis), v: 1 })),
    (SPEC.specijaliteti || []).map(x => ({ tip: "s", id: x.id, x, ...ul(x.naziv, t("spec_vrsta_" + x.vrsta) + " " + (sin.specijalitet || ""), "", x.opis), v: 1 })));
}
function lev(a, b, max) {                       /* udaljenost uređivanja s zamjenom susjednih slova, prekida iznad max */
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) {
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
  }
  return d[a.length][b.length];
}
const ZANEMARI = new Set(["u", "na", "i", "kod", "do", "od", "za", "s", "sa", "the", "a"]);
function bodovi(e, tok, krivo, mjesto) {
  const kt = korijen(tok), poc = (lista, x) => lista.some(w => w.startsWith(x));
  /* riječ koja je ime mjesta („Fužine”, „Lokvama”): samo naselje dobiva puni pogodak, ostalo se mjeri kao „u tom mjestu” */
  if (mjesto && !e.nas) return (poc(e.mk, kt) || poc(e.nk, kt)) ? 5 : 0;
  if (e.n.includes(tok)) return 14;
  if (poc(e.n, tok)) return 11;
  if (poc(e.nk, kt)) return 9;
  if (tok.length >= 3 && e.nn.includes(tok)) return 8;
  if (poc(e.k, tok) || poc(e.kk, kt)) return 7;
  if (poc(e.k2, tok) || poc(e.kk2, kt)) return 5;
  if (poc(e.m, tok) || poc(e.mk, kt)) return 5;
  if (tok.length >= 4 && e.o.includes(kt)) return 2;
  if (krivo && tok.length >= 4) { const max = tok.length >= 8 ? 2 : 1; if (e.n.concat(e.k, e.m).some(w => lev(tok, w.slice(0, tok.length + 1), max) <= max || lev(tok, w, max) <= max)) return 4; }
  return 0;
}
function trazi(q, krivo) {
  if (!IDX) gradiIndeks();
  const tok = rijeci(q).filter(w => !ZANEMARI.has(w)); if (!tok.length) return [];
  const r = ref(), out = [];
  for (const e of IDX) {
    let b = 0; for (const w of tok) { const x = bodovi(e, w, krivo, MJESTA_K.has(korijen(w))); if (!x) { b = 0; break; } b += x; }
    if (!b) continue;
    const d = e.p ? hav(r, e.p) : 0;
    out.push({ e, b: b + (e.v === 1 ? 5 : e.v === 2 ? 2 : 0) - (S.pos && e.p ? Math.min(3, d / 10000) : 0), d });
  }
  return out.sort((a, b) => b.b - a.b || a.d - b.d);
}
$("#q").addEventListener("input", () => {
  const q = $("#q").value.trim(), box = $("#results");
  if (norm(q).length < 2) { box.hidden = true; return; }
  let res = trazi(q, false), krivo = false;
  if (!res.length) { res = trazi(q, true); krivo = res.length > 0; }
  const moja = S.moja.filter(m => rijeci(q).every(w => norm(m.ime).includes(w)));
  const pts = res.filter(x => x.e.tip === "t"), cap = { t: 8, r: 3, s: 2 }, prikaz = res.filter(x => cap[x.e.tip]-- > 0);
  S.zadnjaPretraga = { q, ids: pts.map(x => x.e.id) };
  box.hidden = false;
  box.innerHTML = (prikaz.length + moja.length) ?
    (krivo ? `<p class="small muted" style="margin:10px 0 0">${esc(t("trazi_slicno"))}</p>` : "") +
    moja.map(m => `<button class="list-row" data-open="m:${esc(m.id)}"><span class="dot" style="background:var(--accent)"></span><span class="t"><b>${esc(m.ime)}</b><span>${esc(t("kat_moje"))}</span></span></button>`).join("") +
    prikaz.map(({ e, d }) => e.tip === "t" ? `<button class="list-row" data-open="${e.id}"><span class="dot" style="background:${boja(e.p)}"></span><span class="t"><b>${esc(tx(e.p).naziv)}</b><span>${esc(katNaziv(e.p))}${e.mjd && !norm(tx(e.p).naziv).includes(norm(e.mjd)) ? " · " + esc(e.mjd) : ""}</span></span>${S.pos ? `<span class="small muted mono">${fmtDist(d)}</span>` : ""}</button>`
      : e.tip === "r" ? `<button class="list-row" data-open="${e.id}"><span class="num r">R</span><span class="t"><b>${esc(tx(e.r).naziv)}</b><span>${esc(vrstaR(e.r))}</span></span></button>`
      : `<button class="list-row" data-spec="${e.id}"><span class="dot" style="background:${e.x.boja}"></span><span class="t"><b>${esc(e.x.naziv)}</b><span>${esc(t("spec_vrsta_" + e.x.vrsta))}</span></span></button>`).join("") +
    (pts.length > 1 ? `<button class="btn block" id="qSve" style="margin:10px 0">${ic("map")}${esc(t("trazi_sve", { n: pts.length }))}</button>` : "")
    : `<div style="padding:10px 0">${medoOblak("", t("medo_trazi_nema", { q }), null, 48)}</div>`;
});
$("#q").addEventListener("keydown", e => { if (e.key === "Enter" && S.zadnjaPretraga && S.zadnjaPretraga.ids.length) { e.preventDefault(); pokaziPretragu(); } });
$("#results").addEventListener("click", e => {
  if (e.target.closest("#qSve")) { pokaziPretragu(); return; }
  const sp = e.target.closest("[data-spec]"); if (sp) openSpec(sp.dataset.spec);
  $("#results").hidden = true; $("#q").value = "";
});
function pokaziPretragu() {
  const z = S.zadnjaPretraga; if (!z) return;
  S.trazi = { q: z.q, ids: new Set(z.ids) }; S.grupa = "";
  $("#results").hidden = true; $("#q").value = ""; $("#q").blur();
  const pill = $("#searchPill"); pill.hidden = false;
  pill.innerHTML = `<svg class="ic" aria-hidden="true" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><span>${esc(t("trazi_pill", { q: z.q, n: z.ids.length }))}</span><span style="display:flex;padding:8px" aria-hidden="true">${ic("x")}</span>`;
  pill.setAttribute("aria-label", t("trazi_makni"));
  renderChips(); renderMarkers(); renderNear();
  const ll = z.ids.map(i => BY[i]).filter(Boolean).map(p => [p.lat, p.lon]);
  if (ll.length) map.fitBounds(L.latLngBounds(ll).pad(0.2), { maxZoom: 15 });
  gcEv("pretraga-karta");
}
function makniPretragu() { S.trazi = null; $("#searchPill").hidden = true; renderMarkers(); renderNear(); }
$("#searchPill").addEventListener("click", makniPretragu);

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
const MJ = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MJ_RE = "(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)";
/* tjedan (7 dana, svaki s intervalima u minutama) koji vrijedi u zadanom mjesecu; null = oblik koji ne razumijemo */
function rvParse(s, mjesec = new Date().getMonth()) {
  if (!s) return null; s = s.trim();
  if (s === "24/7") return "24/7";
  const week = Array.from({ length: 7 }, () => []);
  for (let r of s.split(/;\s*|,\s+(?=(?:Mo|Tu|We|Th|Fr|Sa|Su|PH|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b)/)) {
    r = r.trim(); if (!r) continue;
    const mm = r.match(new RegExp("^(" + MJ_RE + "(?:-" + MJ_RE + ")?(?:," + MJ_RE + "(?:-" + MJ_RE + ")?)*):?\\s+(.*)$"));
    if (mm) {
      let u = false;
      for (const part of mm[1].split(",")) {
        const [a, b] = part.split("-"), ia = MJ.indexOf(a), ib = b ? MJ.indexOf(b) : ia;
        for (let i = ia; ; i = (i + 1) % 12) { if (i === mjesec) u = true; if (i === ib) break; }
      }
      if (!u) continue;                                /* pravilo za druge mjesece */
      r = mm[2].trim();
    }
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
  const w = rvParse(s, now.getMonth()); if (!w) return null; if (w === "24/7") return { otvoreno: true, stalno: true };
  const day = now.getDay(), min = now.getHours() * 60 + now.getMinutes();
  for (const [a, b] of w[day]) if (min >= a && min < b) return b - a >= 1440 ? { otvoreno: true, stalno: true } : { otvoreno: true, do: hm(b) };
  for (const [a, b] of w[(day + 6) % 7]) if (b > 1440 && min < b - 1440) return { otvoreno: true, do: hm(b) };
  for (let k = 0; k < 8; k++) {
    const dt = new Date(now.getTime() + k * 864e5), wk = k ? rvParse(s, dt.getMonth()) : w, d = dt.getDay();
    const od = wk[d].map(x => x[0]).filter(a => k > 0 || a > min).sort((x, y) => x - y);
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
  const hr = T.rv_kratice || {};
  if (s.trim() === "24/7") return t("otvoreno_stalno");
  return s.split(/;\s*/).map(r => r.replace(/\b(Mo|Tu|We|Th|Fr|Sa|Su|PH|off|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/g, m => hr[m] || m)).join("\n");
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
      <button class="btn" id="tKarta" style="flex:1 1 100px">${ic("map")}${esc(t("na_karti"))}</button>
      <button class="btn" id="tFav" aria-pressed="${fav}" aria-label="${esc(fav ? t("spremljeno") : t("spremi"))}" style="flex:0 0 52px">${ic("star")}</button></div>
    ${x.opis ? `<p style="margin:0;font-size:1.06em">${esc(x.opis)}</p>` : ""}
    ${u.radno_vrijeme ? `<details class="tip"><summary>${esc(t("radno_vrijeme"))}</summary><p style="white-space:pre-line">${esc(rvLjudski(u.radno_vrijeme))}</p></details>` : ""}
    ${u.adresa || u.mjesto ? `<div class="row small"><b>${esc(t("adresa"))}:</b><span>${esc([u.adresa, u.mjesto].filter(Boolean).join(", "))}${u.lokacija_priblizna ? " · " + esc(t("lokacija_priblizna")) : ""}</span></div>` : ""}
    ${u.partner ? "" : `<div class="card stack" style="gap:8px"><b>${esc(t("vlasnik_naslov"))}</b><span class="small muted">${esc(t("vlasnik_tekst"))}</span><a class="btn" style="align-self:flex-start" href="${mail}">${ic("msg")}${esc(t("vlasnik_gumb"))}</a></div>`}
    <p class="small muted" style="margin:0">${esc(t(u.osm ? "usluga_izvor" : "usluga_izvor_vlasnik"))}</p></div>`);
  $("#tNav").onclick = () => openNav({ lat: p.lat, lon: p.lon }, x.naziv);
  $("#tKarta").onclick = () => istakniNaKarti(p);
  $("#tFav").onclick = () => { S.favs = S.favs.includes(p.id) ? S.favs.filter(f => f !== p.id) : S.favs.concat(p.id); store.set("gk-fav", S.favs); renderChips(); openUsluga(p); };
  if (map) map.panTo([p.lat, p.lon]);
  gcEv("usluga");
}

/* ---------- Informacije o mjestu (radno vrijeme, ulaznice, kontakt) ---------- */
function infoHtml(p) {
  const i = INFO[p.id]; if (!i) return "";
  const red = (k, v) => `<div class="info-red"><span>${esc(k)}</span><b>${esc(v)}</b></div>`;
  const dijelovi = [];
  if (i.rv) dijelovi.push(rvOznaka({ radno_vrijeme: i.rv, telefon: i.telefon }));
  if (i.rv_tekst) dijelovi.push(`<ul class="info-rv">${i.rv_tekst.map(x => `<li>${esc(x)}</li>`).join("")}</ul>`);
  else if (i.rv && rvParse(i.rv)) dijelovi.push(`<p class="small" style="margin:0;white-space:pre-line;color:var(--ink2)">${esc(rvLjudski(i.rv))}</p>`);
  if (i.ulaznica) dijelovi.push(`<div class="info-tab">${i.ulaznica.map(([k, v]) => red(k, v)).join("")}</div>`);
  else if (i.ulaz) dijelovi.push(`<span class="small">${esc(t(i.ulaz === "placa" ? "ulaz_placa" : "ulaz_besplatan"))}</span>`);
  if (i.trajanje) dijelovi.push(`<span class="small">${esc(i.trajanje)}</span>`);
  if (i.savjet) dijelovi.push(`<span class="small">${esc(i.savjet)}</span>`);
  if (i.napomena) dijelovi.push(`<div class="note warn small">${esc(i.napomena)}</div>`);
  const gumbi = [
    i.telefon ? `<a class="btn" href="tel:${esc(i.telefon.replace(/\s/g, ""))}">${ic("phone")}${esc(t("nazovi"))}</a>` : "",
    i.web_ulaznice ? `<a class="btn" href="${esc(i.web_ulaznice)}" target="_blank" rel="noopener">${esc(t("kupi_ulaznicu"))}</a>` : "",
    i.web ? `<a class="btn" href="${esc(i.web)}" target="_blank" rel="noopener">${esc(t("sluzbena_stranica"))}</a>` : "",
    i.email ? `<a class="btn" href="mailto:${esc(i.email)}">${esc(t("posalji_email"))}</a>` : ""].filter(Boolean);
  if (gumbi.length) dijelovi.push(`<div class="row" style="flex-wrap:wrap">${gumbi.join("")}</div>`);
  const izv = i.provjereno ? t("info_izvor", { izvor: i.izvor, datum: new Date(i.provjereno).toLocaleDateString(LOC()) }) : t("info_izvor_osm");
  return `<section class="card stack" style="gap:10px"><h3>${esc(t("informacije"))}</h3>${dijelovi.join("")}
    <span class="small muted">${i.izvor_url ? `<a href="${esc(i.izvor_url)}" target="_blank" rel="noopener">${esc(izv)}</a>` : esc(izv)}${i.rv_izvor ? " " + esc(t("info_rv_osm")) : ""}</span></section>`;
}

/* ---------- Zelenkova putovnica ---------- */
const pecatZa = id => PUT.pecati.find(x => x.id === id);
const brojPecata = () => PUT.pecati.filter(x => S.pecati[x.id]).length;
function razinaZa(n) {
  const r = PUT.razine.filter(x => x.od <= n).pop() || { k: "turist", od: 0 }, sl = PUT.razine.find(x => x.od > n);
  return { r, sl };
}
const lynxTragovi = () => PUT.pecati.filter(x => x.skriven);
function pecatHtml(p) {
  const pc = pecatZa(p.id); if (!pc) return "";
  const lik = pc.skriven ? lynx(48, true) : medo(48, true), naslov = t(pc.skriven ? "pecat_lynx" : "pecat_naslov");
  if (S.pecati[p.id]) return `<div class="pecat-box ok">${lik}<span class="t"><b>${esc(naslov)}</b><span class="small">${esc(t("pecat_imas", { datum: new Date(S.pecati[p.id]).toLocaleDateString(LOC()) }))}</span></span></div>`;
  const d = S.pos ? hav(S.pos, p) : null, blizu = d != null && d <= pc.r;
  return `<div class="pecat-box${pc.skriven ? " lynx" : ""}">${lik}<span class="t"><b>${esc(naslov)}</b>
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
  if (pc.skriven) {
    const L = lynxTragovi(), nL = L.filter(x => S.pecati[x.id]).length, sve = nL === L.length;
    openSheet(t("putovnica"), `<div class="stack" style="align-items:center;text-align:center">${lynx(140)}<h1>${esc(t(sve ? "lynx_oko" : "lynx_trag_nasao_naslov"))}</h1>
      <p style="margin:0">${esc(sve ? t("lynx_oko_tekst") : t("lynx_trag_nasao", { n: nL, ukupno: L.length }))}</p>${sad.k !== prije ? `<p class="small muted" style="margin:0">${esc(t("razina_nova", { razina: t("razina_" + sad.k) }))}</p>` : ""}
      <button class="btn primary block" id="pPut">${esc(t("putovnica"))}</button></div>`);
    $("#pPut").onclick = openPutovnica; gcEv("lynx-trag");
    return;
  }
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
    <b>${esc(t("putovnica"))}</b><span class="small muted">${esc(t("putovnica_stanje", { n, ukupno: N }))} · ${esc(t("razina_" + razinaZa(n).r.k))}${lynxTragovi().length && lynxTragovi().every(x => S.pecati[x.id]) ? " · " + esc(t("lynx_oko")) : ""}</span>
    <span class="prog"><i style="width:${Math.round(100 * n / N)}%"></i></span></span>${ic("chevron")}</button>`;
}
function openPutovnica() {
  const n = brojPecata(), N = PUT.pecati.length, { r, sl } = razinaZa(n);
  const poruka = n >= N ? t("razina_sve") : t("razina_jos", { n: sl.od - n, razina: t("razina_" + sl.k) });
  openSheet(t("putovnica"), `<div class="stack">
    ${medoOblak(t("razina_" + r.k), poruka, null, 64)}
    <div class="stack" style="gap:6px"><span class="small muted">${esc(t("putovnica_stanje", { n, ukupno: N }))}</span><span class="prog"><i style="width:${Math.round(100 * n / N)}%"></i></span></div>
    <p class="small muted" style="margin:0">${esc(t("putovnica_uvod"))}</p>
    <div class="pecati">${PUT.pecati.filter(x => BY[x.id] && !x.skriven).map(x => { const p = BY[x.id], ok = S.pecati[x.id];
      return `<button class="pecat${ok ? " ok" : ""}" data-open="${x.id}"><span class="krug">${medo(46, true)}</span>${esc(tx(p).naziv.replace(/\s*\(.*?\)/, ""))}${ok ? `<small>${new Date(ok).toLocaleDateString(LOC())}</small>` : ""}</button>`; }).join("")}</div>
    ${lynxTragovi().length ? `<section class="stack" style="gap:8px"><h3>${esc(t("lynx_tragovi"))}</h3>
      ${lynxTragovi().every(x => S.pecati[x.id]) ? medoOblak(t("lynx_oko"), t("lynx_oko_tekst"), null, 56, "lynx") : medoOblak(t("lynx_ime"), t("lynx_trag_hint"), null, 56, "lynx")}
      <div class="pecati">${lynxTragovi().filter(x => BY[x.id]).map(x => { const p = BY[x.id], ok = S.pecati[x.id];
        return ok ? `<button class="pecat ok lynx" data-open="${x.id}"><span class="krug">${lynx(46, true)}</span>${esc(tx(p).naziv.replace(/\s*\(.*?\)/, ""))}<small>${new Date(ok).toLocaleDateString(LOC())}</small></button>`
          : `<span class="pecat skriven"><span class="krug" aria-hidden="true">?</span>${esc(t("lynx_trag_skriven"))}</span>`; }).join("")}</div></section>` : ""}</div>`);
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
/* Lynx, ris iz Risnjaka: drugi lik, javlja se rijetko (zanimljivosti, skriveni pečati, mrak) */
const LYNX_TIJELO = '<path d="M44 240 C44 184 78 160 120 160 C162 160 196 184 196 240 Z" fill="#B5895E"/><path d="M88 240 C88 206 102 190 120 190 C138 190 152 206 152 240 Z" fill="#F6EAD8"/><circle cx="72" cy="206" r="4" fill="#8C6440"/><circle cx="168" cy="210" r="4" fill="#8C6440"/><circle cx="64" cy="226" r="3.5" fill="#8C6440"/><circle cx="176" cy="228" r="3.5" fill="#8C6440"/><path d="M70 158 Q120 182 170 158 L173 173 Q120 200 67 173 Z" fill="#15803D"/><path d="M138 178 L160 214 L142 214 Z" fill="#116B33"/><circle cx="120" cy="188" r="11" fill="#fff" stroke="#C62828" stroke-width="5"/>';
const LYNX_GLAVA = '<path d="M70 86 L60 22 L106 60 Z" fill="#B5895E"/><path d="M74 76 L67 38 L96 62 Z" fill="#EDC3A2"/><path d="M170 86 L180 22 L134 60 Z" fill="#B5895E"/><path d="M166 76 L173 38 L144 62 Z" fill="#EDC3A2"/><path d="M60 22 L54 2 L64 18 Z" fill="#2A1D14"/><path d="M180 22 L186 2 L176 18 Z" fill="#2A1D14"/><path d="M60 22 L63 30" stroke="#2A1D14" stroke-width="5" stroke-linecap="round"/><path d="M180 22 L177 30" stroke="#2A1D14" stroke-width="5" stroke-linecap="round"/><path d="M68 104 L36 142 L60 140 L48 162 L78 150 L84 122 Z" fill="#F6EAD8"/><path d="M172 104 L204 142 L180 140 L192 162 L162 150 L156 122 Z" fill="#F6EAD8"/><ellipse cx="120" cy="110" rx="58" ry="54" fill="#C9A27A"/><path d="M44 140 L62 134 M52 154 L70 144 M196 140 L178 134 M188 154 L170 144" stroke="#2A1D14" stroke-width="3.5" stroke-linecap="round"/><path d="M110 68 L110 82 M120 64 L120 80 M130 68 L130 82" stroke="#8C6440" stroke-width="4" stroke-linecap="round"/><circle cx="78" cy="112" r="3.5" fill="#8C6440"/><circle cx="84" cy="98" r="3" fill="#8C6440"/><circle cx="162" cy="112" r="3.5" fill="#8C6440"/><circle cx="156" cy="98" r="3" fill="#8C6440"/><ellipse cx="120" cy="136" rx="28" ry="19" fill="#F6EAD8"/><path d="M111 126 L129 126 L120 135 Z" fill="#8A4B3A"/><path d="M120 135 Q120 143 111 145 M120 135 Q120 143 129 145" stroke="#2A1D14" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M86 106 Q97 96 108 106 Q97 114 86 106 Z" fill="#E0A93A"/><ellipse cx="97" cy="106" rx="3" ry="5.5" fill="#2A1D14"/><circle cx="99" cy="103" r="1.8" fill="#fff"/><path d="M132 106 Q143 96 154 106 Q143 114 132 106 Z" fill="#E0A93A"/><ellipse cx="143" cy="106" rx="3" ry="5.5" fill="#2A1D14"/><circle cx="145" cy="103" r="1.8" fill="#fff"/><circle cx="82" cy="128" r="7" fill="#E07A5F" opacity=".35"/><circle cx="158" cy="128" r="7" fill="#E07A5F" opacity=".35"/>';
function lynx(px, samoGlava) {
  return samoGlava
    ? `<svg aria-hidden="true" width="${px}" height="${px}" viewBox="30 0 180 180">${LYNX_GLAVA}</svg>`
    : `<svg aria-hidden="true" width="${px}" height="${Math.round(px * 1.2)}" viewBox="36 0 168 240">${LYNX_TIJELO}${LYNX_GLAVA}</svg>`;
}
/* oblačić s medom (ili Lynxom): naslov, tekst i po želji gumb koji otvara točku */
function medoOblak(naslov, tekst, ref, px = 76, lik = "medo") {
  return `<div class="medo${lik === "lynx" ? " lynx" : ""}">${lik === "lynx" ? lynx(px) : medo(px)}<div class="bubble">${naslov ? `<b>${esc(naslov)}</b>` : ""}<span>${esc(tekst)}</span>${ref && BY[ref] ? `<button class="medo-go" data-open="${ref}">${esc(t("medo_pokazi"))} ${esc(tx(BY[ref]).naziv)}${ic("chevron")}</button>` : ""}</div></div>`;
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
  if (k === "mrak" || k === "mrak_blizu") return medoOblak(t("lynx_ime") + ": " + pozdrav.toLowerCase(), t("lynx_" + k, { min }), null, 76, "lynx");
  return medoOblak(pozdrav, t("medo_" + k, { min }), ref);
}
/* „Jesi li znao?” – Lynxova zanimljivost uz mjesto (prva koja se veže uz točku, mijenja se po danu) */
function lynxZnao(id) {
  const sve = (LYNX.cinjenice || []).filter(c => c.ref.includes(id)); if (!sve.length) return "";
  const c = sve[Math.floor(Date.now() / 864e5) % sve.length];
  return `${medoOblak(t("lynx_jesi_znao"), c.tekst, null, 60, "lynx")}<span class="small muted" style="margin-top:-8px">${esc(t("izvor"))}: <a href="${esc(c.url)}" target="_blank" rel="noopener">${esc(c.izvor)}</a></span>`;
}
function openPozdrav() {
  openSheet(t("app_ime"), `<div class="stack" style="align-items:center;text-align:center">
    ${medo(150)}<h1>${esc(t("pozdrav_naslov"))}</h1><p style="margin:0;font-size:1.06em">${esc(t("pozdrav_tekst"))}</p>
    <div class="stack" style="gap:10px;text-align:left;width:100%">${["pozdrav_1", "pozdrav_2", "pozdrav_3", "pozdrav_lynx"].map(k => `<div class="row" style="align-items:flex-start;gap:10px"><span style="color:var(--accent);margin-top:2px">${ic("check")}</span><span>${esc(t(k))}</span></div>`).join("")}</div>
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
  const izvor = iz.teren ? esc(t("koord_teren")) : iz.wikidata ? `${t("licenca_cc0")}${iz.veza === "okvirno" ? " · " + t("okvirno") : ""} · <a href="https://www.wikidata.org/wiki/${esc(iz.wikidata)}" target="_blank" rel="noopener">${esc(iz.wikidata)}</a>` : t("procjena");
  const mail = `mailto:${CONFIG.kontakt}?subject=${encodeURIComponent(t("javi_predmet", { naziv: x.naziv, id }))}`;
  openSheet(katNaziv(p), `<div class="stack">
    ${slikaHtml(id, boja(p))}
    <div><span class="row small muted"><span class="dot" style="background:${boja(p)}"></span>${esc(katNaziv(p))}${d != null ? " · " + fmtDist(d) + " " + esc(t("od_tebe")) : ""}</span><h1>${esc(x.naziv)}</h1></div>
    <div class="grid4"><button class="btn primary" id="tNav">${ic("nav")}${esc(t("vodi_me"))}</button>
      <button class="btn" id="tKarta">${ic("map")}${esc(t("na_karti"))}</button>
      <button class="btn" id="tFav" aria-pressed="${fav}" aria-label="${esc(fav ? t("spremljeno") : t("spremi"))}">${ic("star")}</button>
      <button class="btn" id="tShare" aria-label="${esc(t("podijeli"))}">${ic("share")}</button></div>
    ${p.dolazak ? `<p class="small muted" style="margin:-6px 0 0">${esc(t("vodi_do_" + p.dolazak.naziv))}</p>` : ""}
    <p style="margin:0;font-size:1.06em">${esc(x.opis)}</p>
    ${infoHtml(p)}
    ${lynxZnao(id)}
    ${pecatHtml(p)}
    ${p.napomena && PREGLED ? `<div class="note warn small">${esc(t("prototip_napomena", { tekst: p.napomena }))}</div>` : ""}
    ${uRuti.length ? `<section><h3>${esc(t("dio_rute"))}</h3>${uRuti.map(r => `<button class="list-row" data-open="${r.id}"><span class="num r">R</span><span class="t"><b>${esc(tx(r).naziv)}</b><span>${esc(t("vrsta_" + r.vrsta))} · ${esc(tez(r))} · ${kmR(r)} km</span></span><span class="badge ${r.besplatno ? "free" : "pro"}">${esc(r.besplatno ? t("besplatno") : t("pro"))}</span></button>`).join("")}</section>` : ""}
    <section><h3>${esc(t("u_blizini"))}</h3>${blizu.map(({ q, d }) => `<button class="list-row" data-open="${q.id}"><span class="dot" style="background:${boja(q)}"></span><span class="t"><b>${esc(tx(q).naziv)}</b><span>${esc(katNaziv(q))}</span></span><span class="mono small">${fmtDist(d)}</span></button>`).join("")}</section>
    <div class="small muted" style="border-top:1px solid var(--line2);padding-top:12px;display:flex;flex-direction:column;gap:6px">
      <button class="mono" id="tCoord" style="all:unset;cursor:pointer;color:var(--ink2)">${fmtCoord(p.lat)} · ${fmtCoord(p.lon)}</button>
      <span>${esc(t("pouzdanost_" + p.pouzdanost))} · ${esc(t("izvor_koordinata"))}: ${izvor} · ${esc(t("izvor_opisa"))}: ${esc(t("opis_autor"))}</span>
      <a class="btn" style="align-self:flex-start" href="${mail}">${ic("msg")}${esc(t("javi_promjenu"))}</a>
    </div></div>`);
  $("#tNav").onclick = () => openNav(p.dolazak ? { lat: p.dolazak.lat, lon: p.dolazak.lon } : { lat: p.lat, lon: p.lon }, x.naziv);
  $("#tKarta").onclick = () => istakniNaKarti(p);
  $("#tFav").onclick = () => { S.favs = S.favs.includes(id) ? S.favs.filter(f => f !== id) : S.favs.concat(id); store.set("gk-fav", S.favs); renderChips(); openTocka(id); gcEv("spremi"); };
  $("#tShare").onclick = () => sharePlace(x.naziv, p);
  $("#sheet").dataset.tocka = id;
  $("#tCoord").onclick = () => copy(`${p.lat.toFixed(5)}, ${p.lon.toFixed(5)}`);
  if (map) map.panTo([p.lat, p.lon]);
  gcEv("tocka");
}
/* „Na karti”: otvori kartu na mjestu i nakratko ga istakni (makne filter ako ga skriva) */
let istaknut = null;
function istakniNaKarti(p) {
  closeSheet(); go("karta");
  if (S.trazi && !S.trazi.ids.has(p.id)) { S.trazi = null; $("#searchPill").hidden = true; }
  if (S.grupa && S.grupa !== "spremljeno" && !(p.grupe || []).includes(S.grupa) || S.grupa === "spremljeno" && !S.favs.includes(p.id)) { S.grupa = ""; renderChips(); }
  setTimeout(() => {
    map.invalidateSize(); map.setView([p.lat, p.lon], Math.max(map.getZoom(), 16), { animate: false });
    renderMarkers(); renderNear();
    if (istaknut) map.removeLayer(istaknut);
    istaknut = L.marker([p.lat, p.lon], { icon: L.divIcon({ className: "istakni", html: "<span></span>", iconSize: [56, 56], iconAnchor: [28, 28] }), interactive: false, keyboard: false })
      .bindTooltip(esc(tx(p).naziv), { permanent: true, direction: "top", offset: [0, -24], className: "lbl istakni-lbl" }).addTo(map);
    const m = istaknut; setTimeout(() => { if (istaknut === m) { map.removeLayer(m); istaknut = null; } }, 8000);
  }, 80);
  gcEv("na-karti");
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
const kmR = r => r.km_gpx != null ? dec(r.km_gpx) : "~" + dec(r.km);
const vrstaR = r => r.bicikl === "mtb" ? t("vrsta_mtb") : t("vrsta_" + r.vrsta);
const R_FILTRI = [["sve", () => true], ["pjesice", r => r.vrsta !== "biciklisticka"], ["bicikl", r => r.vrsta === "biciklisticka" && r.bicikl !== "mtb"], ["mtb", r => r.bicikl === "mtb"]];
function rutaGrupa(r) { const h = satiMax(r.sati); return h <= 2.5 ? "kratko" : h <= 4 ? "pola" : "dan"; }
function rutaKartica(r, feat) {
  return `<button class="card list-row${feat ? " feat" : ""}" data-open="${r.id}" style="flex-direction:column;align-items:stretch;gap:6px;padding:14px">
    <span class="between" style="align-items:flex-start"><b style="font-size:1.1em;line-height:1.25">${esc(tx(r).naziv)}</b><span class="badge ${r.besplatno ? "free" : "pro"}">${esc(r.besplatno ? t("besplatno") : t("pro"))}</span></span>
    <span class="row small meta" style="gap:14px;color:var(--ink2)"><span>${esc(vrstaR(r))}</span><span>${esc(tez(r))}</span><span class="mono">${kmR(r)} km</span><span class="mono">${esc(dec(r.sati))} h</span></span>${feat ? `<span class="go">${esc(t("pogledaj_rutu"))}${ic("chevron")}</span>` : ""}</button>`;
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
    <h2 style="margin-top:8px">${esc(t("sve_rute"))}</h2>
    <div class="row g-filter" style="flex-wrap:wrap;gap:6px">${R_FILTRI.map(([k, f]) => `<button class="chip soft" data-rfiltar="${k}" aria-pressed="${(S.rFiltar || "sve") === k}">${esc(t("rf_" + k))} <span class="muted">${RUTE.filter(f).length}</span></button>`).join("")}</div>
    ${RUTE.filter((R_FILTRI.find(([k]) => k === (S.rFiltar || "sve")) || R_FILTRI[0])[1]).map(r => rutaKartica(r)).join("")}`;
}
$("#rute").addEventListener("click", e => { const f = e.target.closest("[data-rfiltar]"); if (f) { S.rFiltar = f.dataset.rfiltar; renderRute(); return; } const b = e.target.closest("[data-plan]"); if (!b) return; const [k, v] = b.dataset.plan.split(":"); S.plan[k] = v; renderRute(); gcEv("planer"); });

/* visinski profil rute (Copernicus DEM): jednostavan graf, za Pro rute zamućen */
function profilHtml(r) {
  const v = r.visina; if (!v || !v.profil || v.profil.length < 2) return "";
  const P = v.profil, W = 320, H = 96, km = P[P.length - 1][0] || 1, lo = Math.floor(v.min / 50) * 50, hi = Math.max(lo + 100, Math.ceil(v.max / 50) * 50);
  const x = d => (d / km * W).toFixed(1), y = e => (H - (e - lo) / (hi - lo) * H).toFixed(1);
  const lin = P.map(([d, e], i) => (i ? "L" : "M") + x(d) + " " + y(e)).join(" ");
  return `<section class="profil${r.besplatno ? "" : " zakljucano"}" aria-label="${esc(t("profil_aria", { uspon: r.uspon_m, spust: v.spust, min: v.min, max: v.max }))}">
    <div class="between small"><b>${esc(t("profil_naslov"))}</b><span class="muted">↑ ${r.uspon_m} m · ↓ ${v.spust} m · ${v.min}–${v.max} m</span></div>
    <div class="profil-g"><svg viewBox="0 -4 ${W} ${H + 8}" preserveAspectRatio="none" aria-hidden="true">
      <path d="${lin} L${W} ${H} L0 ${H} Z" fill="var(--accent-soft)"/><path d="${lin}" fill="none" stroke="var(--accent)" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>
      <span class="ph">${hi} m</span><span class="pl">${lo} m</span>${r.besplatno ? "" : `<span class="plock">${ic("lock")}${esc(t("pro"))}</span>`}</div>
    <div class="between small muted"><span>0 km</span><span>${kmR(r)} km</span></div></section>`;
}
function openRuta(id) {
  const r = RBY[id]; if (!r) return; const x = tx(r);
  const stops = r.tocke.map(i => BY[i]).filter(Boolean);
  openSheet(vrstaR(r), `<div class="stack">
    <div class="row"><span class="badge ${r.besplatno ? "free" : "pro"}">${esc(r.besplatno ? t("besplatno") : t("pro"))}</span><span class="small muted">${esc(vrstaR(r))}</span></div>
    <h1>${esc(x.naziv)}</h1>
    <div class="stats"><div><b>${kmR(r)}</b><span>${esc(t("km"))}</span></div><div><b>${esc(dec(r.sati))}</b><span>${esc(t("sati"))}</span></div><div><b>${r.uspon_m == null ? "–" : "~" + r.uspon_m}</b><span>${esc(t("m_uspona"))}</span></div><div><b>${esc(tez(r))}</b><span>${esc(t("tezina"))}</span></div></div>
    <p style="margin:0;font-size:1.04em">${esc(x.opis)}</p>
    ${profilHtml(r)}
    <p class="small muted" style="margin:0">${esc(t(r.visina ? "procjena_rute_dem" : r.osm ? "procjena_rute_osm" : "procjena_rute"))}</p>
    <div class="row small"><b>${esc(t("parking"))}:</b><span>${esc(x.parking)}</span></div>
    <button class="btn" id="rJavi" style="align-self:flex-start">${ic("msg")}${esc(t("javi_s_rute"))}</button>
    ${r.polazista && r.polazista.length ? `<section class="card"><h3>${esc(t("polazista"))}</h3>${r.polazista.map(p => `<div class="between small" style="border-top:1px solid var(--line);min-height:40px"><span>${esc(p.naziv)}</span><span class="mono">${esc(p.vrijeme)}</span></div>`).join("")}</section>` : ""}
    <div><div class="mini-map" id="rutaMap"></div><p class="small muted" style="margin:6px 0 0">${esc(t("linija_skica"))}</p></div>
    ${r.osm ? `<p class="small muted" style="margin:0">${esc(t("ruta_osm_izvor"))} <a href="https://www.openstreetmap.org/relation/${esc(r.osm.slice(1))}" target="_blank" rel="noopener">OSM</a></p>` : ""}
    ${stops.length ? `<section><h3>${esc(t("stajalista"))}</h3>${stops.map((p, i) => `<button class="list-row" data-open="${p.id}"><span class="num">${i + 1}</span><span class="t"><b>${esc(tx(p).naziv)}</b><span>${esc(katNaziv(p))}</span></span></button>`).join("")}</section>` : ""}
    ${r.besplatno ? "" : `<div class="note warn">${esc(t("pro_zakljucano"))}<br>${esc(t("pro_cijena"))}</div>`}
    <div class="grid2"><button class="btn primary" id="rKreni" ${r.besplatno ? "" : "disabled"}>${ic(r.besplatno ? "nav" : "lock")}${esc(t("kreni_rutom"))}</button><button class="btn" id="rKarta">${ic("map")}${esc(t("prikazi_na_karti"))}</button></div>
  </div>`);
  const mm = L.map("rutaMap", { zoomControl: false, attributionControl: false, dragging: true, scrollWheelZoom: false, preferCanvas: true });
  if (!PREGLED) L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 17, className: "osm-tiles" }).addTo(mm);
  const skini = addPodloga(mm, true);
  const ll = trasaLL(r) || [stops.map(p => [p.lat, p.lon])];
  L.polyline(ll, { color: cv("--ink"), weight: 7, opacity: .5 }).addTo(mm);
  L.polyline(ll, { color: cv("--amber"), weight: 4, dashArray: trasaLL(r) ? null : "8 8" }).addTo(mm);
  stops.forEach((p, i) => L.marker([p.lat, p.lon], { icon: L.divIcon({ className: "num-icon", html: String(i + 1), iconSize: [24, 24] }) }).addTo(mm));
  mm.fitBounds(L.latLngBounds(ll.flat()).pad(0.25)); setTimeout(() => mm.invalidateSize(), 60);
  sheetCleanup.push(() => { skini(); mm.remove(); });
  $("#rKreni").onclick = () => { const st = stops[0] || (trasaLL(r) && { lat: trasaLL(r)[0][0][0], lon: trasaLL(r)[0][0][1] }); if (r.besplatno && st) { openNav({ lat: st.lat, lon: st.lon }, stops[0] ? tx(stops[0]).naziv : x.naziv); gcEv("ruta-kreni"); } };
  $("#rJavi").onclick = () => { S.javiRuta = x.naziv; closeSheet(); go("sigurnost"); setTimeout(() => { const el = $("#jRuta"); if (el) el.scrollIntoView({ block: "center" }); }, 80); };
  $("#rKarta").onclick = () => { closeSheet(); go("karta"); setTimeout(() => trasaLL(r) ? pokaziRutu(id) : map.fitBounds(L.latLngBounds(ll.flat()).pad(0.3)), 80); };
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
  openSheet(t("vodi_me") + " · " + label, `<div class="stack">
    <div class="seg dva" role="group" aria-label="${esc(t("nav_nacin"))}"><button aria-pressed="true">${esc(t("nav_kompas"))}</button><button id="navNaKarti">${ic("map")}${esc(t("nav_karta"))}</button></div>
    <div id="navBox"></div><button class="btn" id="navCompass" hidden>${esc(t("nav_ukljuci_kompas"))}</button>
    <a class="btn" href="${esc(vanjskaNav(target, label))}" target="_blank" rel="noopener">${ic("nav")}${esc(t("nav_vanjska"))}</a>
    <div class="grid2"><button class="btn" data-go="sigurnost">${esc(t("gdje_sam"))}</button><a class="btn danger" href="tel:112">112</a></div></div>`);
  $("#navNaKarti").onclick = () => kartaNav(target, label);
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

/* ---------- navigacija po karti (put.js + data/mreza.json, bez interneta) ---------- */
/* vanjska aplikacija: samo predajemo cilj (koordinate); na Androidu bira korisnik, na iPhoneu Apple Karte */
function vanjskaNav(c, label) {
  const ll = `${c.lat.toFixed(6)},${c.lon.toFixed(6)}`, ua = navigator.userAgent;
  if (/Android/i.test(ua)) return `geo:${ll}?q=${ll}(${encodeURIComponent(label)})`;
  if (/iPhone|iPad|iPod/i.test(ua)) return `https://maps.apple.com/?daddr=${ll}&q=${encodeURIComponent(label)}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${ll}`;
}
let MREZA = null;
function mreza() {
  if (MREZA) return MREZA;
  const get = PREGLED ? Promise.resolve(window.GK_DATA["data/mreza.json"]) : fetch("data/mreza.json").then(r => { if (!r.ok) throw 0; return r.json(); });
  return (MREZA = get.then(d => Put.ucitaj(d)).catch(e => { MREZA = null; throw e; }));
}
const KN = { aktivna: false };
function kartaNav(cilj, naziv) {
  closeSheet(); go("karta");
  Object.assign(KN, { aktivna: true, cilj, naziv, profil: store.get("gk-profil", "pjesice"), put: null, pos: null, pratim: true, izvan: 0, zadnji: 0, head: null, stigao: false });
  $("#v-karta").classList.add("nav-mode"); skloniRutu(); if (S.trazi) makniPretragu();
  KN.sloj = L.layerGroup().addTo(map);
  KN.cMarker = L.marker([cilj.lat, cilj.lon], { icon: L.divIcon({ className: "kn-cilj", html: ic("pin"), iconSize: [34, 34], iconAnchor: [17, 32] }), keyboard: false }).addTo(KN.sloj);
  knPanel();
  if (!GEO) { knPoruka(t("lokacija_nema")); return; }
  KN.watch = GEO.watchPosition(p => knPozicija({ lat: p.coords.latitude, lon: p.coords.longitude, acc: p.coords.accuracy, smjer: p.coords.heading, brzina: p.coords.speed }),
    () => knPoruka(t("lokacija_odbijena")), { enableHighAccuracy: true, maximumAge: 3000, timeout: 30000 });
  KN.onHead = e => { let h = null; if (e.webkitCompassHeading != null) h = e.webkitCompassHeading; else if (e.absolute && e.alpha != null) h = 360 - e.alpha; if (h != null) { KN.head = h; knMarker(); } };
  addEventListener("deviceorientationabsolute", KN.onHead); addEventListener("deviceorientation", KN.onHead);
  KN.drag = () => { if (KN.pratim) { KN.pratim = false; knPanel(); } };
  map.on("dragstart", KN.drag);
  mreza().catch(() => knPoruka(t("kn_nema_mreze")));
  gcEv("navigacija-karta");
}
function zavrsiKartaNav() {
  if (!KN.aktivna) return;
  if (KN.watch != null && GEO) GEO.clearWatch(KN.watch);
  removeEventListener("deviceorientationabsolute", KN.onHead); removeEventListener("deviceorientation", KN.onHead);
  map.off("dragstart", KN.drag); if (KN.sloj) map.removeLayer(KN.sloj);
  Object.assign(KN, { aktivna: false, watch: null, sloj: null, put: null, uMarker: null });
  $("#v-karta").classList.remove("nav-mode"); $("#navPanel").hidden = true;
  renderNear();
}
function knPoruka(txt) { KN.poruka = txt; knPanel(); }
async function knPozicija(pos) {
  if (!KN.aktivna) return;
  KN.pos = pos; KN.poruka = null; knMarker();
  const sad = Date.now();
  if (!KN.put && !KN.racunam) await knIzracunaj();
  else if (KN.put) {
    const np = Put.naPutu(KN.put, pos.lon, pos.lat);
    KN.np = np;
    if (np.d > Math.max(40, (pos.acc || 0) * 1.5)) KN.izvan++; else KN.izvan = 0;
    if (KN.izvan >= 2 && sad - KN.zadnji > 8000) { toast(t("kn_novi_put")); await knIzracunaj(); }
  }
  if (KN.pratim) map.setView([pos.lat, pos.lon], Math.max(map.getZoom(), 16), { animate: true });
  knPanel();
}
async function knIzracunaj() {
  if (!KN.pos) return;
  KN.racunam = true; knPanel();
  try {
    const m = await mreza();
    const put = Put.nadi(m, KN.pos, KN.cilj, KN.profil);
    KN.zadnji = Date.now(); KN.izvan = 0;
    if (!put) { KN.put = null; KN.poruka = t("kn_nema_puta"); }
    else { KN.put = put; KN.np = Put.naPutu(put, KN.pos.lon, KN.pos.lat); knCrtaj(); }
  } catch (e) { KN.poruka = t("kn_nema_mreze"); }
  KN.racunam = false; knPanel();
}
function knCrtaj() {
  KN.sloj.clearLayers(); KN.sloj.addLayer(KN.cMarker); KN.uMarker = null;
  const p = KN.put, ll = p.tocke.map(([x, y]) => [y, x]);
  L.polyline(ll, { color: cv("--ink"), weight: 9, opacity: .45, interactive: false }).addTo(KN.sloj);
  L.polyline(ll, { color: cv("--accent"), weight: 6, interactive: false }).addTo(KN.sloj);
  /* dio bez puta (do prve staze i od zadnje do cilja): isprekidano */
  const crt = { color: cv("--accent"), weight: 4, dashArray: "6 8", interactive: false };
  if (p.odPuta > 25) L.polyline([[KN.pos.lat, KN.pos.lon], [p.pristup[1], p.pristup[0]]], crt).addTo(KN.sloj);
  if (p.doPuta > 25) L.polyline([[p.dolazak[1], p.dolazak[0]], [KN.cilj.lat, KN.cilj.lon]], crt).addTo(KN.sloj);
  knMarker();
  if (!KN.prviPrikaz) { KN.prviPrikaz = true; if (KN.pratim) map.fitBounds(L.latLngBounds(ll).pad(0.15)); setTimeout(() => { if (KN.pratim && KN.pos) map.setView([KN.pos.lat, KN.pos.lon], 17); }, 2500); }
}
function knMarker() {
  if (!KN.pos || !KN.sloj) return;
  const sm = KN.head != null ? KN.head : (KN.pos.brzina > 0.7 && KN.pos.smjer != null ? KN.pos.smjer : null);
  const html = `<span class="kn-ja">${sm != null ? `<span class="kn-strelica" style="transform:rotate(${Math.round(sm)}deg)"></span>` : ""}</span>`;
  if (!KN.uMarker) KN.uMarker = L.marker([KN.pos.lat, KN.pos.lon], { icon: L.divIcon({ className: "", html, iconSize: [40, 40], iconAnchor: [20, 20] }), interactive: false, keyboard: false, zIndexOffset: 1000 }).addTo(KN.sloj);
  else { KN.uMarker.setLatLng([KN.pos.lat, KN.pos.lon]); const el = KN.uMarker.getElement(); if (el) el.innerHTML = html; }
}
function knSkretanje(u) {
  if (u.cilj) return { ikona: "cilj", tekst: t("kn_cilj") };
  const k = u.kut, a = Math.abs(k), str = k > 0 ? "desno" : "lijevo";
  const kako = a < 45 ? "blago_" + str : a < 120 ? str : "ostro_" + str;
  const v = u.vrsta, kamo = ["path", "footway", "bridleway"].includes(v) ? t("kn_na_stazu") : v === "track" ? t("kn_na_sumsku") : v === "steps" ? t("kn_na_stube")
    : v === "cycleway" ? t("kn_na_biciklisticku") : u.ime ? t("kn_u", { ime: u.ime }) : ["tertiary", "secondary", "primary"].some(x => v.startsWith(x)) ? t("kn_na_cestu") : t("kn_na_put");
  return { ikona: kako, tekst: t("kn_" + kako) + " " + kamo + (u.markirano ? " · " + t("kn_markacija") : "") };
}
const KN_STRELICE = { lijevo: -90, desno: 90, blago_lijevo: -40, blago_desno: 40, ostro_lijevo: -140, ostro_desno: 140 };
function knPanel() {
  const el = $("#navPanel"); if (!KN.aktivna) { el.hidden = true; return; }
  el.hidden = false;
  const p = KN.put, s = KN.np ? KN.np.s : 0;
  let glavno;
  if (KN.poruka) glavno = `<p class="kn-poruka">${esc(KN.poruka)}</p>`;
  else if (!KN.pos) glavno = `<p class="kn-poruka">${esc(t("lokacija_trazim"))}</p>`;
  else if (!p) glavno = `<p class="kn-poruka">${esc(t("kn_racunam"))}</p>`;
  else {
    const ostalo = Math.max(0, p.m - s) + (p.doPuta > 25 ? p.doPuta : 0), doCilja = hav(KN.pos, KN.cilj);
    if (!KN.stigao && (doCilja < 25 || ostalo < 20)) { KN.stigao = true; toast(t("kn_stigao")); gcEv("navigacija-cilj"); }
    const u = p.upute.find(x => x.na > s + 5) || p.upute[p.upute.length - 1], sk = knSkretanje(u), dU = Math.max(0, u.na - s);
    const strelica = sk.ikona === "cilj" ? ic("pin") : `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true" style="transform:rotate(${KN_STRELICE[sk.ikona]}deg)"><path d="M12 20V5M6 11l6-6 6 6"/></svg>`;
    glavno = KN.stigao ? `<div class="kn-upu"><span class="kn-ik">${ic("pin")}</span><div><b>${esc(t("kn_stigao"))}</b><span>${esc(KN.naziv)}</span></div></div>`
      : `<div class="kn-upu"><span class="kn-ik">${strelica}</span><div><b>${esc(sk.ikona === "cilj" ? fmtDist(dU) : t("kn_za", { d: fmtDist(dU) }))}</b><span>${esc(sk.tekst)}</span></div></div>
        ${p.odPuta > 25 && s < 5 ? `<p class="small" style="margin:0">${esc(t("kn_do_puta", { d: fmtDist(p.odPuta) }))}</p>` : ""}
        <div class="kn-stat"><b>${fmtDist(ostalo)}</b><span>${esc(t("kn_ostalo"))}</span><b>${fmtMin(ostalo / 1000 / Put.BRZINA[KN.profil] * 60)}</b><span>${esc(t("kn_hoda_" + KN.profil))}</span></div>`;
  }
  el.innerHTML = `<div class="kn-glava"><span class="small muted">${esc(t("vodi_me"))} · ${esc(KN.naziv)}</span></div>${glavno}
    <div class="row kn-gumbi">
      <div class="seg dva mali" role="group" aria-label="${esc(t("kn_profil"))}"><button data-kn="pjesice" aria-pressed="${KN.profil === "pjesice"}">${esc(t("kako_pjesice"))}</button><button data-kn="bicikl" aria-pressed="${KN.profil === "bicikl"}">${esc(t("kako_bicikl"))}</button></div>
      ${KN.pratim ? "" : `<button class="btn" data-kn="centar">${ic("loc")}${esc(t("kn_centriraj"))}</button>`}
      <button class="btn" data-kn="kompas" aria-label="${esc(t("nav_kompas"))}">${ic("nav")}</button>
      <button class="btn" data-kn="kraj">${esc(t("kn_zavrsi"))}</button></div>
    <span class="small muted">${esc(t("kn_izvor"))}</span>`;
}
function fmtMin(min) { min = Math.max(1, Math.round(min)); return min < 60 ? min + " min" : Math.floor(min / 60) + " h " + String(min % 60).padStart(2, "0") + " min"; }
$("#navPanel").addEventListener("click", e => {
  const b = e.target.closest("[data-kn]"); if (!b) return; const a = b.dataset.kn;
  if (a === "pjesice" || a === "bicikl") { if (KN.profil !== a) { KN.profil = a; store.set("gk-profil", a); KN.put = null; KN.prviPrikaz = false; knIzracunaj(); } }
  if (a === "centar") { KN.pratim = true; if (KN.pos) map.setView([KN.pos.lat, KN.pos.lon], Math.max(map.getZoom(), 16)); knPanel(); }
  if (a === "kompas") { const c = KN.cilj, n = KN.naziv; zavrsiKartaNav(); openNav(c, n); }
  if (a === "kraj") zavrsiKartaNav();
});

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
/* zimi (studeni–ožujak): skijališta i sanjkališta te savjeti za cestu */
function zimaDanas(r) {
  if (!zimskiMjesec()) return "";
  const z = TOCKE.filter(p => p.zima).map(p => ({ p, d: hav(r, p) })).sort((a, b) => a.d - b.d);
  return `<section class="stack" style="gap:8px"><h2>${esc(t("zima_naslov"))}</h2>
    ${z.map(({ p, d }) => `<button class="list-row" data-open="${p.id}"><span class="dot" style="background:${KAT.boje.zima}"></span><span class="t"><b>${esc(tx(p).naziv)}</b><span>${esc(t("pod_" + p.zima))}</span></span><span class="mono small">${fmtDist(d)}</span></button>`).join("")}
    <p class="small muted" style="margin:0">${esc(t("zima_provjeri"))}</p>
    <div class="card stack" style="gap:6px"><b>${esc(t("zima_cesta_naslov"))}</b><span class="small" style="color:var(--ink2)">${esc(t("zima_cesta"))}</span>
      <a class="btn" href="https://www.hak.hr/info/stanje-na-cestama/" target="_blank" rel="noopener" style="align-self:flex-start">${esc(t("zima_hak"))}</a></div></section>`;
}
async function renderDanas() {
  const r = ref(), now = new Date(), st = sunTimes(now, r.lat, r.lon), sez = sezona(now);
  const datum = now.toLocaleDateString(LOC(), { weekday: "long", day: "numeric", month: "long" });
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
    ${zimaDanas(r)}
    <section class="stack" style="gap:8px"><h2>${esc(t("stanje_na_terenu"))}</h2>
      ${(DANAS.stanje || []).map(s => `<button class="card list-row" ${s.ref ? `data-open="${s.ref}"` : ""} style="align-items:flex-start;padding:12px 14px">
        <span class="dot" style="margin-top:6px;background:${s.razina === "upozorenje" ? "var(--warn)" : "var(--muted)"}"></span>
        <span class="t"><b>${esc(tx(s).naslov)}</b><span style="color:var(--ink2)">${esc(tx(s).opis)}</span><span>${esc(s.provjereno ? t("provjereno", { datum: new Date(s.provjereno).toLocaleDateString(LOC()) }) : t("opce_upozorenje"))}</span></span></button>`).join("")}</section>
    ${ideje.length ? `<section class="stack" style="gap:8px"><h2>${esc(t("ideje_" + sez))}</h2><div class="ideas">${ideje.map(i => `<button class="idea" data-open="${i.ref}"><span class="top${SLIKE[i.ref] ? " foto" : ""}" style="background:${i.boja}${SLIKE[i.ref] ? `;background-image:url('${esc(fotoSrc(SLIKE[i.ref]))}')` : ""}"><span>${esc(tx(i).oznaka)}</span></span><span class="b"><b>${esc(tx(i).naslov)}</b><span>${esc(tx(i).opis)}</span></span></button>`).join("")}</div></section>` : ""}
    ${gladan}
    <a class="card row" href="${esc(DANAS.gljive_url)}" target="_blank" rel="noopener" style="text-decoration:none;color:var(--ink);gap:12px">
      <svg aria-hidden="true" width="36" height="36" viewBox="0 0 36 36"><path d="M4 18 C4 9 12 5 18 5 C24 5 32 9 32 18 Z" fill="#8A5A2B"/><rect x="14" y="18" width="8" height="12" rx="3" fill="#E9DCC6"/></svg>
      <span class="t" style="display:flex;flex-direction:column"><b>${esc(t("gljive_naslov"))}</b><span class="small muted">${esc(t("gljive_opis"))}</span></span></a>`;
  const w = await weather(r.lat, r.lon); const box = $("#wxBox"); if (box && w) { box.innerHTML = draw(w); const mb = $("#medoBox"); if (mb) mb.innerHTML = medoSavjet(w, st, now, sez); }
}

/* ---------- moje: putovnica, spremljena mjesta, auto, postavke ---------- */
function renderMoje() {
  const favs = S.favs.map(i => BY[i]).filter(Boolean), n = favs.length + S.moja.length;
  $("#moje").innerHTML = `<div class="between"><h1>${esc(t("moje_naslov"))}</h1><button class="sos" data-go="sigurnost" aria-label="${esc(t("sos_aria"))}">${esc(t("sos"))}</button></div>
    ${putovnicaKartica()}
    <section class="stack" style="gap:6px"><div class="between"><h2>${esc(t("moja_mjesta"))}</h2><span class="small muted">${n}</span></div>
      ${n ? favs.slice(0, 5).map(p => `<button class="list-row" data-open="${p.id}"><span class="dot" style="background:${boja(p)}"></span><span class="t"><b>${esc(tx(p).naziv)}</b><span>${esc(katNaziv(p))}</span></span></button>`).join("")
          + S.moja.slice(0, 5).map(m => `<button class="list-row" data-open="m:${esc(m.id)}"><span class="dot" style="background:var(--accent)"></span><span class="t"><b>${esc(m.ime)}</b><span>${esc(t("kat_moje"))}</span></span></button>`).join("")
          + `<button class="btn" id="sMoja" style="align-self:flex-start">${esc(t("moja_sva"))}</button>`
        : medoOblak("", t("medo_prazno"), null, 56)}</section>
    <section class="card stack" style="gap:10px"><h2>${esc(t("auto_naslov"))}</h2><div class="stack carbox" style="gap:10px">${carHtml()}</div></section>
    <section class="stack" style="gap:8px"><h2>${esc(t("postavke"))}</h2>
      <div class="card stack" style="gap:8px"><b>${esc(t("sigurnosna_kopija"))}</b><span class="small muted">${esc(t("kopija_opis"))}</span>
        <div class="grid2"><button class="btn" id="kIzvoz">${esc(t("kopija_izvoz"))}</button><label class="btn" for="kUvoz" style="cursor:pointer">${esc(t("kopija_uvoz"))}</label></div><input type="file" id="kUvoz" accept="application/json,.json" hidden></div>
      <div class="card stack" style="gap:8px"><b>${esc(t("jezik"))}</b><div class="seg dva" role="group" aria-label="${esc(t("jezik"))}">${JEZICI.map(j => `<button data-jezik="${j}" lang="${j}" aria-pressed="${CONFIG.jezik === j}">${esc(t("jezik_" + j))}</button>`).join("")}</div></div>
      <div class="card stack" style="gap:8px"><b>${esc(t("tema"))}</b><div class="seg" role="group" aria-label="${esc(t("tema"))}">${[["sustav", "tema_sustav"], ["light", "tema_svijetla"], ["dark", "tema_tamna"]].map(([v, k]) => `<button data-tema="${v}" aria-pressed="${store.get("gk-tema", "sustav") === v}">${esc(t(k))}</button>`).join("")}</div></div>
      <label class="card row" for="bigTxt" style="justify-content:space-between;min-height:52px"><b>${esc(t("veliki_tekst"))}</b><input type="checkbox" id="bigTxt" ${document.documentElement.classList.contains("big") ? "checked" : ""} style="width:22px;height:22px;accent-color:var(--accent)"></label>
      <button class="card list-row" id="sOApp" style="width:100%;text-align:left">${medo(40, true)}<span class="t"><b>${esc(t("oapp_gumb"))}</b><span>${esc(t("verzija", { v: CONFIG.verzija }))}</span></span>${ic("chevron")}</button>
    </section>`;
}
$("#moje").addEventListener("click", e => {
  if (e.target.closest("#sMoja")) openMojaMjesta();
  if (e.target.closest("#sFoto")) openFotoZasluge();
  if (e.target.closest("#sOApp")) openOApp();
  if (e.target.closest("#kIzvoz")) izvozKopije();
  const tb = e.target.closest("[data-tema]"); if (tb) { primijeniTemu(tb.dataset.tema); renderMoje(); }
  const jb = e.target.closest("[data-jezik]"); if (jb && jb.dataset.jezik !== CONFIG.jezik) { store.set("gk-jezik", jb.dataset.jezik); gcEv("jezik-" + jb.dataset.jezik); location.reload(); }
});
$("#moje").addEventListener("change", e => {
  if (e.target.id === "bigTxt") { document.documentElement.classList.toggle("big", e.target.checked); store.set("gk-big", e.target.checked); }
  if (e.target.id === "kUvoz" && e.target.files[0]) uvozKopije(e.target.files[0]);
});

/* ---------- o aplikaciji: izvori, licence, privatnost, kontakt ---------- */
function openOApp() {
  const mail = `mailto:${CONFIG.kontakt}?subject=${encodeURIComponent("Zelenko " + CONFIG.verzija)}`;
  openSheet(t("oapp_naslov"), `<div class="stack">
    <div class="row" style="gap:14px;align-items:center">${medo(72, true)}${lynx(64, true)}</div>
    <p style="margin:0;font-size:1.04em">${esc(t("oapp_uvod"))}</p><span class="small muted">${esc(t("verzija", { v: CONFIG.verzija }))}</span>
    <section class="stack" style="gap:6px"><h2>${esc(t("oapp_izvori"))}</h2>
      ${(T.oapp_izvori_popis || []).map(([n, o, u]) => `<div style="padding:8px 0;border-top:1px solid var(--line)"><b>${u ? `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(n)}</a>` : esc(n)}</b><div class="small" style="color:var(--ink2)">${esc(o)}</div></div>`).join("")}
      ${Object.keys(SLIKE).length ? `<button class="btn" id="oFoto" style="align-self:flex-start">${esc(t("foto_zasluge"))}</button>` : ""}</section>
    <section class="stack" style="gap:6px"><h2>${esc(t("oapp_privatnost"))}</h2>
      <ul style="margin:0;padding-left:20px;display:flex;flex-direction:column;gap:6px">${(T.oapp_privatnost_tekst || []).map(x => `<li>${esc(x)}</li>`).join("")}</ul>
      ${PREGLED ? "" : `<a class="btn" href="privatnost.html" target="_blank" rel="noopener" style="align-self:flex-start">${esc(t("oapp_privatnost_cijela"))}</a>`}</section>
    <section class="stack" style="gap:6px"><h2>${esc(t("oapp_odgovornost"))}</h2><p style="margin:0">${esc(t("oapp_odgovornost_tekst"))}</p></section>
    <section class="stack" style="gap:6px"><h2>${esc(t("oapp_kontakt"))}</h2><p style="margin:0">${esc(t("oapp_kontakt_tekst"))}</p>
      <a class="btn primary" href="${mail}" style="align-self:flex-start">${ic("msg")}${esc(t("oapp_pisi"))}</a></section></div>`);
  const f = $("#oFoto"); if (f) f.onclick = openFotoZasluge;
  gcEv("o-aplikaciji");
}

/* ---------- gastro kutak: specijaliteti, jelo, smještaj, OPG ---------- */
const G_FILTRI = [["jelo", p => p.kategorija === "jelo" || !!(p.usluga && p.usluga.i_jelo)], ["spavanje", p => p.kategorija === "spavanje" || !!(p.usluga && p.usluga.i_spavanje)],
  ["opg", p => p.kategorija === "kupnja" && (p.podvrsta === "opg" || p.podvrsta === "mljekomat")], ["trgovine", p => p.kategorija === "kupnja" && p.podvrsta !== "opg" && p.podvrsta !== "mljekomat"]];
S.gastro = { f: "jelo", otvoreno: false };
function specKartica(x) {
  return `<button class="idea spec" data-spec="${x.id}"><span class="top" style="background:${x.boja}${x.slika ? `;background-image:url('${esc(fotoSrc(x.slika))}')` : ""}"><span>${esc(t("spec_vrsta_" + x.vrsta))}</span></span>
    <span class="b"><b>${esc(x.naziv)}</b><span>${esc(x.kad)}</span></span></button>`;
}
function openSpec(id) {
  const x = SPEC.specijaliteti.find(s => s.id === id); if (!x) return;
  openSheet(t("spec_vrsta_" + x.vrsta), `<div class="stack">
    ${x.slika ? `<figure class="hero foto" style="background:${x.boja}"><img src="${esc(fotoSrc(x.slika))}" alt="" decoding="async" onload="this.parentNode.classList.add('ok')" onerror="this.remove()">
      <figcaption><a href="${esc(x.slika.izvor)}" target="_blank" rel="noopener">${esc(t("foto_autor", { autor: x.slika.autor }))}</a> · <a href="${esc(x.slika.licenca_url || x.slika.izvor)}" target="_blank" rel="noopener">${esc(x.slika.licenca)}</a></figcaption></figure>` : `<div class="hero" style="background:${x.boja};height:96px"></div>`}
    <h1>${esc(x.naziv)}</h1><p style="margin:0;font-size:1.06em">${esc(x.opis)}</p>
    <dl class="info"><div class="info-row"><dt>${esc(t("spec_kad"))}</dt><dd>${esc(x.kad)}</dd></div><div class="info-row"><dt>${esc(t("spec_probaj"))}</dt><dd>${esc(x.probaj)}</dd></div></dl>
    ${(x.ref || []).filter(i => BY[i]).map(i => `<button class="list-row" data-open="${i}"><span class="dot" style="background:${boja(BY[i])}"></span><span class="t"><b>${esc(tx(BY[i]).naziv)}</b><span>${esc(katNaziv(BY[i]))}${S.pos ? " · " + fmtDist(hav(S.pos, BY[i])) : ""}</span></span>${ic("chevron")}</button>`).join("")}
    ${x.veza === "gljive" && DANAS.gljive_url ? `<a class="btn" href="${esc(DANAS.gljive_url)}" target="_blank" rel="noopener">${esc(t("gljive_otvori"))}</a>` : ""}
    <button class="btn primary" data-gfiltar="${x.vrsta === "pice" ? "opg" : "jelo"}">${esc(t(x.vrsta === "pice" ? "spec_kupi" : "spec_gdje"))}</button>
    <p class="small muted" style="margin:0">${esc(t("info_izvor_kratko"))}: ${SPEC.izvori.map(i => `<a href="${esc(i.url)}" target="_blank" rel="noopener">${esc(i.naziv)}</a>`).join(", ")}</p></div>`);
}
function gastroLista() {
  const r = ref(), [, f] = G_FILTRI.find(([k]) => k === S.gastro.f);
  let list = TOCKE.filter(f).map(p => ({ p, d: hav(r, p), st: p.usluga ? rvStanje(p.usluga.radno_vrijeme) : null }));
  if (S.gastro.otvoreno) list = list.filter(x => x.st && x.st.otvoreno);
  list.sort((a, b) => (b.p.usluga && b.p.usluga.partner ? 1 : 0) - (a.p.usluga && a.p.usluga.partner ? 1 : 0) || a.d - b.d);
  if (!list.length) return `<p class="muted" style="margin:0">${esc(t("gastro_nema"))}</p>`;
  return list.slice(0, 25).map(({ p, d }) => `<button class="list-row" data-open="${p.id}"><span class="dot" style="background:${boja(p)}"></span>
    <span class="t"><b>${esc(tx(p).naziv)}${p.usluga && p.usluga.partner ? ` <span class="badge free">${esc(t("partner"))}</span>` : ""}</b><span>${esc(katNaziv(p))} · ${rvOznaka(p.usluga || {}, true)}</span></span>
    <span class="mono small">${fmtDist(d)}</span></button>`).join("");
}
function renderGastro() {
  const G = S.gastro;
  $("#gastro").innerHTML = `<div class="between"><h1>${esc(t("gastro_naslov"))}</h1><button class="sos" data-go="sigurnost" aria-label="${esc(t("sos_aria"))}">${esc(t("sos"))}</button></div>
    ${medoOblak(t("gastro_medo_n"), t("gastro_medo"), null, 64)}
    <section class="stack" style="gap:8px"><h2>${esc(t("spec_naslov"))}</h2><div class="ideas">${SPEC.specijaliteti.map(specKartica).join("")}</div></section>
    <section class="stack" style="gap:8px"><h2>${esc(t("gastro_gdje"))}</h2>
      <div class="g-filter" role="group">${G_FILTRI.map(([k]) => `<button class="chip soft" data-gf="${k}" aria-pressed="${G.f === k}">${esc(t("g_" + k))}</button>`).join("")}</div>
      <div class="row" style="justify-content:space-between"><button class="chip" id="gOtv" aria-pressed="${G.otvoreno}">${esc(t("samo_otvoreno"))}</button>
        <button class="btn" id="gKarta" style="min-height:44px">${ic("map")}${esc(t("na_karti"))}</button></div>
      <div>${gastroLista()}</div>
      <p class="small muted" style="margin:0">${esc(t(S.pos ? "zracno" : "blizu_sredista"))}</p></section>
    <div class="card stack" style="gap:8px"><b>${esc(t("vlasnik_naslov"))}</b><span class="small muted">${esc(t("vlasnik_tekst"))}</span>
      <a class="btn" style="align-self:flex-start" href="mailto:${CONFIG.kontakt}?subject=${encodeURIComponent(t("vlasnik_predmet_opce"))}">${ic("msg")}${esc(t("vlasnik_gumb"))}</a></div>`;
}
$("#gastro").addEventListener("click", e => {
  const sp = e.target.closest("[data-spec]"); if (sp) { openSpec(sp.dataset.spec); return; }
  const gf = e.target.closest("[data-gf]"); if (gf) { S.gastro.f = gf.dataset.gf; renderGastro(); gcEv("gastro-" + S.gastro.f); return; }
  if (e.target.closest("#gOtv")) { S.gastro.otvoreno = !S.gastro.otvoreno; renderGastro(); return; }
  if (e.target.closest("#gKarta")) { S.grupa = { jelo: "jelo", spavanje: "spavanje", opg: "opg", trgovine: "kupnja" }[S.gastro.f]; renderChips(); renderMarkers(); renderNear(); go("karta"); }
});
document.addEventListener("click", e => { const b = e.target.closest("[data-gfiltar]"); if (b) { S.gastro.f = b.dataset.gfiltar; closeSheet(); go("gastro"); } });

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
      <div class="grid2"><div class="field"><label for="jRuta">${esc(t("javi_ruta"))}</label><select id="jRuta">${RUTE.map(x => `<option${S.javiRuta === tx(x).naziv ? " selected" : ""}>${esc(tx(x).naziv)}</option>`).join("")}<option>${esc(t("drugo"))}</option></select></div>
        <div class="field"><label for="jVrijeme">${esc(t("javi_povratak"))}</label><input id="jVrijeme" type="time" value="${pv}"></div></div>
      <button class="btn dark" id="jPosalji">${esc(t("javi_posalji"))}</button>
      <div class="between" style="border-top:1px solid var(--line);padding-top:8px"><span>${esc(t("zalazak_danas"))}</span><span class="mono">${st ? fmtTime(st.set) : "–"}</span></div></section>
    <section class="stack" style="gap:8px"><h2>${esc(t("u_sumi"))}</h2>${medoOblak(t("medo_sigurnost_n"), t("medo_sigurnost"), null, 64)}${tips.map(k => `<details class="tip"><summary>${esc(t("savjet_" + k + "_n"))}</summary><p>${esc(t("savjet_" + k + "_d"))}</p></details>`).join("")}</section>
`;
}
function openFotoZasluge() {
  const po = {};
  for (const [id, s] of Object.entries(SLIKE)) (po[s.naslov] = po[s.naslov] || { s, ids: [] }).ids.push(id);
  for (const x of SPEC.specijaliteti) if (x.slika) (po[x.slika.naslov] = po[x.slika.naslov] || { s: x.slika, ids: [], nazivi: [] }).nazivi = [x.naziv];
  openSheet(t("foto_zasluge"), `<p class="small muted" style="margin:0 0 8px">${esc(t("foto_zasluge_uvod"))}</p>` +
    Object.values(po).map(({ s, ids, nazivi }) => `<div class="list-row" style="align-items:flex-start"><span class="t"><b>${esc(ids.map(i => BY[i] ? tx(BY[i]).naziv : i).concat(nazivi || []).join(", "))}</b>
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
  if (e.target.closest("#sOApp")) openOApp();
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
      ${S.moja.map(m => `<button class="list-row" data-open="m:${esc(m.id)}"><span class="dot" style="background:var(--accent)"></span><span class="t"><b>${esc(m.ime)}</b><span>${esc(t("kat_moje"))} · ${new Date(m.t).toLocaleDateString(LOC())}</span></span></button>`).join("")}</div>
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
  const [i18n, tocke, rute, kat, danas, slike, usluge, put, info, spec, bike, lynxD] = await Promise.all([get(`i18n/${CONFIG.jezik}.json`), get("data/tocke.json"), get("data/rute.json"), get("data/kategorije.json"), get("data/danas.json"), get("data/slike.json").catch(() => ({})), get("data/usluge.json").catch(() => ({ usluge: [] })), get("data/putovnica.json").catch(() => null), get("data/info.json").catch(() => ({})), get("data/specijaliteti.json").catch(() => null), get("data/rute_bicikl.json").catch(() => ({ rute: [] })), get("data/lynx.json").catch(() => null)]);
  T = i18n; KAT = kat; DANAS = danas; SLIKE = slike || {}; if (put) PUT = put; INFO = info || {}; if (spec) SPEC = spec; if (lynxD) LYNX = lynxD;
  TOCKE = tocke.tocke; RUTE = rute.rute.concat((bike && bike.rute) || []);
  if (CONFIG.jezik !== "hr") {
    (SPEC.specijaliteti || []).forEach(preko); Object.values(INFO).forEach(preko);
    (LYNX.cinjenice || []).forEach(c => { if (c[CONFIG.jezik]) c.tekst = c[CONFIG.jezik].tekst; });
    RUTE.forEach(r => (r.polazista || []).forEach(preko));
  }
  /* usluge (jelo, smještaj, kupnja) idu na kartu kao točke; partneri su istaknuti */
  for (const u of (usluge && usluge.usluge) || []) TOCKE.push({ id: u.id, kategorija: u.vrsta, podvrsta: u.podvrsta, tekst: { hr: { naziv: u.naziv, opis: u.opis || "" } }, lat: u.lat, lon: u.lon, vaznost: u.partner || u.podvrsta === "opg" ? 2 : 3, usluga: u });
  for (const p of TOCKE) {
    p.grupe = grupeOd(p); BY[p.id] = p;
    if (p.zima && !p.grupe.includes("zima")) p.grupe.push("zima");                                /* skijališta i sanjkališta */
    if (p.usluga && p.usluga.i_jelo && !p.grupe.includes("jelo")) p.grupe.push("jelo");          /* hotel s restoranom */
    if (p.usluga && p.usluga.i_spavanje && !p.grupe.includes("spavanje")) p.grupe.push("spavanje"); /* konoba sa sobama */
  }
  for (const r of RUTE) RBY[r.id] = r;
  applyI18n(); netStatus(); renderChips(); initMap(); renderNear();
  const h = location.hash.slice(1); go(["karta", "danas", "gastro", "rute", "moje", "sigurnost"].includes(h) ? h : "karta");
  gcInit();
  if (!store.get("gk-pozdrav", false)) setTimeout(openPozdrav, 500);
  if (!PREGLED && "serviceWorker" in navigator && location.protocol !== "file:") navigator.serviceWorker.register("sw.js").catch(() => {});
}
boot().catch(e => { document.body.innerHTML = `<p style="padding:24px;font:16px system-ui">Podaci se nisu učitali. Osvježi stranicu dok imaš signal.<br><br>The data could not be loaded. Reload the page while you have signal.</p>`; console.error(e); });
