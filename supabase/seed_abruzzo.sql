-- Inserimento dei 5 itinerari classici Abruzzo nel database.
-- Prerequisito: migration_regioni.sql e migration_origine.sql gia' eseguite.
-- Sicuro da rieseguire: cancella prima gli stessi slug.

delete from public.itinerari where slug in ('campo-imperatore-rocca-calascio', 'passo-delle-capannelle', 'gole-del-sagittario-scanno', 'passo-lanciano-blockhaus', 'altopiano-delle-rocche');

with ins as (
  insert into public.itinerari
    (slug, titolo, sottotitolo, descrizione, zona, km, durata_ore, difficolta, periodo_ideale, is_premium, tracciato, gpx_url, regioni, origine)
  values
  ('campo-imperatore-rocca-calascio','Campo Imperatore e Rocca Calascio','Il Piccolo Tibet e il castello tra le nuvole','Il grande classico abruzzese: dalla piana si sale a Santo Stefano di Sessanio e Calascio, con la deviazione a Rocca Calascio (tra i castelli piu'' alti d''Italia, set di Ladyhawke e Il nome della rosa), poi su all''altopiano di Campo Imperatore, il Piccolo Tibet ai piedi del Gran Sasso. Curve infinite e panorami immensi. Quota alta: meteo variabile, controlla le previsioni.','Gran Sasso (AQ)',100,4,'medio','Maggio-Ottobre',false,
   '[[42.3461,13.6431],[42.3439,13.7008],[42.4417,13.5594]]'::jsonb, null, array['abruzzo'], 'classico')
  returning id, slug
)
insert into public.tappe (itinerario_id, ordine, nome, tipo, lat, lng, note)
select ins.id, t.ordine, t.nome, t.tipo, t.lat, t.lng, t.note
from ins join (values
  ('campo-imperatore-rocca-calascio',1,'Santo Stefano di Sessanio','partenza',42.3461,13.6431,'Borgo medievale in pietra'),
  ('campo-imperatore-rocca-calascio',2,'Rocca Calascio','panorama',42.3439,13.7008,'Il castello a 1460 m'),
  ('campo-imperatore-rocca-calascio',3,'Campo Imperatore','arrivo',42.4417,13.5594,'Il Piccolo Tibet sotto il Gran Sasso')
) as t(slug,ordine,nome,tipo,lat,lng,note) on t.slug = ins.slug;

with ins as (
  insert into public.itinerari
    (slug, titolo, sottotitolo, descrizione, zona, km, durata_ore, difficolta, periodo_ideale, is_premium, tracciato, gpx_url, regioni, origine)
  values
  ('passo-delle-capannelle','Passo delle Capannelle','La SS80 tra Gran Sasso e Laga','La SS80 del Gran Sasso d''Italia collega L''Aquila a Montorio al Vomano valicando il Passo delle Capannelle, tra i boschi che separano il massiccio del Gran Sasso dai Monti della Laga. Curve scorrevoli, traffico modesto, fresco anche d''estate. Da abbinare al Lago di Campotosto, specchio d''acqua a quota 1300.','Gran Sasso-Laga (AQ-TE)',75,3,'medio','Maggio-Ottobre',false,
   '[[42.3498,13.3995],[42.45,13.4667],[42.5333,13.3667],[42.5814,13.6286]]'::jsonb, null, array['abruzzo'], 'classico')
  returning id, slug
)
insert into public.tappe (itinerario_id, ordine, nome, tipo, lat, lng, note)
select ins.id, t.ordine, t.nome, t.tipo, t.lat, t.lng, t.note
from ins join (values
  ('passo-delle-capannelle',1,'L''Aquila','partenza',42.3498,13.3995,null),
  ('passo-delle-capannelle',2,'Passo delle Capannelle','panorama',42.45,13.4667,'Valico a 1299 m'),
  ('passo-delle-capannelle',3,'Lago di Campotosto','sosta',42.5333,13.3667,'Il grande lago d''alta quota'),
  ('passo-delle-capannelle',4,'Montorio al Vomano','arrivo',42.5814,13.6286,null)
) as t(slug,ordine,nome,tipo,lat,lng,note) on t.slug = ins.slug;

