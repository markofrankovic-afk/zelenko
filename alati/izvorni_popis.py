# Popis točaka i ruta za fazu 1 (Gorski kotar).
# Pokretanje: python3 alati/izvorni_popis.py  -> data/tocke.json, data/rute.json
#
# Koordinate dolaze iz Wikidate (CC0) kad je točka vezana na stavku (qid).
#   veza "tocno"   = stavka je baš taj objekt
#   veza "okvirno" = stavka je naselje/područje uz točku (koordinata je za orijentaciju)
#   bez qid        = moja procjena, mora se provjeriti (OSM ili teren)
# Tekstovi (naziv, opis) su vlastiti, pod ključem jezika ("hr") radi prijevoda.

import json, os

OVDJE = os.path.dirname(os.path.abspath(__file__))
WD = json.load(open(os.path.join(OVDJE, "..", "izvori", "wd_detalji.json"), encoding="utf-8"))

KAT = {
    "voda": "Vode",
    "planina": "Planine i vidikovci",
    "zasticeno": "Zaštićena područja",
    "staza": "Pješačke i planinarske staze",
    "bicikl": "Biciklističke rute",
    "bastina": "Povijest i baština",
    "spilja": "Špilje",
}

# (id, kategorija, podvrsta, naziv, opis, qid, veza, lat, lon, napomena)
# lat/lon se koriste samo kad nema qid-a.
T = [
# ---------------- VODE ----------------
("V01","voda","izvor","Izvor Kupe","Krški izvor Kupe u NP Risnjak: duboko zeleno-plavo jezerce ispod stijena, odakle Kupa kreće prema Sloveniji. Vrijede pravila nacionalnog parka.","Q113126597","tocno",0,0,"Stavka za rijeku: Q211046 (Kupa)."),
("V02","voda","rijeka","Kupa kod Hrvatskog","Gornji tok Kupe uz granicu sa Slovenijom: bistra, hladna voda i mirni dijelovi za šetnju uz obalu.","Q3141754","okvirno",0,0,""),
("V03","voda","rijeka","Kupa u Kuželju","Selo u kanjonu Kupe. Ljeti mjesta za osvježenje; ribolov samo uz dozvolu.","Q2722774","okvirno",0,0,""),
("V04","voda","rijeka","Kupa u Brodu na Kupi","Kupa uz samo mjesto, s kamenitim obalama i plićacima.","Q924149","okvirno",0,0,""),
("V05","voda","rijeka","Ušće Kupice u Kupu","Kod Broda na Kupi Kupica se ulijeva u Kupu. Kratka šetnja od središta mjesta.","Q104888243","tocno",0,0,""),
("V06","voda","rijeka","Kupa u Severinu na Kupi","Pristup Kupi kod Severina, u donjem i toplijem dijelu goranskog toka.","Q2635993","okvirno",0,0,"Točan pristup rijeci odrediti na terenu."),
("V07","voda","jezero","Jezero Bajer","Umjetno jezero uz samo središte Fužina. Šetnica oko jezera, čamci i ribolov.","Q12627523","tocno",0,0,""),
("V08","voda","jezero","Jezero Lepenica","Umjetno jezero iznad Fužina, mirnije od Bajera; obale za šetnju i ribolov.",None,"",45.3180,14.6800,""),
("V09","voda","jezero","Jezero Potkoš","Malo umjetno jezero istočno od Fužina.","Q12640216","tocno",0,0,""),
("V10","voda","jezero","Lokvarsko jezero","Veliko umjetno jezero uz Lokve, okruženo jelovim i smrekovim šumama. Ribolov i šetnja obalom.","Q3825969","tocno",0,0,""),
("V11","voda","slap","Slap Zeleni vir","Slap koji se kod Skrada ruši preko ulaza u špilju; jedan od najpoznatijih prizora Gorskog kotara.","Q12645682","tocno",0,0,"Stavka je zaštićeno područje Zeleni vir."),
("V12","voda","rijeka","Čabranka u Čabru","Rijeka koja teče kroz Čabar, a nizvodno čini granicu sa Slovenijom do utoka u Kupu.","Q337394","okvirno",0,0,"Stavka za rijeku: Q337411 (Čabranka)."),
("V13","voda","izvor","Izvor Čabranke","Krško vrelo Čabranke kod sela Tropeti, sjeverozapadno od Čabra. Odavde kreće poučna staza Tropetarska stijena.",None,"",45.60411,14.64138,"Koordinata izvora iz OSM-a (n8548606710)."),
# ---------------- PLANINE I VIDIKOVCI ----------------
("P01","planina","vrh","Veliki Risnjak (1528 m)","Vrh po kojem je park dobio ime. Po vedrom danu pogled seže od Kvarnera do Alpa.","Q134373316","tocno",0,0,""),
("P02","planina","dom","Schlosserov dom","Planinarski dom ispod vrha Risnjaka, na glavnom pristupu iz Crnog Luga.",None,"",45.4270,14.6190,"Nema u Wikidati; procjena prema vrhu. Dane otvorenosti provjeriti svake sezone."),
("P03","planina","vrh","Snježnik (1506 m)","Kameniti vrh iznad Platka s pogledom na Kvarner i Risnjak.","Q16513599","tocno",0,0,""),
("P04","planina","izletiste","Platak","Skijalište i polazište za Snježnik, na zapadnom rubu Gorskog kotara.","Q3391795","tocno",45.425907,14.565669,"Administrativno Čavle; ostaje kao rubna točka."),
("P05","planina","vrh","Bjelolasica – Kula (1534 m)","Najviši vrh Gorskog kotara: travnati greben s pogledom na Veliku Kapelu i more.","Q89549880","tocno",0,0,"Masiv: Q879408 (Bjelolasica)."),
("P06","planina","vidikovac","Begovo Razdolje","Najviše naselje u Hrvatskoj, na oko 1060 m. Polazište za Bjelolasicu.","Q3511509","tocno",0,0,""),
("P07","planina","stijene","Bijele stijene","Vapnenački tornjevi i kameni labirinti u strogom rezervatu. Kretanje samo po markiranim stazama.","Q859868","okvirno",0,0,"Stavka je cijeli rezervat Bijele i Samarske stijene."),
("P08","planina","stijene","Samarske stijene","Divlje stijene i škrape uz Bijele stijene; zahtjevan teren za iskusne.","Q118368515","okvirno",0,0,"Wikidata ima grubu koordinatu."),
("P09","planina","vrh","Viševica (1428 m)","Južni bedem Gorskog kotara s pogledom na Vinodol i Kvarner.","Q7938071","tocno",0,0,""),
("P10","planina","vrh","Bitoraj (1385 m)","Vrh između Fužina i Mrkopalja, s planinarskim domom na pristupu.","Q4918920","tocno",0,0,""),
("P11","planina","vrh","Tuhobić (1109 m)","Pristupačan šumoviti vrh između Gornjeg Jelenja i Fužina s pogledom prema Rijeci i Kvarneru. Kontrolna točka Hrvatske planinarske obilaznice.","Q7851699","tocno",0,0,""),
("P12","planina","vidikovac","Petehovac","Vidikovac s tornjem i dom iznad Delnica; pogled na Risnjak i goranske šume.",None,"",45.4050,14.7870,"Nema u Wikidati; provjeriti."),
("P13","planina","vrh","Skradski vrh","Vrh iznad Skrada s pogledom na dolinu Kupe.","Q25301357","tocno",0,0,""),
("P14","planina","polje","Ličko polje","Krško polje kod Liča: ljeti livade, povremeno pod vodom.","","",45.2805,14.7420,"točka je približna (sredina livada istočno od Liča), provjeriti na terenu."),
("P16","planina","izletiste","Čelimbaša (Mrkopalj)","Skijalište i livade iznad Mrkopalja.",None,"",45.3150,14.8620,"Nema u Wikidati; provjeriti."),
("P17","planina","vrh","Sjeverni Mali Risnjak (1434 m)","Sjeverni vrh masiva Risnjaka, unutar nacionalnog parka.","Q25291486","tocno",0,0,""),
("P18","planina","vrh","Veliki Drgomalj (1154 m)","Šumoviti vrh sjeverno od Delnica, prema dolini Kupe.","Q25286984","tocno",0,0,""),
("P19","planina","vrh","Velika Javornica","Vrh Velike Kapele južno od Bijelih stijena.","Q25286967","tocno",0,0,""),
("P20","planina","vrh","Veliki Smolnik","Vrh u šumama južno od Mrkopalja.","Q25287007","tocno",0,0,""),
("P21","planina","vrh","Veliki Tomac","Vrh u šumama između Lokava i Crnog Luga.","Q25288709","tocno",0,0,""),
("P22","planina","vrh","Maj vrh","Vrh uz Matić poljanu kod Mrkopalja.","Q25291460","tocno",0,0,""),
("P23","planina","vrh","Runolist","Vrh u skupini Bitoraja i Viševice.","Q26224626","tocno",0,0,""),
("P24","planina","vrh","Mali Bitoraj","Niži susjed Bitoraja.","Q26224627","tocno",0,0,""),
("P25","planina","vrh","Veliki Kozarac","Vrh između Ravne Gore i Vrbovskog.","Q25286995","tocno",0,0,""),
("P26","planina","vrh","Kanculova glavica","Vrh na južnom rubu Gorskog kotara, južno od Liča.","Q25295320","tocno",0,0,""),
("P27","planina","izletiste","Matić poljana (1030 m)","Visoravan s livadama između Mrkopalja i Begova Razdolja.","Q12636510","tocno",0,0,""),
("P28","planina","vrh","Velika Bucala","Vrh u masivu Bjelolasice.","Q25301355","tocno",0,0,""),
("P29","planina","vrh","Vukova kosa","Vrh u šumama južno od Mrkopalja.","Q25287108","tocno",0,0,""),
# ---------------- ZAŠTIĆENA PODRUČJA ----------------
("Z01","zasticeno","np","NP Risnjak – ulaz Crni Lug","Glavni ulaz i uprava parka: informacije, ulaznice i početak poučne staze Leska.","Q3003074","okvirno",0,0,"Koordinata sela Crni Lug; park: Q631183."),
("Z02","zasticeno","park-suma","Park-šuma Golubinjak","Šuma s velikim stijenama, izletištem i kratkim stazama uz Lokve.","Q16116840","tocno",0,0,""),
("Z03","zasticeno","krajobraz","Vražji prolaz","Uski kanjon potoka s mostićima i stazom; ljeti ugodno svježe. Nastavlja se na Zeleni vir.","Q128556186","okvirno",0,0,"Stavka je Natura 2000 područje."),
("Z04","zasticeno","krajobraz","Kanjon Kamačnik","Kratki kanjon bistrog potoka kod Vrbovskog s uređenom stazom uz vodu, prikladan za obitelji.","Q12634190","tocno",0,0,""),
("Z05","zasticeno","park-suma","Japlenški vrh","Brdo uz Delnice sa skijalištem i šumskim stazama.",None,"",45.3950,14.8200,"Nema u Wikidati; provjeriti položaj i status park-šume."),
("Z06","zasticeno","stablo","Kraljica šume","Istaknuto staro stablo u šumi Golubinjaka kod Lokava.","Q131929765","tocno",0,0,""),
# ---------------- STAZE ----------------
("S01","staza","poucna","Poučna staza Leska","Kružna poučna staza od oko 4 km kroz šumu NP Risnjak, za sve uzraste. Kreće s ulaza u park.","Q3003074","okvirno",45.41624,14.66842,"Koordinata sela Crni Lug."),
("S02","staza","pjesacka","Staza do izvora Kupe","Šumska staza od zaseoka Razloge do izvora Kupe.","Q3421377","okvirno",45.48314,14.70164,"Provjeriti polazište i parking."),
("S03","staza","setnica","Šetnica oko Bajera","Ravna šetnica oko jezera Bajer kroz Fužine, lagana za sve.","Q12627523","okvirno",45.30935,14.71547,""),
("S04","staza","pjesacka","Delnice – Petehovac","Šumska staza iz Delnica do vidikovca Petehovac.","Q397508","okvirno",0,0,"Koordinata grada Delnica."),
("S05","staza","planinarska","Gornje Jelenje – Tuhobić","Najkraći uspon na Tuhobić, od Gornjeg Jelenja (Lepenice): oko 3,7 km i 1 h 15 – 1 h 30 hoda.","Q5586712","okvirno",45.35912,14.63034,"Točno polazište i parking snimiti na terenu."),
("S06","staza","planinarska","Benkovac Fužinski – Tuhobić","Uspon na Tuhobić s fužinske strane: oko 5 km i 1 h 30 – 1 h 45 hoda. Iz Liča preko Benkovca oko 3 h 15.","Q2896315","okvirno",0,0,"Wikidata ima grubu koordinatu sela."),
("S07","staza","planinarska","Zlobin – Jelenčić – Tuhobić","Duži uspon iz Zlobina preko vrha Jelenčić: oko 7 km i 2 h 15 – 2 h 30 hoda.","Q3511348","okvirno",0,0,"Zlobin je administrativno Bakar; rubno polazište."),
("S08","staza","planinarska","Prilaz Bijelim stijenama s mrkopaljske strane","Iz Mrkopalja šumskom cestom prema Jasenku. S ceste vode markirani prilazi: do Ratkova skloništa oko 30 min, do Bijelih stijena najkraćim odvojkom oko 45 min. Od prosinca do travnja ili svibnja cesta je zbog snijega neprohodna.","Q4533015","okvirno",0,0,"Koordinata sela Tuk Mrkopaljski; odvojke sa šumske ceste snimiti na terenu."),
("S09","staza","planinarska","Jasenak – Bijele stijene","Klasičan uspon iz Jasenka do Bijelih stijena, oko 2 h 30 – 3 h hoda.","Q2156997","tocno",0,0,"Jasenak je administrativno Ogulin; rubno polazište."),
# ---------------- BICIKL ----------------
("B01","bicikl","polaziste","Dolina Kupe – polazište Brod na Kupi","Polazište za vožnju uz Kupu po mirnim lokalnim cestama.","Q924149","okvirno",0,0,""),
("B02","bicikl","polaziste","Fužinska jezera – polazište Bajer","Polazište za kružnu vožnju između fužinskih jezera.","Q915795","okvirno",45.30707,14.71501,""),
# ---------------- ŠPILJE ----------------
("C01","spilja","spilja","Špilja Vrelo","Uređena špilja kod Fužina, uz izvor Ličanke nedaleko od jezera Lepenica; obilazak s vodičem.",None,"",45.3060,14.7120,"Nema u Wikidati; procjena u Fužinama. Termine obilaska provjeriti."),
("C02","spilja","spilja","Špilja Lokvarka","Uređena špilja kod Lokava sa sigama; jedna od poznatijih špilja u ovom dijelu Hrvatske.","Q14699654","tocno",0,0,""),
# ---------------- BAŠTINA ----------------
("H01","bastina","dvorac","Dvorac Zrinskih, Čabar","Dvorac Petra Zrinskog u Čabru, nekad središte posjeda i željezara Zrinskih.","Q105956472","tocno",0,0,"Wikidata stavka nema naziv; provjeriti da je to dvorac."),
("H02","bastina","dvorac","Kaštel Zrinskih, Brod na Kupi","Obnovljeni kaštel uz Kupu, danas s izložbenim prostorom.","Q121636817","tocno",0,0,"Sadržaj i radno vrijeme provjeriti."),
("H03","bastina","dvorac","Kaštel Severin na Kupi","Srednjovjekovni kaštel na stijeni iznad Kupe, više puta pregrađivan.","Q105953116","tocno",0,0,"Wikidata stavka (utvrda) nema naziv; provjeriti."),
("H04","bastina","sakralno","Manastir Gomirje","Pravoslavni manastir iz oko 1600., najzapadniji manastir Srpske pravoslavne crkve.","Q2226570","tocno",0,0,""),
("H05","bastina","muzej","Memorijalni muzej Ivana Gorana Kovačića, Lukovdol","Rodna kuća pjesnika Ivana Gorana Kovačića (1913.–1943.) u Lukovdolu, danas spomen-muzej Hrvatskoga povijesnog muzeja.","Q3130235","okvirno",45.42806,15.12584,"Koordinata zgrade muzeja iz OSM-a (w333577471); Wikidata stavka je selo Lukovdol."),
("H06","bastina","cesta","Lujzijana – Gornje Jelenje","Prijevoj na Lujzinskoj cesti (1803.–1811.) koja je povezala Karlovac i Rijeku; vrata Gorskog kotara s primorske strane.","Q5586712","okvirno",0,0,""),
("H07","bastina","cesta","Karolina – Vrata","Na trasi Karolinske ceste iz 18. st., prve ceste preko Gorskog kotara do mora.","Q116009101","okvirno",0,0,"Koordinata željezničkog stajališta Vrata. Potvrditi da trasa prolazi ovdje."),
("H08","bastina","tehnicka","Hidroelektrana Zeleni vir","Stara hidroelektrana kod Zelenog vira, primjer rane elektrifikacije Gorskog kotara.","Q8068728","tocno",0,0,"Wikidata ima grubu koordinatu."),
("H09","bastina","naselje","Delnice","Najveće goransko mjesto i prometno središte; polazište za Petehovac i Risnjak.","Q397508","tocno",0,0,""),
("H10","bastina","naselje","Fužine","Mjesto uz jezero Bajer, poznato po jezerima, špilji Vrelo i šetnici.","Q915795","tocno",0,0,""),
("H11","bastina","naselje","Lokve","Mjesto uz Lokvarsko jezero, ulaz u Golubinjak i špilju Lokvarku.","Q1257203","tocno",0,0,""),
("H12","bastina","naselje","Mrkopalj","Planinsko mjesto podno Bjelolasice; zimi snijeg, ljeti livade.","Q1027260","tocno",0,0,""),
("H13","bastina","naselje","Ravna Gora","Mjesto na visoravni između Delnica i Vrbovskog.","Q1277458","tocno",0,0,""),
("H14","bastina","naselje","Vrbovsko","Najistočnije veće goransko mjesto, na Lujzijani; blizu Kamačnika.","Q396637","tocno",0,0,""),
("H15","bastina","naselje","Skrad","Mjesto iznad doline Kupe, polazište za Zeleni vir i Vražji prolaz.","Q1184846","tocno",0,0,""),
("H16","bastina","naselje","Brod Moravice","Mjesto na sjeveroistoku Gorskog kotara, iznad doline Kupe.","Q924110","tocno",0,0,""),
("H17","bastina","naselje","Čabar","Najsjevernije goransko mjesto, uz Čabranku i granicu sa Slovenijom.","Q337394","tocno",0,0,""),
("H18","bastina","naselje","Gerovo","Selo u Gerovskom polju, u čabarskom kraju.","Q3104288","tocno",0,0,""),
("H19","bastina","naselje","Prezid","Pogranično selo na sjeverozapadu, na prijelazu prema Sloveniji.","Q3402815","tocno",0,0,""),
("H20","bastina","naselje","Tršće","Selo u čabarskom kraju.","Q3444072","tocno",0,0,""),
("H21","bastina","naselje","Crni Lug","Selo uz glavni ulaz u NP Risnjak.","Q3003074","tocno",0,0,""),
("H22","bastina","naselje","Lič","Selo uz Ličko polje, jugoistočno od Fužina.","Q3257410","tocno",0,0,""),
("H23","bastina","naselje","Tuk Mrkopaljski","Selo između Mrkopalja i Begova Razdolja.","Q4533015","tocno",0,0,""),
("H24","bastina","naselje","Stari Laz","Selo u općini Ravna Gora.","Q4451366","tocno",0,0,""),
("H25","bastina","naselje","Moravice","Selo i željeznička postaja kod Vrbovskog.","Q387519","tocno",0,0,""),
("H26","bastina","naselje","Kupjak","Selo uz prugu između Delnica i Ravne Gore.","Q4363440","tocno",0,0,""),
("H27","bastina","naselje","Zalesina","Selo i željeznička postaja kod Delnica.","Q3574688","tocno",0,0,""),
("H28","bastina","naselje","Razloge","Zaselak uz Kupu, polazište prema izvoru Kupe.","Q3421377","tocno",0,0,""),
("H29","bastina","sakralno","Crkva sv. Marije Magdalene, Brod na Kupi","Župna crkva u središtu Broda na Kupi, uz kaštel Zrinskih.","Q97217633","tocno",0,0,""),
("H30","bastina","sakralno","Crkva sv. Antuna Padovanskog, Čabar","Crkva u središtu Čabra, nedaleko od dvorca Zrinskih.","Q138496349","tocno",0,0,""),
("H31","bastina","sakralno","Crkva Presvetog Trojstva, Plešce","Seoska crkva u čabarskom kraju, iznad Kupe.","Q138496540","tocno",0,0,""),
("H32","bastina","sakralno","Crkva Naše ljubezne Gospoje, Zamost","Crkva u Zamostu, uz gornji tok Kupe.","Q138496676","tocno",0,0,"Puni naziv: Crkva Naše ljubezne Gospoje od Presvetog Srca."),
("H33","bastina","sakralno","Crkva sv. Florijana, Hrvatsko","Crkva u selu Hrvatsko, uz granicu na Kupi.","Q138500641","tocno",0,0,""),
("H34","bastina","sakralno","Crkva sv. Križa, Turke","Crkva u Turkama, u dolini gornje Kupe.","Q138500708","tocno",0,0,""),
("H35","bastina","sakralno","Crkva sv. Ivana Glavosjeka, Kuželj","Crkva u Kuželju, uz biciklističku turu dolinom Kupe.","Q138501174","tocno",0,0,""),
("H36","bastina","sakralno","Crkva sv. Florijana, Severin na Kupi","Crkva u Severinu, ispod kaštela.","Q138501331","tocno",0,0,""),
("H37","bastina","sakralno","Crkva sv. Ilije, Damalj","Crkva u Damlju kod Severina na Kupi.","Q138501357","tocno",0,0,""),
("H38","bastina","sakralno","Crkva Navještenja Marijina, Zdihovo","Crkva u Zdihovu, u donjem goranskom toku Kupe.","Q138501373","tocno",0,0,""),
("H39","bastina","sakralno","Kapela Majke Božje Lurdske, Gašparci","Kapela u Gašparcima, u dolini Kupe.","Q138500764","tocno",0,0,""),
("H40","bastina","sakralno","Kapela Sv. Trojstva, Čedanj","Kapela u Čednju, iznad doline Kupe.","Q138501232","tocno",0,0,""),
("H41","bastina","sakralno","Kapela sv. Lucije, Goršeti","Kapela u Goršetima kod Brod Moravica.","Q138501277","tocno",0,0,""),
("H42","bastina","sakralno","Kapelica Majke Božje Lurdske, Čabar","Kapelica na rubu Čabra.","Q138496303","tocno",0,0,""),
("H43","bastina","spomen","Spomenik 26 smrznutih partizana","Spomenik na Matić poljani posvećen partizanima koji su se ondje smrznuli u Drugom svjetskom ratu.","Q15649591","tocno",0,0,""),
("H44","bastina","sport","Skijaške skakaonice Delnice","Skakaonice na rubu Delnica, dio goranske zimske tradicije.","Q1184550","tocno",0,0,"Provjeriti stanje i koriste li se."),
("H45","bastina","muzej","Goranska kuća znanja, Razloge","Interpretacijski centar NP Risnjak u staroj seoskoj školi u Razlogama, na putu prema izvoru Kupe.",None,"",45.48325,14.70154,""),
("H46","bastina","muzej","Rodna kuća rijeke Kupe","Centar za posjetitelje NP Risnjak u Kuparima, nadomak izvora Kupe: kako rijeka nastaje i život uz nju.",None,"",45.49621,14.69806,""),
("H47","bastina","povijesno","Kula Turanj, Brod Moravice","Stara kamena kula u Brod Moravicama, jedno od obilježja mjesta.",None,"",45.4637,14.97171,""),
("H48","bastina","povijesno","Fajeri – kameni stupovi","Niz kamenih stupova između Brestove Drage i Slavice, ostatak napuštenog mosta.",None,"",45.33397,14.77718,""),
("H49","bastina","sakralno","Svetište Majke Božje Snježne, Lič","Kapela i svetište na Ličkom polju kod Liča.",None,"",45.27371,14.75182,""),
("H50","bastina","muzej","Zavičajna zbirka Mrkopalj","Zbirka na prvom katu doma kulture u središtu Mrkopalja: stare fotografije, alati, nošnje, ručno rađene skije i krplje te dokumenti iz povijesti mjesta. Obilazak s vodičem.",None,"",45.31545,14.85571,"Položaj: središte Mrkopalja (OSM); točnu zgradu provjeriti."),
("H51","bastina","muzej","Kolarnica, Brod Moravice","Nekadašnja kolarska radionica, danas izložba starih zanata: kolarstvo, stolarstvo, postolarstvo, krojenje i brijačnica. Na tavanu je digitalna arhiva baštine Brod Moravica.",None,"",45.46361,14.97114,"Položaj: središte Brod Moravica (OSM); točnu zgradu provjeriti."),
("H52","bastina","muzej","Palčeva šiša, Plešce","Kuća obitelji Čop iz 1856., zaštićeni spomenik kulture: stara trgovina, gostionica, ured, salon i etnografska zbirka. Pokazuje život imućne kuće u dolini Čabranke.",None,"",45.5467,14.68664,"Položaj: središte Plešca (OSM); točnu zgradu provjeriti."),
("H53","bastina","muzej","Etnografska zbirka Lič","Zbirka starih predmeta iz Liča i okolice, osnovana 1994. za 150. obljetnicu školstva u Liču. Zaštićeno kulturno dobro.",None,"",45.27903,14.71915,"Položaj: središte Liča (OSM); točnu zgradu provjeriti."),
# ---------------- IZLETIŠTA I ZABAVA ----------------
("E01","izlet","zanimljivost","Kaubojsko selo Roswell","Tematsko kaubojsko selo kod Fužina, zabava za obitelji s djecom.",None,"",45.34284,14.71134,""),
("E02","izlet","zanimljivost","Zabavni i paintball park Vrata","Zabavni park s paintballom kod Vrata.",None,"",45.31256,14.73238,""),
("E03","izlet","zanimljivost","Izletište Šumska bajka, Lič","Obiteljsko izletište u šumi kod Liča, prikladno za djecu.",None,"",45.29323,14.70443,""),
("E04","izlet","zanimljivost","Kuća prirode Kotač na Lujzijani","Edukativni centar o prirodi uz Lujzinsku cestu, s kafićem.",None,"",45.35685,14.74572,""),
("H54","bastina","muzej","Hiša Rački, Delnice","Stara goranska kuća u Supilovoj ulici, procjenjuje se da ima oko 300 godina. Čuva delničku narodnu nošnju; svakog lipnja ovdje se održavaju Ivanjske kresnice.",None,"",45.39765,14.80229,"Supilova 94: kućni broj nije u OSM-u, položaj procijenjen po susjednim brojevima (82–88)."),
("H55","bastina","tehnicka","Popovićev mlin, Delnice","Mlin iz 1924. s očuvanim strojevima: kameni i valjčani mlin, sita, elevatori i kožno remenje. Prvi je u Delnicama radio na struju iz hidroelektrane Zeleni vir. Posjet uz najavu.",None,"",45.39681,14.80153,"Adresa Supilova 76 (OSM)."),
("H56","bastina","muzej","Kuća Delač, Delači","Najstarija kuća zaštićenog zaseoka Delači kod Brod Moravica, iz 1644. Obnovljena je i uređena starim predmetima iz kraja.",None,"",45.47163,14.95862,"Položaj: zaselak Delači (OSM); kuću provjeriti."),
("H57","bastina","muzej","Hrvatska čitaonica sela Kuti","Seoska čitaonica u Gornjim Kutima kod Brod Moravica. Od 1936. vode je mještani volonteri; ima više od 9000 knjiga.",None,"",45.4718,14.97591,"Položaj: selo Gornji Kuti (OSM); zgradu provjeriti."),
("E05","izlet","zanimljivost","Adrenalinski park Kupjak","Gorski park na oko 800 m: vidikovac, šumska staza za šetnju i bicikl, adrenalinski sadržaji i roštilj.",None,"",45.39311,14.88399,"Adresa Kupjak 72 nije u OSM-u; točka je u selu Kupjak, provjeriti."),
("E06","izlet","zanimljivost","Adrenalinski park Gorski Lazi, Tršće","Adrenalinski park u zaseoku Lazi kod Tršća.",None,"",45.56906,14.63647,"Park je oko 300 m od kuće Lazi 15 (OSM); točan položaj provjeriti."),
("E07","izlet","zanimljivost","Quad Gorski kotar","Vožnja quadom po goranskim šumskim cestama i selima, ture od 1 i 2 sata.",None,"",45.41244,14.91388,"Adresa Šubetov Most 2, Skrad; točka je zaselak Šubetov Most (OSM), provjeriti polazište."),
("S11","staza","poucna","Poučna staza Tropetarska stijena","Kružna planinska poučna staza od izvora Čabranke do vrha Tropetarske stijene, oko 4,5 km na dvije razine. Više od 70 vrsta drveća, bukove i jelove šume i rijedak bor. Namijenjena je ponajprije najavljenim grupama.",None,"",45.60411,14.64138,"Polazište: izvor Čabranke (OSM)."),
("S12","staza","poucna","Poučna staza Plodovi gorja, Ravna Gora","Staza od 1,5 km na Suhom vrhu kod Ravne Gore, s pločama o drveću, grmlju, gljivama, ljekovitom bilju i šumskim plodovima.",None,"",45.37076,14.94078,"Polazište kod hotela Breza (OSM), oko 700 m od središta Ravne Gore; provjeriti."),
("S10","staza","poucna","Staza predatora, Tršće","Kružna poučna staza od oko 1,7 km (oko 1 h hoda) s modelima vuka, risa, medvjeda, jelena, srne, lisice, divlje svinje i tetrijeba u prirodnoj veličini, uz ploče o svakoj životinji.",None,"",45.5664,14.62981,"Položaj: selo Tršće (OSM); polazište staze provjeriti."),
]

