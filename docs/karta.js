/* Zelenko karta: vlastita topografska podloga iz karta/ (OSM + Copernicus DEM), crta je MapLibre GL (WebGL)
   unutar Leafleta (maplibre-gl-leaflet). Vektorske pločice z8–14 (iznad se povećavaju), sjenčanje terena z8–13,
   fontovi natpisa u karta/fonts (Noto Sans, SIL OFL). MapLibre podatke obrađuje u pozadinskim nitima,
   pa crtanje ne blokira stranicu. Zoom MapLibrea je za 1 manji od Leafletovog (pločice od 512 px). */
"use strict";
window.ZelenkoKarta = (() => {
  const SVIJETLA = {
    pozadina: "#F1F2E6", suma: "#D7E6CB", livada: "#EEF2DA", naselje: "#ECE6DC", stijene: "#E4E0D8", mocvara: "#DCEADF", park: "#D9EAC9",
    voda: "#A8CCE6", vodotok: "#6FA6D3", zgrada: "#D6CABB", zgradaRub: "#BBAD9B",
    autocesta: "#E8925F", autocestaRub: "#A75A31", glavna: "#F4CB72", glavnaRub: "#B88B32", bijela: "#FFFFFF", bijelaRub: "#A9A79C",
    makadam: "#8A6E47", staza: "#6C5A43", markirana: "#D3242C", pruga: "#5D5D5D", slojnica: "#B48A57", zastita: "#2F7D4F",
    tekst: "#26332C", tekstRub: "rgba(255,255,255,0.9)", vodaTekst: "#2E6F9E", vrh: "#6B4F2A", sjena: 0.85
  };
  const TAMNA = {
    pozadina: "#1D2521", suma: "#22322A", livada: "#262F29", naselje: "#2E2F2C", stijene: "#36372F", mocvara: "#22312D", park: "#253726",
    voda: "#1E3F57", vodotok: "#3F80B0", zgrada: "#3B3933", zgradaRub: "#4B473F",
    autocesta: "#B9693F", autocestaRub: "#5E3119", glavna: "#A78A46", glavnaRub: "#4F3E1B", bijela: "#5E645D", bijelaRub: "#262A27",
    makadam: "#A88B62", staza: "#A0907A", markirana: "#E2585E", pruga: "#8B8B8B", slojnica: "#97805A", zastita: "#62B183",
    tekst: "#E3EAE5", tekstRub: "rgba(18,24,21,0.92)", vodaTekst: "#8EC3EA", vrh: "#DCC8A4", sjena: 0.45
  };
  const OKVIR = [14.42, 45.15, 15.33, 45.70];
  /* zoom u stilu je Leafletov zoom − 1 */
  const z = n => n - 1;
  /* širina crte po Leafletovim zumovima: [[zoom, px], ...] → MapLibre izraz */
  const sir = stops => ["interpolate", ["exponential", 1.6], ["zoom"], ...stops.flatMap(([a, b]) => [z(a), b])];
  const k = v => ["==", ["get", "k"], v];
  const FONT = ["Noto Sans Medium"], FONT_R = ["Noto Sans Regular"], FONT_I = ["Noto Sans Italic"];

  function stil(osnova, v, C) {
    const q = v ? "?v=" + v : "";
    const url = new URL(osnova, location.href).href;
    const [W, S, E, N] = OKVIR;
    const fill = (id, f, boja, minzoom) => ({ id, type: "fill", source: "z", "source-layer": "pokrov", filter: f, minzoom: minzoom != null ? z(minzoom) : 0, paint: { "fill-color": boja } });
    const crta = (id, sloj, f, boja, sirina, extra = {}) => ({ id, type: "line", source: "z", "source-layer": sloj, ...(f ? { filter: f } : {}), layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": boja, "line-width": sirina, ...extra } });
    const halo = { "text-halo-color": C.tekstRub, "text-halo-width": 1.6 };
    const lokalne = ["in", ["get", "k"], ["literal", ["lokalna", "servis"]]];
    return {
      version: 8,
      glyphs: url + "fonts/{fontstack}/{range}.pbf",
      sources: {
        okvir: { type: "geojson", data: { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [[[W, S], [E, S], [E, N], [W, N], [W, S]]] } } },
        z: { type: "vector", tiles: [url + "v/{z}/{x}/{y}.mvt" + q], minzoom: 8, maxzoom: 14, bounds: OKVIR,
             attribution: "" },
        s: { type: "raster", tiles: [url + "s/{z}/{x}/{y}.webp" + q], tileSize: 256, minzoom: 8, maxzoom: 13, bounds: OKVIR }
      },
      layers: [
        { id: "pozadina", type: "fill", source: "okvir", minzoom: z(9), paint: { "fill-color": C.pozadina } },
        fill("suma", k("suma"), C.suma), fill("livada", k("livada"), C.livada), fill("mocvara", k("mocvara"), C.mocvara),
        fill("naselje", k("naselje"), C.naselje), fill("stijene", k("stijene"), C.stijene), fill("park", k("park"), C.park),
        { id: "sjencanje", type: "raster", source: "s", maxzoom: z(16), paint: { "raster-opacity": C.sjena, "raster-fade-duration": 0 } },
        /* slojnice: daleko 100 m, bliže 50 m, najbliže 20 m */
        { ...crta("slojnice-100", "slojnice", null, C.slojnica, ["case", ["==", ["get", "i"], 1], 0.9, 0.55], { "line-opacity": 0.45 }), maxzoom: z(12) },
        { ...crta("slojnice-50", "slojnice", ["==", ["%", ["get", "e"], 50], 0], C.slojnica, ["case", ["==", ["get", "i"], 1], 0.9, 0.55], { "line-opacity": 0.45 }), minzoom: z(12), maxzoom: z(13) },
        { ...crta("slojnice-20", "slojnice", ["==", ["%", ["get", "e"], 20], 0], C.slojnica, ["case", ["==", ["get", "i"], 1], 1.1, 0.55], { "line-opacity": 0.45 }), minzoom: z(13) },
        { id: "voda", type: "fill", source: "z", "source-layer": "voda", paint: { "fill-color": C.voda } },
        crta("rijeke", "vodotoci", k("rijeka"), C.vodotok, sir([[9, 0.8], [14, 2.6], [18, 5]])),
        crta("potoci", "vodotoci", k("potok"), C.vodotok, sir([[12, 0.5], [15, 1.4], [18, 2.5]])),
        { id: "zgrade", type: "fill", source: "z", "source-layer": "zgrade", minzoom: z(14), paint: { "fill-color": C.zgrada, "fill-outline-color": C.zgradaRub } },
        crta("zastita", "zastita", null, C.zastita, 2, { "line-opacity": 0.55, "line-dasharray": [3, 2] }),
        crta("makadam", "ceste", k("makadam"), C.makadam, sir([[12, 0.7], [15, 1.4], [18, 2.4]]), { "line-dasharray": [3, 2] }),
        crta("staza", "ceste", k("staza"), C.staza, sir([[13, 0.6], [16, 1.1], [18, 1.8]]), { "line-dasharray": [1.5, 2.5] }),
        crta("pruga", "ceste", k("pruga"), C.pruga, 1.6, { "line-dasharray": [4, 2.5] }),
        crta("lokalna-rub", "ceste", lokalne, C.bijelaRub, sir([[12, 2], [15, 5.5], [18, 14]])),
        crta("sporedna-rub", "ceste", k("sporedna"), C.bijelaRub, sir([[10, 2.2], [14, 6], [18, 16]])),
        crta("glavna-rub", "ceste", k("glavna"), C.glavnaRub, sir([[8, 1.8], [14, 7.5], [18, 18]])),
        crta("autocesta-rub", "ceste", k("autocesta"), C.autocestaRub, sir([[8, 2.4], [14, 8.5], [18, 20]])),
        crta("lokalna", "ceste", lokalne, C.bijela, sir([[12, 1], [15, 4], [18, 11]])),
        crta("sporedna", "ceste", k("sporedna"), C.bijela, sir([[10, 1.2], [14, 4.6], [18, 13]])),
        crta("glavna", "ceste", k("glavna"), C.glavna, sir([[8, 1], [14, 6], [18, 15]])),
        crta("autocesta", "ceste", k("autocesta"), C.autocesta, sir([[8, 1.4], [14, 7], [18, 17]])),
        crta("markirane", "markirane", null, C.markirana, sir([[11, 1.2], [15, 2.2], [18, 3.2]]), { "line-dasharray": [3, 1.5], "line-opacity": 0.9 }),
        /* natpisi */
        { id: "slojnice-natpis", type: "symbol", source: "z", "source-layer": "slojnice", minzoom: z(14), filter: ["has", "et"],
          layout: { "symbol-placement": "line", "text-field": ["get", "et"], "text-font": FONT_R, "text-size": 9.5, "symbol-spacing": 400 },
          paint: { "text-color": C.slojnica, ...halo } },
        { id: "ceste-natpis", type: "symbol", source: "z", "source-layer": "ceste", minzoom: z(15), filter: ["all", ["has", "n"], ["!", ["in", ["get", "k"], ["literal", ["staza", "makadam", "pruga"]]]]],
          layout: { "symbol-placement": "line", "text-field": ["get", "n"], "text-font": FONT_R, "text-size": 11 },
          paint: { "text-color": C.tekst, ...halo } },
        { id: "rijeke-natpis", type: "symbol", source: "z", "source-layer": "vodotoci", minzoom: z(12), filter: ["all", k("rijeka"), ["has", "n"]],
          layout: { "symbol-placement": "line", "text-field": ["get", "n"], "text-font": FONT_I, "text-size": 11.5 },
          paint: { "text-color": C.vodaTekst, ...halo } },
        { id: "vrhovi", type: "symbol", source: "z", "source-layer": "vrhovi",
          layout: { "text-field": ["coalesce", ["get", "l"], ["get", "n"]], "text-font": FONT, "text-size": 11.5, "text-max-width": 8,
                    "text-variable-anchor": ["left", "right", "bottom-left", "top-right"], "text-radial-offset": 0.9, "text-justify": "auto",
                    "symbol-sort-key": ["-", 0, ["coalesce", ["get", "e"], 0]] },
          paint: { "text-color": C.vrh, ...halo } },
        { id: "mjesta", type: "symbol", source: "z", "source-layer": "mjesta",
          layout: { "text-field": ["get", "n"], "text-font": FONT, "text-max-width": 8, "symbol-sort-key": ["get", "r"],
                    "text-size": ["step", ["zoom"], ["match", ["get", "r"], 1, 14, 12], z(11), ["match", ["get", "r"], 1, 16, 12], z(12), ["match", ["get", "r"], 1, 16, 2, 14, 12]] },
          paint: { "text-color": C.tekst, "text-halo-color": C.tekstRub, "text-halo-width": 2 } }
      ]
    };
  }
  /* osnova: url do mape karta/ (npr. "karta/"); vraća { vektor } – jedan sloj s cijelom kartom */
  function slojevi(osnova, opcije = {}) {
    const vektor = L.maplibreGL({
      style: stil(osnova, opcije.v, opcije.tamna ? TAMNA : SVIJETLA),
      interactive: false, attributionControl: false, padding: 0.1,
      fadeDuration: 0, maxTileCacheSize: 120, localIdeographFontFamily: false
    });
    return { vektor, sjencanje: null };
  }
  return { slojevi, boje: SVIJETLA };
})();