with ins as (
  insert into public.itinerari
    (slug, titolo, sottotitolo, descrizione, zona, km, durata_ore, difficolta, periodo_ideale, is_premium, tracciato, gpx_url, regioni, origine)
  values
  ('gole-del-sagittario-scanno','Gole del Sagittario e Scanno','Tornanti nella gola fino al lago a cuore','Una delle strade piu'' belle d''Abruzzo: da Anversa degli Abruzzi la SR479 si infila nelle Gole del Sagittario, riserva naturale di pareti a strapiombo e tornanti scavati nella roccia, fino al Lago di Scanno, celebre per la forma a cuore, e al borgo di Scanno. Tecnica e spettacolare, tra le preferite dei motociclisti del centro.','Valle del Sagittario (AQ)',60,3,'impegnativo','Aprile-Ottobre',false,
   '[[41.955,13.805],[41.955,13.805],[41.9039,13.8772],[41.9039,13.8772]]'::jsonb, null, array['abruzzo'], 'classico')
  returning id, slug
)
insert into public.tappe (itinerario_id, ordine, nome, tipo, lat, lng, note)
select ins.id, t.ordine, t.nome, t.tipo, t.lat, t.lng, t.note
from ins join (values
  ('gole-del-sagittario-scanno',1,'Anversa degli Abruzzi','partenza',41.955,13.805,'Ingresso delle gole'),
  ('gole-del-sagittario-scanno',2,'Gole del Sagittario','panorama',41.955,13.805,'Tornanti nella riserva'),
  ('gole-del-sagittario-scanno',3,'Lago di Scanno','sosta',41.9039,13.8772,'Il lago a forma di cuore'),
  ('gole-del-sagittario-scanno',4,'Scanno','arrivo',41.9039,13.8772,'Il borgo storico')
) as t(slug,ordine,nome,tipo,lat,lng,note) on t.slug = ins.slug;

with ins as (
  insert into public.itinerari
    (slug, titolo, sottotitolo, descrizione, zona, km, durata_ore, difficolta, periodo_ideale, is_premium, tracciato, gpx_url, regioni, origine)
  values
  ('passo-lanciano-blockhaus','Passo Lanciano e Blockhaus','La salita-icona sul massiccio della Majella','La salita al Blockhaus e'' un mito del ciclismo e una meraviglia in moto: dalla Majelletta si sale per Passo Lanciano (1310 m) fino ai 2100 m del Blockhaus, dentro il Parco Nazionale della Majella. Tornanti continui, panorami che si aprono sull''Adriatico nelle giornate limpide. Da chiudere con le terme e l''eremo di Caramanico.','Majella (PE-CH)',70,3,'impegnativo','Giugno-Settembre',false,
   '[[42.157,14.003],[42.21,14.105],[42.17,14.133]]'::jsonb, null, array['abruzzo'], 'classico')
  returning id, slug
)
insert into public.tappe (itinerario_id, ordine, nome, tipo, lat, lng, note)
select ins.id, t.ordine, t.nome, t.tipo, t.lat, t.lng, t.note
from ins join (values
  ('passo-lanciano-blockhaus',1,'Caramanico Terme','partenza',42.157,14.003,'Borgo termale del parco'),
  ('passo-lanciano-blockhaus',2,'Passo Lanciano','panorama',42.21,14.105,'Valico a 1310 m'),
  ('passo-lanciano-blockhaus',3,'Blockhaus','arrivo',42.17,14.133,'Vetta panoramica a 2100 m')
) as t(slug,ordine,nome,tipo,lat,lng,note) on t.slug = ins.slug;

with ins as (
  insert into public.itinerari
    (slug, titolo, sottotitolo, descrizione, zona, km, durata_ore, difficolta, periodo_ideale, is_premium, tracciato, gpx_url, regioni, origine)
  values
  ('altopiano-delle-rocche','Altopiano delle Rocche','Pascoli d''alta quota tra Ovindoli e Rocca di Mezzo','L''Altopiano delle Rocche e'' un balcone a 1400 m tra i Monti Velino e Sirente: strade larghe e panoramiche tra Ovindoli, Rocca di Mezzo e Rovere, pascoli, faggete e l''aria di montagna. Salita dal Valico di Forca Caruso. Guida rilassata e fresca, ideale d''estate quando in pianura si soffoca.','Sirente-Velino (AQ)',65,3,'medio','Maggio-Ottobre',false,
   '[[42.095,13.69],[42.138,13.517],[42.203,13.518]]'::jsonb, null, array['abruzzo'], 'classico')
  returning id, slug
)
insert into public.tappe (itinerario_id, ordine, nome, tipo, lat, lng, note)
select ins.id, t.ordine, t.nome, t.tipo, t.lat, t.lng, t.note
from ins join (values
  ('altopiano-delle-rocche',1,'Forca Caruso','partenza',42.095,13.69,'Valico di accesso all''altopiano'),
  ('altopiano-delle-rocche',2,'Ovindoli','sosta',42.138,13.517,'Stazione di montagna'),
  ('altopiano-delle-rocche',3,'Rocca di Mezzo','arrivo',42.203,13.518,'Cuore dell''altopiano')
) as t(slug,ordine,nome,tipo,lat,lng,note) on t.slug = ins.slug;