def pouzdanost(wd, veza):
    if not wd:
        return "N"
    p = wd.get("preciznost") or 1
    if veza == "okvirno" or p >= 0.1:
        return "S" if p < 0.1 else "N"
    return "V" if p <= 0.002 else "S"

RUCNO = {"V01": "S"}  # izvor Kupe: položaj se poklapa s izvorom, ali Wikidata navodi grubu preciznost

# točke kod kojih Wikidata pokazuje nešto drugo (npr. selo umjesto polja): vrijedi naša koordinata
KOORD_RUCNO = {"P14", "S03", "S01", "S02", "S05", "B02", "P04", "H05"}  # P04: Goranski sportski centar (OSM), gdje turisti dolaze

# koordinate iz OSM-a (ODbL): objekt je u OSM-u, ali ga OSM izvadak ne donosi kao točku ili mu treba naš naziv i opis
KOORD_OSM = {"H05": "w333577471", "H45": "w379649181", "H46": "w685050686", "H47": "w433260934", "H48": "r6304141",
             "H49": "w433249369", "E01": "w1534944649", "E02": "w436526341", "E03": "n13022902160", "E04": "n12085008012",
             "H55": "n12196525173", "V13": "n8548606710"}
# približne koordinate: (pouzdanost, odakle je točka) – objekt je u tom mjestu ili na toj adresi, točan položaj provjeriti
KOORD_PRIBLIZNO = {
    "H50": ("S", "OpenStreetMap – središte mjesta Mrkopalj"), "H51": ("S", "OpenStreetMap – središte mjesta Brod Moravice"),
    "H52": ("S", "OpenStreetMap – središte mjesta Plešce"), "H53": ("S", "OpenStreetMap – središte mjesta Lič"),
    "S10": ("N", "OpenStreetMap – selo Tršće"), "H54": ("S", "procjena po kućnim brojevima u OSM-u (Supilova 94)"),
    "H56": ("S", "OpenStreetMap – zaselak Delači"), "H57": ("S", "OpenStreetMap – selo Gornji Kuti"),
    "E05": ("N", "OpenStreetMap – selo Kupjak"), "E06": ("N", "OpenStreetMap – kuća Lazi 15, park je oko 300 m dalje"),
    "E07": ("N", "OpenStreetMap – zaselak Šubetov Most"), "S11": ("S", "OpenStreetMap – izvor Čabranke"),
    "S12": ("N", "OpenStreetMap – Bistro Breza, Ravna Gora (je li to hotel Breza, provjeriti)"),
}

