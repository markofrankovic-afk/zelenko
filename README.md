# Zelenko – offline vodič za Gorski kotar (prototip 0.10.0)

PWA (radi i bez signala). Izbornik: Karta · Danas · Gastro (specijaliteti, jelo, smještaj, OPG) · Rute · Moje.
Karta s 1083 točke, 30 ruta (10 naših, 3 besplatne; 20 biciklističkih i MTB iz OSM-a), gdje jesti, spavati i kupiti,
Zelenkova putovnica (pečati po GPS-u), Danas (vrijeme i medin savjet), Sigurnost (SOS, povratak do auta,
„javi nekome”), Moja mjesta, sigurnosna kopija. Svijetli i tamni način. Hrvatski i engleski (jezik se bira u „Moje”, inače po jeziku preglednika).

Adresa: https://markofrankovic-afk.github.io/zelenko/

## Objava
Settings → Pages → Branch `main`, mapa `/docs` → Save. Kod svake objave povećaj `VERSION` u `docs/sw.js`.

## Gdje je što
- `docs/i18n/hr.json`, `en.json` – svi tekstovi sučelja (za DE/IT kopiraj `en.json`)
- `izvori/prijevod_en.json` – engleski prijevod naših tekstova (točke, rute, specijaliteti, Lynx, informacije, Danas); u podatke ga upisuje `alati/prevedi.py`
- `docs/data/tocke.json`, `rute.json` – točke i rute; `docs/gpx/` – GPX tragovi ruta
- `docs/data/mreza.json` – mreža putova za navigaciju po karti bez interneta (gradi `alati/osm_mreza.py`); izračun puta je u `docs/put.js`
- `docs/data/rute_bicikl.json` – biciklističke i MTB rute iz OSM relacija (gradi `alati/osm_bike_rute.py`)
- `docs/data/usluge.json` – jelo, smještaj, trgovine i OPG (OSM + `izvori/partneri.json`)
- `docs/data/info.json` – radno vrijeme, ulaznice i kontakti (`izvori/info_rucno.json` sa službenih stranica + OSM), gradi `alati/info_tocke.py`
- `docs/data/specijaliteti.json` – specijaliteti Gorskog kotara za Gastro kutak (s izvorima)
- `docs/data/lynx.json` – Lynx (ris iz Risnjaka): zanimljivosti uz mjesta, s izvorima; drugi lik uz medu Zelenka
- `docs/data/putovnica.json` – mjesta za pečate i polumjer u metrima; razine
- `docs/data/slike.json` – fotografije s Wikimedia Commonsa, s autorom i licencom
- `docs/data/danas.json` – „Stanje na terenu“ i sezonski prijedlozi (uređuje se ručno, s datumom provjere)
- `docs/data/kategorije.json` – filteri na karti i boje
- `docs/data/podloga.json` – vlastita offline karta (ceste, staze, vode, naselja)
- `docs/app.js` – logika; `CONFIG` na vrhu (GoatCounter, kontakt)

## Ispravak lokacija
`docs/pribadace.html` – karta na kojoj se približne točke povuku na pravo mjesto (samo prema poznavanju terena). Rezultat (JSON) se kopira i ugrađuje u `alati/izvorni_popis.py`.

## Alati (`alati/`, Python)
- `osm_izvuci.py`, `spoji_osm.py`, `osm_podloga.py`, `osm_rute.py` – točke, karta i rute iz OSM izvatka (BBBike PBF)
- `prevedi.py` – upisuje prijevode u podatke; pokreće se zadnji
- `visine.py` – uspon, spust i visinski profil ruta iz Copernicus DEM GLO-30 (pokreće se nakon osm_rute.py i osm_bike_rute.py; DEM pločice N45E014 i N45E015 nisu u repozitoriju)
- `osm_mreza.py` – mreža cesta, šumskih cesta i staza za navigaciju (pješice i biciklom)
- `osm_bike_rute.py` – biciklističke i MTB rute iz OSM relacija: trasa, duljina, GPX, stajališta
- `ocisti_duplikate.py` – nakon spoji_osm.py: uklanja dvostruke točke (popis ručno pregledanih + pravila)
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

## Redoslijed alata
`izvorni_popis.py` → `spoji_osm.py` → `ocisti_duplikate.py` → `info_tocke.py` → `osm_rute.py` / `osm_bike_rute.py` → `visine.py` → `prevedi.py`

`docs/privatnost.html` – pravila privatnosti (HR/EN), potrebna i za Google Play.
