# Zelenko – offline vodič za Gorski kotar (prototip 0.5.2)

PWA (radi i bez signala): karta, 1080 točaka, 10 ruta (3 besplatne), gdje jesti, spavati i kupiti,
Zelenkova putovnica (pečati po GPS-u), Danas (vrijeme i medin savjet), Sigurnost (SOS, povratak do auta,
„javi nekome”), Moja mjesta, sigurnosna kopija. Svijetli i tamni način. Za sada samo hrvatski.

Adresa: https://markofrankovic-afk.github.io/zelenko/

## Objava
Settings → Pages → Branch `main`, mapa `/docs` → Save. Kod svake objave povećaj `VERSION` u `docs/sw.js`.

## Gdje je što
- `docs/i18n/hr.json` – svi tekstovi sučelja (za EN/DE dodaj `en.json`, `de.json`)
- `docs/data/tocke.json`, `rute.json` – točke i rute; `docs/gpx/` – GPX tragovi ruta
- `docs/data/usluge.json` – jelo, smještaj, trgovine i OPG (OSM + `izvori/partneri.json`)
- `docs/data/putovnica.json` – mjesta za pečate i polumjer u metrima; razine
- `docs/data/slike.json` – fotografije s Wikimedia Commonsa, s autorom i licencom
- `docs/data/danas.json` – „Stanje na terenu“ i sezonski prijedlozi (uređuje se ručno, s datumom provjere)
- `docs/data/kategorije.json` – filteri na karti i boje
- `docs/data/podloga.json` – vlastita offline karta (ceste, staze, vode, naselja)
- `docs/app.js` – logika; `CONFIG` na vrhu (GoatCounter, kontakt)

## Alati (`alati/`, Python)
- `osm_izvuci.py`, `spoji_osm.py`, `osm_podloga.py`, `osm_rute.py` – točke, karta i rute iz OSM izvatka (BBBike PBF)
- `osm_usluge.py` – usluge iz OSM-a + ručni partneri iz `izvori/partneri.json`
- `commons_slike.py`, `commons_preuzmi.py` – fotografije s Commonsa (samo PD, CC0, CC BY, CC BY-SA)
- `izradi_pregled.py` – jedna HTML stranica za pregled u Claudeu

## Izvori i licence
- Karta i većina točaka: © OpenStreetMap suradnici (ODbL)
- Dio koordinata: Wikidata (CC0)
- Fotografije: Wikimedia Commons, autor i licenca uz svaku sliku
- Partneri: podatke daje vlasnik
- Prognoza: Open-Meteo (besplatno samo za nekomercijalnu upotrebu; prije Pro verzije treba plaćeni plan)
- Karta: Leaflet (BSD-2)