# kamo „Vodi me” vodi kad je točka usred vode: brana jezera iz OSM-a (ODbL), gdje se dolazi do obale
DOLAZAK = {"V07": (45.30615, 14.71413, "brana", "w78475094"), "V08": (45.31916, 14.70355, "brana", "w273487053"),
           "V09": (45.30274, 14.73292, "brana", "w274266663"), "V10": (45.36075, 14.72035, "brana", "w273499146")}

def tocka(r):
    (id_, kat, pod, naziv, opis, qid, veza, lat, lon, nap) = r
    wd = WD.get(qid) if qid else None
    if qid and not wd:
        raise SystemExit(f"{id_}: nema detalja za {qid}")
    return {
        "id": id_, "kategorija": kat, "podvrsta": pod,
        "tekst": {"hr": {"naziv": naziv, "opis": opis}},
        "lat": lat if id_ in KOORD_RUCNO else wd["lat"] if wd else lat, "lon": lon if id_ in KOORD_RUCNO else wd["lon"] if wd else lon,
        "pouzdanost": "V" if id_ in KOORD_OSM else KOORD_PRIBLIZNO[id_][0] if id_ in KOORD_PRIBLIZNO else RUCNO.get(id_) or pouzdanost(wd, veza),
        "izvor": {
            "koordinate": "OpenStreetMap" if id_ in KOORD_OSM else KOORD_PRIBLIZNO[id_][1] if id_ in KOORD_PRIBLIZNO else "Wikidata" if wd and id_ not in KOORD_RUCNO else "Wikidata" if wd else "procjena – provjeriti",
            "osm": KOORD_OSM.get(id_),
            "wikidata": qid, "veza": veza or None,
            "wikidata_naziv": (wd.get("hr") or wd.get("en")) if wd else None,
            "hr_wikipedija": wd.get("hrwiki") if wd else None,
            "slika_commons": wd.get("slika") if wd else None,
            "opis": "vlastiti tekst",
        },
        "licenca": ("koordinate: ODbL – © OpenStreetMap suradnici" if id_ in KOORD_OSM or id_ in KOORD_PRIBLIZNO else "koordinate: CC0 (Wikidata)" if wd else "koordinate: naša procjena") + "; opis: naš tekst",
        "napomena": nap,
        "status": "za odobrenje",
        **({"dolazak": {"lat": DOLAZAK[id_][0], "lon": DOLAZAK[id_][1], "naziv": DOLAZAK[id_][2], "osm": DOLAZAK[id_][3]}} if id_ in DOLAZAK else {}),
    }

