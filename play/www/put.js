/* Izračun puta po mreži putova (data/mreza.json, OSM ODbL), bez interneta.
   Put.ucitaj(json) → mreža; Put.nadi(mreza, od, do, profil) → { tocke, m, upute, odPuta, doPuta } ili null.
   Profili: "pjesice" (staze i šumske ceste prije asfalta), "bicikl" (ceste i makadam, staze tek kad mora). */
(function (g) {
  "use strict";
  const R = 6371000, RAD = Math.PI / 180;
  function hav(ax, ay, bx, by) {
    const x = Math.sin((by - ay) * RAD / 2) ** 2 + Math.cos(ay * RAD) * Math.cos(by * RAD) * Math.sin((bx - ax) * RAD / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(x));
  }
  /* težine po vrsti puta: manje = poželjnije */
  const TEZINE = {
    pjesice: { path: 1, footway: 1, bridleway: 1, steps: 1.2, track: 1.05, service: 1.15, unclassified: 1.2, residential: 1.15, living_street: 1.1,
      pedestrian: 1, tertiary: 1.5, tertiary_link: 1.5, secondary: 2.5, secondary_link: 2.5, primary: 4, primary_link: 4, cycleway: 1.1 },
    bicikl: { track: 1.3, service: 1.1, unclassified: 1, residential: 1, living_street: 1.1, tertiary: 1, tertiary_link: 1, secondary: 1.3,
      secondary_link: 1.3, primary: 2, primary_link: 2, cycleway: 0.9, path: 2.5, bridleway: 2, footway: 3, pedestrian: 2 }
  };
  const BRZINA = { pjesice: 4.2, bicikl: 14 };          /* km/h za procjenu vremena */

  function ucitaj(d) {
    const nn = d.n.length / 2, X = new Float64Array(nn), Y = new Float64Array(nn);
    let x = 0, y = 0;
    for (let i = 0; i < nn; i++) { x += d.n[2 * i]; y += d.n[2 * i + 1]; X[i] = x / 1e5; Y[i] = y / 1e5; }
    const ne = d.e.length, A = new Int32Array(ne), B = new Int32Array(ne), L = new Float32Array(ne), C = new Uint8Array(ne), F = new Uint8Array(ne), M = new Int32Array(ne);
    const deg = new Int32Array(nn + 1);
    const bb = new Float32Array(ne * 4), geo = new Array(ne);
    for (let i = 0; i < ne; i++) {
      const e = d.e[i]; A[i] = e[0]; B[i] = e[1]; L[i] = e[2]; C[i] = e[3]; F[i] = e[4]; M[i] = e[5]; geo[i] = e[6];
      deg[e[0] + 1]++; deg[e[1] + 1]++;
    }
    for (let i = 0; i < nn; i++) deg[i + 1] += deg[i];
    const adj = new Int32Array(deg[nn]), pos = deg.slice(0, nn);
    for (let i = 0; i < ne; i++) { adj[pos[A[i]]++] = i; adj[pos[B[i]]++] = i; }
    const m = { X, Y, A, B, L, C, F, M, deg, adj, geo, vrste: d.c, imena: d.m, bb, oblik: new Array(ne) };
    for (let i = 0; i < ne; i++) {
      const o = oblik(m, i); let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      for (const [px, py] of o) { if (px < x0) x0 = px; if (px > x1) x1 = px; if (py < y0) y0 = py; if (py > y1) y1 = py; }
      bb[4 * i] = x0; bb[4 * i + 1] = y0; bb[4 * i + 2] = x1; bb[4 * i + 3] = y1;
    }
    return m;
  }
  /* oblik brida od A prema B kao [[lon, lat], ...] */
  function oblik(m, i) {
    if (m.oblik[i]) return m.oblik[i];
    const g = m.geo[i] || [], o = [[m.X[m.A[i]], m.Y[m.A[i]]]];
    let x = Math.round(m.X[m.A[i]] * 1e5), y = Math.round(m.Y[m.A[i]] * 1e5);
    for (let k = 0; k < g.length; k += 2) { x += g[k]; y += g[k + 1]; o.push([x / 1e5, y / 1e5]); }
    o.push([m.X[m.B[i]], m.Y[m.B[i]]]);
    return (m.oblik[i] = o);
  }
  /* najbliža točka na mreži (projekcija na segment) */
  function pripoji(m, lon, lat, profil, maxM) {
    const kx = Math.cos(lat * RAD) * 111320, ky = 110540, r = (maxM || 3000) / 111320 * 1.5;
    let best = null;
    for (let i = 0; i < m.A.length; i++) {
      if (m.bb[4 * i] > lon + r || m.bb[4 * i + 2] < lon - r || m.bb[4 * i + 1] > lat + r || m.bb[4 * i + 3] < lat - r) continue;
      if (zabranjen(m, i, profil)) continue;
      const o = oblik(m, i); let uz = 0;
      for (let k = 0; k < o.length - 1; k++) {
        const ax = (o[k][0] - lon) * kx, ay = (o[k][1] - lat) * ky, bx = (o[k + 1][0] - lon) * kx, by = (o[k + 1][1] - lat) * ky;
        const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy, seg = Math.sqrt(l2);
        let t = l2 ? -(ax * dx + ay * dy) / l2 : 0; t = Math.max(0, Math.min(1, t));
        const px = ax + t * dx, py = ay + t * dy, d = Math.sqrt(px * px + py * py);
        if (!best || d < best.d) best = { d, e: i, k, t, uz: uz + t * seg, x: lon + px / kx, y: lat + py / ky };
        uz += seg;
      }
      if (best && best.e === i) best.duz = uz;
    }
    if (!best) return null;
    const o = oblik(m, best.e); let uk = 0;
    for (let k = 0; k < o.length - 1; k++) uk += hav(o[k][0], o[k][1], o[k + 1][0], o[k + 1][1]);
    best.f = uk ? Math.min(1, best.uz / Math.max(uk, 1e-9)) : 0;   /* udio puta od A */
    return best;
  }
  function zabranjen(m, i, profil) {
    const f = m.F[i], v = m.vrste[m.C[i]];
    if (profil === "pjesice") return !!(f & 1);
    return !!(f & 2) || !(v in TEZINE.bicikl);
  }
  function cijena(m, i, profil) {
    const v = m.vrste[m.C[i]], f = m.F[i];
    let w = (TEZINE[profil][v] || 3) * m.L[i];
    if (profil === "pjesice") { if (f & 4) w *= 0.9; if (f & 8) w *= 1.6; }
    return w;
  }
  /* binarna gomila */
  function Gomila() { this.k = []; this.v = []; }
  Gomila.prototype.push = function (key, val) {
    const k = this.k, v = this.v; let i = k.length; k.push(key); v.push(val);
    while (i > 0) { const p = (i - 1) >> 1; if (k[p] <= key) break; k[i] = k[p]; v[i] = v[p]; i = p; }
    k[i] = key; v[i] = val;
  };
  Gomila.prototype.pop = function () {
    const k = this.k, v = this.v, top = v[0], lk = k.pop(), lv = v.pop(), n = k.length;
    if (n) {
      let i = 0;
      while (true) { let c = 2 * i + 1; if (c >= n) break; if (c + 1 < n && k[c + 1] < k[c]) c++; if (k[c] >= lk) break; k[i] = k[c]; v[i] = v[c]; i = c; }
      k[i] = lk; v[i] = lv;
    }
    return top;
  };

  function nadi(m, od, cilj, profil) {
    const s = pripoji(m, od.lon, od.lat, profil, 5000), z = pripoji(m, cilj.lon, cilj.lat, profil, 5000);
    if (!s || !z) return null;
    const nn = m.X.length, G = new Float64Array(nn + 2).fill(Infinity), P = new Int32Array(nn + 2).fill(-1), PE = new Int32Array(nn + 2).fill(-1);
    const S = nn, Z = nn + 1, min = profil === "pjesice" ? 0.9 : 0.9;
    const h = i => i === Z ? 0 : hav(m.X[i], m.Y[i], z.x, z.y) * min;
    /* isti brid: izravno */
    let izravno = null;
    if (s.e === z.e) {
      const smjerOk = !(profil === "bicikl" && (m.F[s.e] & 16) && z.f < s.f);
      if (smjerOk) izravno = Math.abs(z.f - s.f) * cijena(m, s.e, profil);
    }
    const H = new Gomila(), sw = cijena(m, s.e, profil);
    const ul = (n, g, e) => { if (g < G[n]) { G[n] = g; P[n] = S; PE[n] = e; H.push(g + h(n), n); } };
    ul(m.A[s.e], s.f * sw, s.e);
    if (!(profil === "bicikl" && (m.F[s.e] & 16))) ul(m.B[s.e], (1 - s.f) * sw, s.e);
    const zw = cijena(m, z.e, profil), zA = m.A[z.e], zB = m.B[z.e], zjedn = profil === "bicikl" && (m.F[z.e] & 16);
    G[S] = 0;
    let n = 0;
    while (H.k.length) {
      const u = H.pop(); if (u === Z) break;
      if (++n > 400000) break;
      const gu = G[u];
      if (u === zA) { const c = gu + z.f * zw; if (c < G[Z]) { G[Z] = c; P[Z] = u; PE[Z] = z.e; H.push(c, Z); } }
      if (u === zB && !zjedn) { const c = gu + (1 - z.f) * zw; if (c < G[Z]) { G[Z] = c; P[Z] = u; PE[Z] = z.e; H.push(c, Z); } }
      for (let k = m.deg[u]; k < m.deg[u + 1]; k++) {
        const e = m.adj[k]; if (zabranjen(m, e, profil)) continue;
        const v = m.A[e] === u ? m.B[e] : m.A[e];
        if (profil === "bicikl" && (m.F[e] & 16) && m.A[e] !== u) continue;
        const c = gu + cijena(m, e, profil);
        if (c < G[v]) { G[v] = c; P[v] = u; PE[v] = e; H.push(c + h(v), v); }
      }
    }
    if (G[Z] === Infinity && izravno == null) return null;
    /* sastavi niz bridova */
    let tocke, bridovi = [];
    if (izravno != null && izravno <= G[Z]) {
      tocke = dioBrida(m, s.e, s.f, z.f); bridovi = [{ e: s.e, od: 0 }];
    } else {
      const lanac = []; let x = Z;
      while (x !== S && x !== -1) { lanac.push([PE[x], x, P[x]]); x = P[x]; }
      lanac.reverse();
      tocke = [];
      for (const [e, doC, odC] of lanac) {
        let dio;
        if (odC === S) dio = m.A[e] === doC ? dioBrida(m, e, s.f, 0) : dioBrida(m, e, s.f, 1);
        else if (doC === Z) dio = m.A[e] === odC ? dioBrida(m, e, 0, z.f) : dioBrida(m, e, 1, z.f);
        else dio = m.A[e] === odC ? oblik(m, e).slice() : oblik(m, e).slice().reverse();
        bridovi.push({ e, od: Math.max(0, tocke.length - 1) });
        if (tocke.length) dio = dio.slice(1);
        tocke = tocke.concat(dio);
      }
    }
    let dul = 0; const kum = [0];
    for (let i = 1; i < tocke.length; i++) { dul += hav(tocke[i - 1][0], tocke[i - 1][1], tocke[i][0], tocke[i][1]); kum.push(dul); }
    return { tocke, kum, m: dul, sati: dul / 1000 / BRZINA[profil], upute: upute(m, tocke, kum, bridovi), odPuta: s.d, doPuta: z.d,
      pristup: [s.x, s.y], dolazak: [z.x, z.y], markirano: bridovi.some(b => m.F[b.e] & 4) };
  }
  /* dio brida između udjela f0 i f1 (od A), u smjeru f0 → f1 */
  function dioBrida(m, e, f0, f1) {
    const o = oblik(m, e), kum = [0];
    for (let k = 1; k < o.length; k++) kum.push(kum[k - 1] + hav(o[k - 1][0], o[k - 1][1], o[k][0], o[k][1]));
    const L = kum[kum.length - 1] || 1;
    const tocka = f => { const d = f * L; for (let k = 1; k < o.length; k++) if (kum[k] >= d) { const t = (d - kum[k - 1]) / ((kum[k] - kum[k - 1]) || 1); return [o[k - 1][0] + t * (o[k][0] - o[k - 1][0]), o[k - 1][1] + t * (o[k][1] - o[k - 1][1])]; } return o[o.length - 1]; };
    const lo = Math.min(f0, f1), hi = Math.max(f0, f1), out = [tocka(lo)];
    for (let k = 1; k < o.length - 1; k++) if (kum[k] > lo * L && kum[k] < hi * L) out.push(o[k]);
    out.push(tocka(hi));
    return f0 <= f1 ? out : out.reverse();
  }
  function smjer(a, b) { return Math.atan2((b[0] - a[0]) * Math.cos(a[1] * RAD), b[1] - a[1]) / RAD; }
  /* upute za skretanje na raskrižjima: gdje (m od početka), kut i na kakav put */
  function upute(m, tocke, kum, bridovi) {
    const out = [];
    for (let j = 1; j < bridovi.length; j++) {
      const i = bridovi[j].od, preth = bridovi[j - 1].e, sad = bridovi[j].e;
      if (i <= 0 || i >= tocke.length - 1 || kum[i] < 20) continue;
      /* raskrižje: zajednički čvor; bez izbora (samo 2 puta) nema upute */
      const cv = (m.A[sad] === m.A[preth] || m.A[sad] === m.B[preth]) ? m.A[sad] : m.B[sad];
      if (m.deg[cv + 1] - m.deg[cv] <= 2) continue;
      let a = i - 1; while (a > 0 && kum[i] - kum[a] < 20) a--;
      let b = i + 1; while (b < tocke.length - 1 && kum[b] - kum[i] < 20) b++;
      let kut = smjer(tocke[i], tocke[b]) - smjer(tocke[a], tocke[i]);
      while (kut > 180) kut -= 360; while (kut < -180) kut += 360;
      const isto = m.M[preth] >= 0 && m.M[preth] === m.M[sad];
      if (Math.abs(kut) < (isto ? 45 : 25)) continue;
      const u = { na: kum[i], kut: Math.round(kut), vrsta: m.vrste[m.C[sad]], ime: m.M[sad] >= 0 ? m.imena[m.M[sad]] : null, markirano: !!(m.F[sad] & 4), x: tocke[i][0], y: tocke[i][1] };
      /* dvije upute unutar 25 m: ostaje zadnja, kut se zbraja (npr. lijevo pa odmah desno) */
      const zad = out[out.length - 1];
      if (zad && u.na - zad.na < 25) { u.kut = Math.round(zad.kut + u.kut); out.pop(); if (Math.abs(u.kut) < 25) continue; }
      out.push(u);
    }
    out.push({ na: kum[kum.length - 1], kut: 0, cilj: true, x: tocke[tocke.length - 1][0], y: tocke[tocke.length - 1][1] });
    return out;
  }
  /* položaj na putu: najbliža točka na liniji, udaljenost od nje i koliko je prijeđeno */
  function naPutu(put, lon, lat) {
    const kx = Math.cos(lat * RAD) * 111320, ky = 110540, T = put.tocke;
    let best = { d: Infinity, s: 0 };
    for (let k = 0; k < T.length - 1; k++) {
      const ax = (T[k][0] - lon) * kx, ay = (T[k][1] - lat) * ky, bx = (T[k + 1][0] - lon) * kx, by = (T[k + 1][1] - lat) * ky;
      const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy;
      let t = l2 ? -(ax * dx + ay * dy) / l2 : 0; t = Math.max(0, Math.min(1, t));
      const px = ax + t * dx, py = ay + t * dy, d = Math.sqrt(px * px + py * py);
      if (d < best.d) best = { d, s: put.kum[k] + t * (put.kum[k + 1] - put.kum[k]) };
    }
    return best;
  }
  g.Put = { ucitaj, nadi, naPutu, hav, BRZINA };
  if (typeof module !== "undefined") module.exports = g.Put;
})(typeof window !== "undefined" ? window : globalThis);
