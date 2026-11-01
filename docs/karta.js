/* Sjenčanje se ne prikazuje iznad z15: Leaflet bi pločicu z13 na z19 razvukao na 16384 px, što preglednik jedva podnosi.
   Zelenko karta: vlastita topografska podloga iz karta/ (OSM + Copernicus DEM), crta je protomaps-leaflet.
   Vektorske pločice z8–14 (iznad se povećavaju), sjenčanje terena z8–13 kao prozirne slike. */
"use strict";
window.ZelenkoKarta = (() => {
  const P = window.protomapsL;
  const F = 'Barlow, system-ui, -apple-system, "Segoe UI", sans-serif';
  const C = {
    pozadina: "#F1F2E6", suma: "#D7E6CB", livada: "#EEF2DA", naselje: "#ECE6DC", stijene: "#E4E0D8", mocvara: "#DCEADF", park: "#D9EAC9",
    voda: "#A8CCE6", vodotok: "#6FA6D3", zgrada: "#D6CABB", zgradaRub: "#BBAD9B",
    autocesta: "#E8925F", autocestaRub: "#A75A31", glavna: "#F4CB72", glavnaRub: "#B88B32", bijela: "#FFFFFF", bijelaRub: "#A9A79C",
    makadam: "#8A6E47", staza: "#6C5A43", markirana: "#D3242C", pruga: "#5D5D5D", slojnica: "#B48A57", zastita: "#2F7D4F",
    tekst: "#26332C", tekstRub: "rgba(255,255,255,.9)", vodaTekst: "#2E6F9E", vrh: "#6B4F2A"
  };
  const TAMNA = {
    pozadina: "#1D2521", suma: "#22322A", livada: "#262F29", naselje: "#2E2F2C", stijene: "#36372F", mocvara: "#22312D", park: "#253726",
    voda: "#1E3F57", vodotok: "#3F80B0", zgrada: "#3B3933", zgradaRub: "#4B473F",
    autocesta: "#B9693F", autocestaRub: "#5E3119", glavna: "#A78A46", glavnaRub: "#4F3E1B", bijela: "#5E645D", bijelaRub: "#262A27",
    makadam: "#A88B62", staza: "#A0907A", markirana: "#E2585E", pruga: "#8B8B8B", slojnica: "#97805A", zastita: "#62B183",
    tekst: "#E3EAE5", tekstRub: "rgba(18,24,21,.92)", vodaTekst: "#8EC3EA", vrh: "#DCC8A4"
  };
  let C_ = C;
  const k = v => (z, f) => f.props.k === v;
  const sirina = stops => P.exp(1.6, stops);
  function pravila() {
    const paint = [
      { dataLayer: "pokrov", symbolizer: new P.PolygonSymbolizer({ fill: C_.suma }), filter: k("suma") },
      { dataLayer: "pokrov", symbolizer: new P.PolygonSymbolizer({ fill: C_.livada }), filter: k("livada") },
      { dataLayer: "pokrov", symbolizer: new P.PolygonSymbolizer({ fill: C_.mocvara }), filter: k("mocvara") },
      { dataLayer: "pokrov", symbolizer: new P.PolygonSymbolizer({ fill: C_.naselje }), filter: k("naselje") },
      { dataLayer: "pokrov", symbolizer: new P.PolygonSymbolizer({ fill: C_.stijene }), filter: k("stijene") },
      { dataLayer: "pokrov", symbolizer: new P.PolygonSymbolizer({ fill: C_.park }), filter: k("park") },
      { dataLayer: "slojnice", symbolizer: new P.LineSymbolizer({ color: C_.slojnica, opacity: .45, width: (z, f) => f.props.i ? (z >= 14 ? 1.1 : .9) : .55 }),
        filter: (z, f) => z >= 13 ? f.props.e % 20 === 0 : z >= 12 ? f.props.e % 50 === 0 : true },
      { dataLayer: "voda", symbolizer: new P.PolygonSymbolizer({ fill: C_.voda }) },
      { dataLayer: "vodotoci", symbolizer: new P.LineSymbolizer({ color: C_.vodotok, width: sirina([[9, .8], [14, 2.6], [18, 5]]) }), filter: k("rijeka") },
      { dataLayer: "vodotoci", symbolizer: new P.LineSymbolizer({ color: C_.vodotok, width: sirina([[12, .5], [15, 1.4], [18, 2.5]]) }), filter: k("potok") },
      { dataLayer: "zgrade", symbolizer: new P.PolygonSymbolizer({ fill: C_.zgrada, stroke: C_.zgradaRub, width: .6 }), minzoom: 14 },
      { dataLayer: "zastita", symbolizer: new P.LineSymbolizer({ color: C_.zastita, width: 2, opacity: .55, dash: [6, 4] }) },
      /* ceste: najprije rubovi, onda ispuna */
      { dataLayer: "ceste", symbolizer: new P.LineSymbolizer({ color: C_.makadam, width: sirina([[12, .7], [15, 1.4], [18, 2.4]]), dash: [5, 3] }), filter: k("makadam") },
      { dataLayer: "ceste", symbolizer: new P.LineSymbolizer({ color: C_.staza, width: sirina([[13, .6], [16, 1.1], [18, 1.8]]), dash: [2, 3] }), filter: k("staza") },
      { dataLayer: "ceste", symbolizer: new P.LineSymbolizer({ color: C_.pruga, width: 1.6, dash: [7, 4] }), filter: k("pruga") },
      { dataLayer: "ceste", symbolizer: new P.LineSymbolizer({ color: C_.bijelaRub, width: sirina([[12, 2], [15, 5.5], [18, 14]]) }), filter: (z, f) => f.props.k === "lokalna" || f.props.k === "servis" },
      { dataLayer: "ceste", symbolizer: new P.LineSymbolizer({ color: C_.bijelaRub, width: sirina([[10, 2.2], [14, 6], [18, 16]]) }), filter: k("sporedna") },
      { dataLayer: "ceste", symbolizer: new P.LineSymbolizer({ color: C_.glavnaRub, width: sirina([[8, 1.8], [14, 7.5], [18, 18]]) }), filter: k("glavna") },
      { dataLayer: "ceste", symbolizer: new P.LineSymbolizer({ color: C_.autocestaRub, width: sirina([[8, 2.4], [14, 8.5], [18, 20]]) }), filter: k("autocesta") },
      { dataLayer: "ceste", symbolizer: new P.LineSymbolizer({ color: C_.bijela, width: sirina([[12, 1], [15, 4], [18, 11]]) }), filter: (z, f) => f.props.k === "lokalna" || f.props.k === "servis" },
      { dataLayer: "ceste", symbolizer: new P.LineSymbolizer({ color: C_.bijela, width: sirina([[10, 1.2], [14, 4.6], [18, 13]]) }), filter: k("sporedna") },
      { dataLayer: "ceste", symbolizer: new P.LineSymbolizer({ color: C_.glavna, width: sirina([[8, 1], [14, 6], [18, 15]]) }), filter: k("glavna") },
      { dataLayer: "ceste", symbolizer: new P.LineSymbolizer({ color: C_.autocesta, width: sirina([[8, 1.4], [14, 7], [18, 17]]) }), filter: k("autocesta") },
      { dataLayer: "markirane", symbolizer: new P.LineSymbolizer({ color: C_.markirana, width: sirina([[11, 1.2], [15, 2.2], [18, 3.2]]), dash: [6, 3], opacity: .9 }) }
    ];
    const tx = (size, weight, fill) => ({ fontFamily: F, fontSize: size, fontWeight: weight, fill: fill || C_.tekst, stroke: C_.tekstRub, width: 2.5 });
    const label = [
      { dataLayer: "mjesta", symbolizer: new P.CenteredTextSymbolizer({ labelProps: ["n"], ...tx((z, f) => f.props.r === 1 ? (z < 11 ? 14 : 16) : f.props.r === 2 ? (z < 12 ? 12 : 14) : 12, (z, f) => f.props.r <= 2 ? 700 : 600) }),
        sort: (a, b) => a.r - b.r },
      { dataLayer: "vrhovi", symbolizer: new P.OffsetTextSymbolizer({ labelProps: ["l", "n"], ...tx(11.5, 600, C_.vrh), offsetX: 11, offsetY: 11, placements: [P.TextPlacements.E, P.TextPlacements.W, P.TextPlacements.Ne, P.TextPlacements.Sw] }), sort: (a, b) => (b.e || 0) - (a.e || 0) },
      { dataLayer: "vodotoci", symbolizer: new P.LineLabelSymbolizer({ labelProps: ["n"], ...tx(11.5, 500, C_.vodaTekst) }), filter: k("rijeka"), minzoom: 12 },
      { dataLayer: "ceste", symbolizer: new P.LineLabelSymbolizer({ labelProps: ["n"], ...tx(11, 500) }), minzoom: 15, filter: (z, f) => f.props.k !== "staza" && f.props.k !== "makadam" },
      { dataLayer: "slojnice", symbolizer: new P.LineLabelSymbolizer({ labelProps: ["et"], ...tx(9.5, 500, C_.slojnica), repeatDistance: 400 }), minzoom: 14, filter: (z, f) => f.props.i === 1 }
    ];
    return { paint, label };
  }
  /* osnova: url do mape karta/ (npr. "karta/"); vraća { vektor, sjencanje } za dodavanje na kartu */
  function slojevi(osnova, opcije = {}) {
    C_ = opcije.tamna ? TAMNA : C;
    const { paint, label } = pravila();
    const vektor = P.leafletLayer({
      url: osnova + "v/{z}/{x}/{y}.mvt" + (opcije.v ? "?v=" + opcije.v : ""), maxDataZoom: 14, minZoom: 9, maxZoom: 19, paintRules: paint, labelRules: opcije.bezNatpisa ? [] : opcije.natpisi ? label.filter(r => opcije.natpisi.includes(r.dataLayer)) : label,
      backgroundColor: C_.pozadina, devicePixelRatio: Math.min(2, window.devicePixelRatio || 1), tileDelay: 3, updateWhenZooming: false, keepBuffer: 1, className: opcije.className || "", attribution: opcije.attribution || "", ...(opcije.bounds ? { bounds: opcije.bounds } : {})
    });
    const sjencanje = L.tileLayer(osnova + "s/{z}/{x}/{y}.webp" + (opcije.v ? "?v=" + opcije.v : ""), { maxNativeZoom: 13, minZoom: 9, maxZoom: 15, className: (opcije.className || "") + " sjencanje", ...(opcije.bounds ? { bounds: opcije.bounds } : {}), errorTileUrl: "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" });
    return { vektor, sjencanje };
  }
  return { slojevi, boje: C };
})();
