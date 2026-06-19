-- MotoGarage — seed dei 10 itinerari di lancio + avvisi di esempio
-- Esegui DOPO schema.sql

with ins as (
  insert into public.itinerari
    (slug, titolo, sottotitolo, descrizione, zona, km, durata_ore, difficolta, periodo_ideale, is_premium, tracciato, variante_pro, weekend_pro, strada, strada_fonte, gpx_url, regioni)
  values
  ('monti-della-tolfa','Monti della Tolfa','Dal mare alle colline, il classico dei romani','Il giro che ogni motociclista romano fa almeno una volta al mese. Si parte dal mare di Civitavecchia e si sale verso Allumiere e Tolfa su strade larghe, pulite e piene di curve in appoggio. Panorami aperti sulla campagna, butteri a cavallo se sei fortunato, e discesa finale verso il lago di Bracciano. Perfetto la domenica mattina: partenza presto, pranzo a Tolfa, a casa per le 15.','Roma Nord-Ovest',120,4,'facile','Tutto l''anno',false,
   '[[42.094,11.793],[42.103,11.825],[42.121,11.851],[42.140,11.878],[42.156,11.902],[42.149,11.934],[42.135,11.985],[42.118,12.045],[42.108,12.110],[42.103,12.176]]'::jsonb,
   null, null, 'SP3A Braccianese Claudia', 'Comuni di Civitavecchia/Allumiere/Tolfa/Bracciano, indicazioni stradali ufficiali', '/gpx/monti-della-tolfa.gpx', array['lazio']),

  ('via-licinese','Via Licinese','Il santuario dei motociclisti romani','La SP Licinese è la strada di casa per chi gira a est di Roma: asfalto buono, curve da manuale, traffico quasi zero nei giorni feriali. Si parte da Tivoli, si sale a San Polo dei Cavalieri e si prosegue verso Licenza nella valle dell''Aniene. Giro corto, intenso, perfetto anche per un''uscita pomeridiana dopo il lavoro.','Valle dell''Aniene',90,3,'medio','Marzo–Novembre',false,
   '[[41.963,12.798],[41.978,12.812],[41.995,12.825],[42.011,12.840],[42.035,12.862],[42.055,12.882],[42.074,12.900]]'::jsonb,
   null, null, null, null, '/gpx/via-licinese.gpx', array['lazio']),

  ('tivoli-carsoli-montebove','Tivoli–Carsoli–Colli di Montebove','Poche auto, pieghe libere','Prima metà Tivoli–Carsoli: misto veloce di rettilinei e curve. Seconda metà fino a Colli di Montebove: strada stretta tra i boschi, traffico quasi assente, il posto giusto per lavorare sulla guida. Lungo il percorso trattorie economiche con cucina locale vera. Circa 80 km tra salite e discese al confine con l''Abruzzo.','Confine Lazio–Abruzzo',80,3,'medio','Aprile–Ottobre',true,
   '[[41.963,12.798],[41.985,12.860],[42.020,12.940],[42.060,13.010],[42.099,13.088],[42.085,13.108],[42.078,13.130]]'::jsonb,
   'Versione corta: salta Colli di Montebove e torna da Carsoli verso Tagliacozzo per la SS5 — togli circa 25 km ma perdi i boschi più stretti.',
   'Pranzo a Carsoli, pernotto in agriturismo verso Arsoli (camera+colazione sui 50-60€), domenica mattina rientro lento via Subiaco.',
   null, null, '/gpx/tivoli-carsoli-montebove.gpx', array['lazio','abruzzo']),

  ('castelli-romani','Castelli Romani','Curve, laghi e fraschette','Il giro perfetto per chi inizia o per le mezze giornate: 140 km che si fanno in meno di 4 ore, ma con i Castelli la sosta è d''obbligo. Frascati, Castel Gandolfo affacciata sul lago Albano, Nemi col suo lago piccolo e le fragoline, i boschi di Rocca di Papa. Chiusura classica a Marino per un quarto di vino. Strade panoramiche, mai noiose, vivibili anche d''inverno.','Castelli Romani',140,4,'facile','Tutto l''anno',false,
   '[[41.806,12.681],[41.790,12.668],[41.762,12.655],[41.747,12.650],[41.733,12.687],[41.721,12.717],[41.740,12.715],[41.761,12.709],[41.766,12.683],[41.769,12.659]]'::jsonb,
   null, null, null, null, '/gpx/castelli-romani.gpx', array['lazio']),

  ('laghi-turano-e-salto','Laghi del Turano e del Salto','I tornanti più fotogenici del reatino','Tornanti panoramici che salgono da San Gregorio da Sassola e San Polo dei Cavalieri verso l''Appennino, poi Orvinio — uno dei borghi più belli d''Italia — e la discesa verso Colle di Tora e Castel di Tora, affacciati sul lago del Turano. Acqua turchese, borghi di pietra, curve infinite. Il giro da fare quando vuoi le foto migliori.','Reatino',160,5,'medio','Aprile–Ottobre',true,
   '[[41.917,12.873],[41.965,12.890],[42.020,12.905],[42.075,12.920],[42.131,12.937],[42.175,12.943],[42.211,12.948],[42.221,12.962]]'::jsonb,
   'Aggiungi Rocca Sinibalda e il borgo di Roccaranieri per altri 20 km di tornanti sul versante nord del lago.',
   'Pernotto a Castel di Tora con vista lago (B&B sui 60-70€), colazione la mattina dopo seduti sull''acqua, rientro via Licinese per chiudere il giro a "8".',
   null, null, '/gpx/laghi-turano-e-salto.gpx', array['lazio']),

  ('tuscia-e-civita','Tuscia e Civita di Bagnoregio','La città che muore, le strade che vivono','160 km da Orte alla panoramica Montefiascone, dal lago di Bolsena fino a Civita di Bagnoregio, la "città che muore" sospesa sui calanchi. Strade della Tuscia: larghe, ondulate, con il vulcano di Bolsena sempre all''orizzonte. Tappa obbligata per anguilla e vino Est! Est!! Est!!! a Montefiascone.','Tuscia (VT)',160,5,'facile','Marzo–Novembre',false,
   '[[42.460,12.386],[42.485,12.330],[42.510,12.230],[42.530,12.120],[42.539,12.030],[42.595,12.005],[42.644,11.986],[42.635,12.050],[42.628,12.114]]'::jsonb,
   null, null, null, null, '/gpx/tuscia-e-civita.gpx', array['lazio']),

  ('anello-lago-di-bracciano','Anello del Lago di Bracciano','Il giro invernale per eccellenza','140 km di strade collinari, panoramiche e divertenti attorno al bacino di Bracciano, con clima mite anche in inverno. Bracciano col castello Odescalchi, Trevignano per il lungolago, Anguillara per il tramonto. Quando a gennaio tutti tengono la moto in garage, questo è il giro che ti salva la domenica.','Lago di Bracciano',140,4,'facile','Tutto l''anno (top in inverno)',false,
   '[[42.103,12.176],[42.130,12.205],[42.156,12.244],[42.130,12.270],[42.092,12.283]]'::jsonb,
   null, null, null, null, '/gpx/anello-lago-di-bracciano.gpx', array['lazio']),

  ('monti-simbruini','Monti Simbruini','Strade pennellate apposta per le moto','Catena di montagne al confine con l''Abruzzo, con strade che sembrano disegnate per chi guida: salita da Subiaco a Monte Livata tra i faggi, poi Trevi nel Lazio e Filettino, il comune più alto del Lazio. Aria di montagna a un''ora da Roma, curve tecniche, panorami da Alpi. D''estate è il rifugio dal caldo della città.','Alta Valle dell''Aniene',150,5,'impegnativo','Maggio–Ottobre',true,
   '[[41.925,13.095],[41.935,13.125],[41.945,13.155],[41.910,13.200],[41.862,13.249],[41.875,13.290],[41.890,13.323]]'::jsonb,
   'Versione estesa: da Filettino prosegui verso Vallepietra per il Santuario della SS. Trinità — altri 30 km di tornanti incastrati nella roccia, poco traffico anche d''estate.',
   'Pernotto a Filettino, in autunno cena a base di funghi porcini. Parti presto la domenica: dopo le 10 la statale si riempie di ciclisti.',
   null, null, '/gpx/monti-simbruini.gpx', array['lazio']),

  ('ciociaria-dei-borghi','Ciociaria dei borghi','Acropoli, papi e cucina vera','Da Veroli ad Alatri con la sua acropoli preromana dalle mura ciclopiche, poi Anagni la città dei papi, Segni e le sue chiese, fino a Sermoneta, borgo medievale tra i più belli d''Italia. Strade secondarie tranquille, borghi dove il tempo si è fermato e la cucina ciociara che da sola vale il viaggio.','Ciociaria (FR)',130,5,'facile','Tutto l''anno',false,
   '[[41.692,13.418],[41.710,13.380],[41.726,13.342],[41.735,13.280],[41.744,13.154],[41.715,13.085],[41.690,13.024],[41.620,13.000],[41.549,12.984]]'::jsonb,
   null, null, null, null, '/gpx/ciociaria-dei-borghi.gpx', array['lazio']),

  ('monti-aurunci','Monti Aurunci e Sud Pontino','Mozzarella di bufala e curve fino a Esperia','Si parte da Sezze in direzione Priverno — sosta obbligata per scorta di mozzarella di bufala — poi via verso il Parco Naturale dei Monti Aurunci passando per Castro dei Volsci ed Esperia. Curve piacevoli, natura selvaggia, zero folla. Il giro per chi vuole scoprire il Lazio che non conosce nessuno.','Sud Pontino (LT)',145,5,'medio','Marzo–Novembre',true,
   '[[41.497,13.062],[41.480,13.120],[41.469,13.180],[41.480,13.290],[41.495,13.402],[41.440,13.540],[41.387,13.685]]'::jsonb,
   'Deviazione su Vallecorsa per i tornanti del Monte Faggeto: più tecnici, asfalto un po'' rovinato in alcuni punti ma vista pazzesca sulla valle del Sacco.',
   'Pernotto a Esperia, il giorno dopo gita tranquilla al Santuario di Civita per chi vuole allungare il weekend senza fretta.',
   null, null, '/gpx/monti-aurunci.gpx', array['lazio'])

  returning id, slug
)
insert into public.tappe (itinerario_id, ordine, nome, tipo, lat, lng, note)
select ins.id, t.ordine, t.nome, t.tipo, t.lat, t.lng, t.note
from ins
join (values
  ('monti-della-tolfa',1,'Civitavecchia','partenza',42.094,11.793,'Pieno consigliato prima di salire'),
  ('monti-della-tolfa',2,'Allumiere','panorama',42.156,11.902,'Belvedere sulla valle del Mignone'),
  ('monti-della-tolfa',3,'Tolfa','cibo',42.149,11.934,'Pranzo in centro: cucina di campagna, porzioni vere'),
  ('monti-della-tolfa',4,'Bracciano','arrivo',42.103,12.176,'Caffè con vista lago sotto il castello'),
  ('via-licinese',1,'Tivoli','partenza',41.963,12.798,null),
  ('via-licinese',2,'San Polo dei Cavalieri','panorama',42.011,12.840,'Vista su Roma nelle giornate limpide'),
  ('via-licinese',3,'Licenza','sosta',42.074,12.900,'Borgo tranquillo, bar in piazza'),
  ('tivoli-carsoli-montebove',1,'Tivoli','partenza',41.963,12.798,null),
  ('tivoli-carsoli-montebove',2,'Carsoli','cibo',42.099,13.088,'Trattorie con cucina abruzzese, prezzi onesti'),
  ('tivoli-carsoli-montebove',3,'Colli di Montebove','arrivo',42.078,13.130,'Tra i borghi più belli della zona'),
  ('castelli-romani',1,'Frascati','partenza',41.806,12.681,null),
  ('castelli-romani',2,'Castel Gandolfo','panorama',41.747,12.650,'Belvedere sul lago Albano'),
  ('castelli-romani',3,'Nemi','cibo',41.721,12.717,'Fragoline e tortini, vista lago'),
  ('castelli-romani',4,'Rocca di Papa','panorama',41.761,12.709,'Campi di Annibale e Monte Cavo'),
  ('castelli-romani',5,'Marino','arrivo',41.769,12.659,'Fraschetta finale (con moderazione)'),
  ('laghi-turano-e-salto',1,'San Gregorio da Sassola','partenza',41.917,12.873,null),
  ('laghi-turano-e-salto',2,'Orvinio','panorama',42.131,12.937,'Borgo tra i più belli d''Italia'),
  ('laghi-turano-e-salto',3,'Colle di Tora','panorama',42.211,12.948,'Vista sul lago del Turano'),
  ('laghi-turano-e-salto',4,'Castel di Tora','cibo',42.221,12.962,'Pranzo affacciati sull''acqua'),
  ('tuscia-e-civita',1,'Orte','partenza',42.460,12.386,null),
  ('tuscia-e-civita',2,'Montefiascone','cibo',42.539,12.030,'Est! Est!! Est!!! e vista sul lago'),
  ('tuscia-e-civita',3,'Bolsena','sosta',42.644,11.986,'Lungolago, gelato'),
  ('tuscia-e-civita',4,'Civita di Bagnoregio','arrivo',42.628,12.114,'Parcheggio moto comodo prima del ponte'),
  ('anello-lago-di-bracciano',1,'Bracciano','partenza',42.103,12.176,'Castello Odescalchi'),
  ('anello-lago-di-bracciano',2,'Trevignano Romano','cibo',42.156,12.244,'Lungolago con ristoranti di pesce di lago'),
  ('anello-lago-di-bracciano',3,'Anguillara Sabazia','arrivo',42.092,12.283,'Tramonto dal borgo vecchio'),
  ('monti-simbruini',1,'Subiaco','partenza',41.925,13.095,'Monastero di San Benedetto a 10 min'),
  ('monti-simbruini',2,'Monte Livata','panorama',41.945,13.155,'Salita tra i faggi, occhio al brecciolino a inizio stagione'),
  ('monti-simbruini',3,'Trevi nel Lazio','sosta',41.862,13.249,null),
  ('monti-simbruini',4,'Filettino','arrivo',41.890,13.323,'Il comune più alto del Lazio'),
  ('ciociaria-dei-borghi',1,'Veroli','partenza',41.692,13.418,null),
  ('ciociaria-dei-borghi',2,'Alatri','panorama',41.726,13.342,'Acropoli con mura ciclopiche'),
  ('ciociaria-dei-borghi',3,'Anagni','cibo',41.744,13.154,'La città dei papi, pranzo nel centro storico'),
  ('ciociaria-dei-borghi',4,'Segni','sosta',41.690,13.024,null),
  ('ciociaria-dei-borghi',5,'Sermoneta','arrivo',41.549,12.984,'Borgo medievale, castello Caetani'),
  ('monti-aurunci',1,'Sezze','partenza',41.497,13.062,null),
  ('monti-aurunci',2,'Priverno','cibo',41.469,13.180,'Mozzarella di bufala: fai scorta'),
  ('monti-aurunci',3,'Castro dei Volsci','panorama',41.495,13.402,'Balcone sulla valle del Sacco'),
  ('monti-aurunci',4,'Esperia','arrivo',41.387,13.685,'Cuore del parco degli Aurunci')
) as t(slug, ordine, nome, tipo, lat, lng, note)
on t.slug = ins.slug;