# ---------------- RUTE ----------------
# km, trajanje i uspon su procjena; konačno iz GPX trase.
R = [
 dict(id="R01", vrsta="pjesacka", naziv="Fužine u pola dana", tezina="lagano", km=8, sati="3–4", uspon_m=150, besplatno=True,
      tocke=["H10","S03","V07","C01","V08"], parking="Fužine, uz Bajer",
      opis="Šetnica oko Bajera, obilazak špilje Vrelo i nastavak do jezera Lepenica. Idealno s djecom.",
      trasa="OSM putovi i ceste (ODbL) ili vlastiti GPX"),
 dict(id="R02", vrsta="pjesacka", naziv="Lokve: Lokvarka i Golubinjak", tezina="lagano", km=8, sati="3", uspon_m=120, besplatno=True,
      tocke=["H11","C02","Z02","Z06"], parking="Lokve, središte",
      opis="Špilja Lokvarka, stijene Golubinjaka i stablo Kraljica šume, s povratkom u Lokve.",
      trasa="OSM putovi i ceste (ODbL) ili vlastiti GPX"),
 dict(id="R03", vrsta="pjesacka", naziv="Zeleni vir i Vražji prolaz", tezina="srednje", km=6, sati="2–3", uspon_m=250, besplatno=True,
      tocke=["H15","V11","Z03"], parking="Zeleni vir, ispod Skrada",
      opis="Kružna tura iz Skrada: slap Zeleni vir i kanjon Vražji prolaz s mostićima. Strmi dijelovi, za mokrog vremena sklisko.",
      trasa="OSM putovi (ODbL) ili vlastiti GPX"),
 dict(id="R04", vrsta="pjesacka", naziv="Izvor Kupe", tezina="lagano", km=3, sati="1–1,5", uspon_m=100, besplatno=False,
      tocke=["H28","S02","V01"], parking="Razloge",
      opis="Kratka šetnja od Razloga do izvora Kupe i natrag.",
      trasa="staza NP Risnjak – službeni opis od parka; trasa iz OSM-a (ODbL)"),
 dict(id="R05", vrsta="planinarska", naziv="Risnjak iz Crnog Luga", tezina="zahtjevno", km=16, sati="6–7", uspon_m=850, besplatno=False,
      tocke=["H21","Z01","S01","P02","P01"], parking="Crni Lug, ulaz u NP",
      opis="Klasičan uspon iz Crnog Luga preko Schlosserova doma na Veliki Risnjak i povratak istim putem.",
      trasa="markirana HPS staza – trasa iz OSM-a (ODbL); službeni opis i oznake uz pisanu dozvolu HPS-a"),
 dict(id="R06", vrsta="planinarska", naziv="Snježnik s Platka", tezina="srednje", km=6, sati="2,5–3", uspon_m=400, besplatno=False,
      tocke=["P04","P03"], parking="Platak",
      opis="Najkraći put na kameni vrh Snježnika s pogledom na Kvarner.",
      trasa="markirana staza – trasa iz OSM-a (ODbL); HPS dozvola za službeni opis"),
 dict(id="R07", vrsta="planinarska", naziv="Bjelolasica iz Begova Razdolja", tezina="zahtjevno", km=14, sati="6–7", uspon_m=550, besplatno=False,
      tocke=["P06","P28","P05"], parking="Begovo Razdolje",
      opis="Uspon iz najvišeg sela u Hrvatskoj na Kulu, najviši vrh Gorskog kotara.",
      trasa="markirana staza – trasa iz OSM-a (ODbL); HPS dozvola za službeni opis"),
 dict(id="R08", vrsta="planinarska", naziv="Bijele stijene sa šumske ceste", tezina="zahtjevno", km=6, sati="3–4", uspon_m=350, besplatno=False,
      tocke=["H12","S08","P07"], parking="uz šumsku cestu Mrkopalj – Jasenak (samo bez snijega)",
      opis="Najkraći prilaz kamenim labirintima Bijelih stijena u strogom rezervatu; kretanje samo po markacijama.",
      polazista=[["Šumska cesta Mrkopalj – Jasenak, najkraći odvojak","oko 45 min do Bijelih stijena"],
                 ["Šumska cesta, odvojak za Ratkovo sklonište i Samarske stijene","oko 30 min do skloništa"],
                 ["Jasenak","2 h 30 – 3 h"],
                 ["Vrelo (Bjelolasica)","oko 4 h"]],
      trasa="trasa iz OSM-a (ODbL) ili vlastiti GPX; odvojke snimiti na terenu; HPS dozvola za službeni opis"),
 dict(id="R09", vrsta="biciklisticka", naziv="Dolina Kupe: Brod na Kupi – Gašparci", tezina="lagano", km=22, sati="1,5–2,5", uspon_m=150, besplatno=False,
      tocke=["B01","H02","H29","V05","H35","V03","H39"], parking="Brod na Kupi",
      opis="Asfaltom uzvodno uz Kupu do mosta u Gašparcima i natrag, uz pauze za kupanje. Za djecu kraće do Kuželja (oko 10 km), za jače dalje do Čabra (oko 60 km).",
      polazista=[["Brod na Kupi – Kuželj i natrag","oko 10 km"],["Brod na Kupi – Gašparci i natrag","oko 22 km"],["Brod na Kupi – Čabar i natrag","oko 60 km"]],
      trasa="vlastita trasa po cestama iz OSM-a (ODbL); kod Kuželja se gradi obilaznica (2025.–2027.), moguća regulacija prometa"),
 dict(id="R10", vrsta="biciklisticka", naziv="Jezera: Fužine – Lokve", tezina="srednje", km=35, sati="3–4", uspon_m=600, besplatno=False,
      tocke=["B02","V07","V09","V08","H11","V10"], parking="Fužine, uz Bajer",
      opis="Kružna vožnja od Bajera, Potkoša i Lepenice do Lokvarskog jezera i natrag.",
      trasa="vlastita trasa po cestama iz OSM-a (ODbL)"),
]

def ruta(r):
    return {
        "id": r["id"], "vrsta": r["vrsta"],
        "tekst": {"hr": {"naziv": r["naziv"], "opis": r["opis"], "parking": r["parking"]}},
        "tezina": r["tezina"], "km": r["km"], "sati": r["sati"], "uspon_m": r["uspon_m"],
        "tocke": r["tocke"], "besplatno": r["besplatno"],
        "polazista": [{"naziv": a, "vrijeme": b} for a, b in r.get("polazista", [])],
        "izvor_trase": r["trasa"],
        "napomena": "km, trajanje i uspon su procjena; konačno iz GPX trase",
        "gpx": None, "status": "za odobrenje",
    }

if __name__ == "__main__":
    base = os.path.join(OVDJE, "..", "data")
    os.makedirs(base, exist_ok=True)
    tocke = [tocka(r) for r in T]
    rute = [ruta(r) for r in R]
    json.dump({"kategorije": KAT, "tocke": tocke}, open(os.path.join(base, "tocke.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    json.dump({"rute": rute}, open(os.path.join(base, "rute.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(len(tocke), "točaka,", len(rute), "ruta")