-- ============ AVVISI DI ESEMPIO ============
-- In produzione: aggiungi/disattiva righe qui senza toccare il codice.
-- REGOLA: ogni avviso deve avere una `fonte` verificabile.
-- Questo è verificato: lavori reali sulla Braccianese Claudia ad Allumiere
-- (km 31+650, partiti 24/02/2026, durata massima 120 giorni). Da
-- riverificare su Luceverde Lazio prima del lancio.

insert into public.avvisi (itinerario_id, tipo, titolo, descrizione, fonte, attivo, data)
select i.id, a.tipo, a.titolo, a.descrizione, a.fonte, true, a.data::date
from public.itinerari i
join (values
  ('monti-della-tolfa','lavori','Senso unico alternato sulla Braccianese Claudia ad Allumiere','Lavori di messa in sicurezza al km 31+650 (frana), partiti il 24 febbraio 2026 con durata massima prevista di 120 giorni: possibile ancora attivo a giugno. Il tratto è in senso unico alternato. Verifica lo stato aggiornato su Luceverde Lazio prima di partire.','Comunicato Città Metropolitana di Roma, 23/02/2026 (lagone.it) — da riverificare su Luceverde Lazio','2026-02-24')
) as a(slug, tipo, titolo, descrizione, fonte, data)
on a.slug = i.slug;
