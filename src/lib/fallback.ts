import { Avviso, Itinerario, Tappa } from './types';

// Dati di fallback: usati se Supabase non è ancora configurato.
// Gli stessi dati sono in supabase/seed.sql.
//
// `tracciato` = sequenza di punti che segue l'andamento reale delle strade
// (più densa delle tappe). Sono coordinate stimate sulla viabilità nota,
// non tracce GPS: per il GPX definitivo registra il giro o disegnalo su
// Kurviger/Calimoto ed esporta.

function tappe(
  itinerario_id: string,
  rows: [number, string, Tappa['tipo'], number, number, string | null][]
): Tappa[] {
  return rows.map(([ordine, nome, tipo, lat, lng, note]) => ({
    id: `${itinerario_id}-${ordine}`,
    itinerario_id,
    ordine,
    nome,
    tipo,
    lat,
    lng,
    note,
  }));
}

export const ITINERARI_FALLBACK: Itinerario[] = [
  {
    id: 'tolfa',
    slug: 'monti-della-tolfa',
    titolo: 'Monti della Tolfa',
    sottotitolo: 'Dal mare alle colline, il classico dei romani',
    descrizione:
      'Il giro che ogni motociclista romano fa almeno una volta al mese. Si parte dal mare di Civitavecchia e si sale verso Allumiere e Tolfa su strade larghe, pulite e piene di curve in appoggio. Panorami aperti sulla campagna, butteri a cavallo se sei fortunato, e discesa finale verso il lago di Bracciano. Perfetto la domenica mattina: partenza presto, pranzo a Tolfa, a casa per le 15.',
    zona: 'Roma Nord-Ovest',
    regioni: ['lazio'],
    origine: 'verificato',
    km: 120,
    durata_ore: 4,
    difficolta: 'facile',
    periodo_ideale: 'Tutto l’anno',
    gpx_url: '/gpx/monti-della-tolfa.gpx',
    is_premium: false,
    cover_url: null,
    strada: 'SP3A Braccianese Claudia',
    strada_fonte: 'Comuni di Civitavecchia/Allumiere/Tolfa/Bracciano, indicazioni stradali ufficiali',
    tracciato: [
      [42.094, 11.793],
      [42.103, 11.825],
      [42.121, 11.851],
      [42.140, 11.878],
      [42.156, 11.902],
      [42.149, 11.934],
      [42.135, 11.985],
      [42.118, 12.045],
      [42.108, 12.110],
      [42.103, 12.176],
    ],
    tappe: tappe('tolfa', [
      [1, 'Civitavecchia', 'partenza', 42.094, 11.793, 'Pieno consigliato prima di salire'],
      [2, 'Allumiere', 'panorama', 42.156, 11.902, 'Belvedere sulla valle del Mignone'],
      [3, 'Tolfa', 'cibo', 42.149, 11.934, 'Pranzo in centro: cucina di campagna, porzioni vere'],
      [4, 'Bracciano', 'arrivo', 42.103, 12.176, 'Caffè con vista lago sotto il castello'],
    ]),
  },
  {
    id: 'licinese',
    slug: 'via-licinese',
    titolo: 'Via Licinese',
    sottotitolo: 'Il santuario dei motociclisti romani',
    descrizione:
      'La SP Licinese è la strada di casa per chi gira a est di Roma: asfalto buono, curve da manuale, traffico quasi zero nei giorni feriali. Si parte da Tivoli, si sale a San Polo dei Cavalieri e si prosegue verso Licenza nella valle dell’Aniene. Giro corto, intenso, perfetto anche per un’uscita pomeridiana dopo il lavoro.',
    zona: 'Valle dell’Aniene',
    regioni: ['lazio'],
    origine: 'verificato',
    km: 90,
    durata_ore: 3,
    difficolta: 'medio',
    periodo_ideale: 'Marzo–Novembre',
    gpx_url: '/gpx/via-licinese.gpx',
    is_premium: false,
    cover_url: null,
    tracciato: [
      [41.963, 12.798],
      [41.978, 12.812],
      [41.995, 12.825],
      [42.011, 12.840],
      [42.035, 12.862],
      [42.055, 12.882],
      [42.074, 12.900],
    ],
    tappe: tappe('licinese', [
      [1, 'Tivoli', 'partenza', 41.963, 12.798, null],
      [2, 'San Polo dei Cavalieri', 'panorama', 42.011, 12.84, 'Vista su Roma nelle giornate limpide'],
      [3, 'Licenza', 'sosta', 42.074, 12.9, 'Borgo tranquillo, bar in piazza'],
    ]),
  },
  {
    id: 'carsoli',
    slug: 'tivoli-carsoli-montebove',
    titolo: 'Tivoli–Carsoli–Colli di Montebove',
    sottotitolo: 'Poche auto, pieghe libere',
    descrizione:
      'Prima metà Tivoli–Carsoli: misto veloce di rettilinei e curve. Seconda metà fino a Colli di Montebove: strada stretta tra i boschi, traffico quasi assente, il posto giusto per lavorare sulla guida. Lungo il percorso trattorie economiche con cucina locale vera. Circa 80 km tra salite e discese al confine con l’Abruzzo.',
    zona: 'Confine Lazio–Abruzzo',
    regioni: ['lazio', 'abruzzo'],
    origine: 'verificato',
    km: 80,
    durata_ore: 3,
    difficolta: 'medio',
    periodo_ideale: 'Aprile–Ottobre',
    gpx_url: '/gpx/tivoli-carsoli-montebove.gpx',
    is_premium: true,
    cover_url: null,
    tracciato: [
      [41.963, 12.798],
      [41.985, 12.860],
      [42.020, 12.940],
      [42.060, 13.010],
      [42.099, 13.088],
      [42.085, 13.108],
      [42.078, 13.130],
    ],
    pro_extra: {
      variante:
        'Versione corta: salta Colli di Montebove e torna da Carsoli verso Tagliacozzo per la SS5 — togli circa 25 km ma perdi i boschi più stretti.',
      weekend:
        'Pranzo a Carsoli, pernotto in agriturismo verso Arsoli (camera+colazione sui 50-60€), domenica mattina rientro lento via Subiaco.',
    },
    tappe: tappe('carsoli', [
      [1, 'Tivoli', 'partenza', 41.963, 12.798, null],
      [2, 'Carsoli', 'cibo', 42.099, 13.088, 'Trattorie con cucina abruzzese, prezzi onesti'],
      [3, 'Colli di Montebove', 'arrivo', 42.078, 13.13, 'Tra i borghi più belli della zona'],
    ]),
  },
  {
    id: 'castelli',
    slug: 'castelli-romani',
    titolo: 'Castelli Romani',
    sottotitolo: 'Curve, laghi e fraschette',
    descrizione:
      'Il giro perfetto per chi inizia o per le mezze giornate: 140 km che si fanno in meno di 4 ore, ma con i Castelli la sosta è d’obbligo. Frascati, Castel Gandolfo affacciata sul lago Albano, Nemi col suo lago piccolo e le fragoline, i boschi di Rocca di Papa. Chiusura classica a Marino per un quarto di vino. Strade panoramiche, mai noiose, vivibili anche d’inverno.',
    zona: 'Castelli Romani',
    regioni: ['lazio'],
    origine: 'verificato',
    km: 140,
    durata_ore: 4,
    difficolta: 'facile',
    periodo_ideale: 'Tutto l’anno',
    gpx_url: '/gpx/castelli-romani.gpx',
    is_premium: false,
    cover_url: null,
    tracciato: [
      [41.806, 12.681],
      [41.790, 12.668],
      [41.762, 12.655],
      [41.747, 12.650],
      [41.733, 12.687],
      [41.721, 12.717],
      [41.740, 12.715],
      [41.761, 12.709],
      [41.766, 12.683],
      [41.769, 12.659],
    ],
    tappe: tappe('castelli', [
      [1, 'Frascati', 'partenza', 41.806, 12.681, null],
      [2, 'Castel Gandolfo', 'panorama', 41.747, 12.65, 'Belvedere sul lago Albano'],
      [3, 'Nemi', 'cibo', 41.721, 12.717, 'Fragoline e tortini, vista lago'],
      [4, 'Rocca di Papa', 'panorama', 41.761, 12.709, 'Campi di Annibale e Monte Cavo'],
      [5, 'Marino', 'arrivo', 41.769, 12.659, 'Fraschetta finale (con moderazione)'],
    ]),
  },
  {
    id: 'turano',
    slug: 'laghi-turano-e-salto',
    titolo: 'Laghi del Turano e del Salto',
    sottotitolo: 'I tornanti più fotogenici del reatino',
    descrizione:
      'Tornanti panoramici che salgono da San Gregorio da Sassola e San Polo dei Cavalieri verso l’Appennino, poi Orvinio — uno dei borghi più belli d’Italia — e la discesa verso Colle di Tora e Castel di Tora, affacciati sul lago del Turano. Acqua turchese, borghi di pietra, curve infinite. Il giro da fare quando vuoi le foto migliori.',
    zona: 'Reatino',
    regioni: ['lazio'],
    origine: 'verificato',
    km: 160,
    durata_ore: 5,
    difficolta: 'medio',
    periodo_ideale: 'Aprile–Ottobre',
    gpx_url: '/gpx/laghi-turano-e-salto.gpx',
    is_premium: true,
    cover_url: null,
    tracciato: [
      [41.917, 12.873],
      [41.965, 12.890],
      [42.020, 12.905],
      [42.075, 12.920],
      [42.131, 12.937],
      [42.175, 12.943],
      [42.211, 12.948],
      [42.221, 12.962],
    ],
    pro_extra: {
      variante:
        'Aggiungi Rocca Sinibalda e il borgo di Roccaranieri per altri 20 km di tornanti sul versante nord del lago.',
      weekend:
        'Pernotto a Castel di Tora con vista lago (B&B sui 60-70€), colazione la mattina dopo seduti sull’acqua, rientro via Licinese per chiudere il giro a "8".',
    },
    tappe: tappe('turano', [
      [1, 'San Gregorio da Sassola', 'partenza', 41.917, 12.873, null],
      [2, 'Orvinio', 'panorama', 42.131, 12.937, 'Borgo tra i più belli d’Italia'],
      [3, 'Colle di Tora', 'panorama', 42.211, 12.948, 'Vista sul lago del Turano'],
      [4, 'Castel di Tora', 'cibo', 42.221, 12.962, 'Pranzo affacciati sull’acqua'],
    ]),
  },
  {
    id: 'tuscia',
    slug: 'tuscia-e-civita',
    titolo: 'Tuscia e Civita di Bagnoregio',
    sottotitolo: 'La città che muore, le strade che vivono',
    descrizione:
      '160 km da Orte alla panoramica Montefiascone, dal lago di Bolsena fino a Civita di Bagnoregio, la “città che muore” sospesa sui calanchi. Strade della Tuscia: larghe, ondulate, con il vulcano di Bolsena sempre all’orizzonte. Tappa obbligata per anguilla e vino Est! Est!! Est!!! a Montefiascone.',
    zona: 'Tuscia (VT)',
    regioni: ['lazio'],
    origine: 'verificato',
    km: 160,
    durata_ore: 5,
    difficolta: 'facile',
    periodo_ideale: 'Marzo–Novembre',
    gpx_url: '/gpx/tuscia-e-civita.gpx',
    is_premium: false,
    cover_url: null,
    tracciato: [
      [42.460, 12.386],
      [42.485, 12.330],
      [42.510, 12.230],
      [42.530, 12.120],
      [42.539, 12.030],
      [42.595, 12.005],
      [42.644, 11.986],
      [42.635, 12.050],
      [42.628, 12.114],
    ],
    tappe: tappe('tuscia', [
      [1, 'Orte', 'partenza', 42.46, 12.386, null],
      [2, 'Montefiascone', 'cibo', 42.539, 12.03, 'Est! Est!! Est!!! e vista sul lago'],
      [3, 'Bolsena', 'sosta', 42.644, 11.986, 'Lungolago, gelato'],
      [4, 'Civita di Bagnoregio', 'arrivo', 42.628, 12.114, 'Parcheggio moto comodo prima del ponte'],
    ]),
  },
  {
    id: 'bracciano',
    slug: 'anello-lago-di-bracciano',
    titolo: 'Anello del Lago di Bracciano',
    sottotitolo: 'Il giro invernale per eccellenza',
    descrizione:
      '140 km di strade collinari, panoramiche e divertenti attorno al bacino di Bracciano, con clima mite anche in inverno. Bracciano col castello Odescalchi, Trevignano per il lungolago, Anguillara per il tramonto. Quando a gennaio tutti tengono la moto in garage, questo è il giro che ti salva la domenica.',
    zona: 'Lago di Bracciano',
    regioni: ['lazio'],
    origine: 'verificato',
    km: 140,
    durata_ore: 4,
    difficolta: 'facile',
    periodo_ideale: 'Tutto l’anno (top in inverno)',
    gpx_url: '/gpx/anello-lago-di-bracciano.gpx',
    is_premium: false,
    cover_url: null,
    tracciato: [
      [42.103, 12.176],
      [42.130, 12.205],
      [42.156, 12.244],
      [42.130, 12.270],
      [42.092, 12.283],
    ],
    tappe: tappe('bracciano', [
      [1, 'Bracciano', 'partenza', 42.103, 12.176, 'Castello Odescalchi'],
      [2, 'Trevignano Romano', 'cibo', 42.156, 12.244, 'Lungolago con ristoranti di pesce di lago'],
      [3, 'Anguillara Sabazia', 'arrivo', 42.092, 12.283, 'Tramonto dal borgo vecchio'],
    ]),
  },
  {
    id: 'simbruini',
    slug: 'monti-simbruini',
    titolo: 'Monti Simbruini',
    sottotitolo: 'Strade pennellate apposta per le moto',
    descrizione:
      'Catena di montagne al confine con l’Abruzzo, con strade che sembrano disegnate per chi guida: salita da Subiaco a Monte Livata tra i faggi, poi Trevi nel Lazio e Filettino, il comune più alto del Lazio. Aria di montagna a un’ora da Roma, curve tecniche, panorami da Alpi. D’estate è il rifugio dal caldo della città.',
    zona: 'Alta Valle dell’Aniene',
    regioni: ['lazio'],
    origine: 'verificato',
    km: 150,
    durata_ore: 5,
    difficolta: 'impegnativo',
    periodo_ideale: 'Maggio–Ottobre',
    gpx_url: '/gpx/monti-simbruini.gpx',
    is_premium: true,
    cover_url: null,
    tracciato: [
      [41.925, 13.095],
      [41.935, 13.125],
      [41.945, 13.155],
      [41.910, 13.200],
      [41.862, 13.249],
      [41.875, 13.290],
      [41.890, 13.323],
    ],
    pro_extra: {
      variante:
        'Versione estesa: da Filettino prosegui verso Vallepietra per il Santuario della SS. Trinità — altri 30 km di tornanti incastrati nella roccia, poco traffico anche d’estate.',
      weekend:
        'Pernotto a Filettino, in autunno cena a base di funghi porcini. Parti presto la domenica: dopo le 10 la statale si riempie di ciclisti.',
    },
    tappe: tappe('simbruini', [
      [1, 'Subiaco', 'partenza', 41.925, 13.095, 'Monastero di San Benedetto a 10 min'],
      [2, 'Monte Livata', 'panorama', 41.945, 13.155, 'Salita tra i faggi, occhio al brecciolino a inizio stagione'],
      [3, 'Trevi nel Lazio', 'sosta', 41.862, 13.249, null],
      [4, 'Filettino', 'arrivo', 41.89, 13.323, 'Il comune più alto del Lazio'],
    ]),
  },
  {
    id: 'ciociaria',
    slug: 'ciociaria-dei-borghi',
    titolo: 'Ciociaria dei borghi',
    sottotitolo: 'Acropoli, papi e cucina vera',
    descrizione:
      'Da Veroli ad Alatri con la sua acropoli preromana dalle mura ciclopiche, poi Anagni la città dei papi, Segni e le sue chiese, fino a Sermoneta, borgo medievale tra i più belli d’Italia. Strade secondarie tranquille, borghi dove il tempo si è fermato e la cucina ciociara che da sola vale il viaggio.',
    zona: 'Ciociaria (FR)',
    regioni: ['lazio'],
    origine: 'verificato',
    km: 130,
    durata_ore: 5,
    difficolta: 'facile',
    periodo_ideale: 'Tutto l’anno',
    gpx_url: '/gpx/ciociaria-dei-borghi.gpx',
    is_premium: false,
    cover_url: null,
    tracciato: [
      [41.692, 13.418],
      [41.710, 13.380],
      [41.726, 13.342],
      [41.735, 13.280],
      [41.744, 13.154],
      [41.715, 13.085],
      [41.690, 13.024],
      [41.620, 13.000],
      [41.549, 12.984],
    ],
    tappe: tappe('ciociaria', [
      [1, 'Veroli', 'partenza', 41.692, 13.418, null],
      [2, 'Alatri', 'panorama', 41.726, 13.342, 'Acropoli con mura ciclopiche'],
      [3, 'Anagni', 'cibo', 41.744, 13.154, 'La città dei papi, pranzo nel centro storico'],
      [4, 'Segni', 'sosta', 41.69, 13.024, null],
      [5, 'Sermoneta', 'arrivo', 41.549, 12.984, 'Borgo medievale, castello Caetani'],
    ]),
  },
  {
    id: 'aurunci',
    slug: 'monti-aurunci',
    titolo: 'Monti Aurunci e Sud Pontino',
    sottotitolo: 'Mozzarella di bufala e curve fino a Esperia',
    descrizione:
      'Si parte da Sezze in direzione Priverno — sosta obbligata per scorta di mozzarella di bufala — poi via verso il Parco Naturale dei Monti Aurunci passando per Castro dei Volsci ed Esperia. Curve piacevoli, natura selvaggia, zero folla. Il giro per chi vuole scoprire il Lazio che non conosce nessuno.',
    zona: 'Sud Pontino (LT)',
    regioni: ['lazio'],
    origine: 'verificato',
    km: 145,
    durata_ore: 5,
    difficolta: 'medio',
    periodo_ideale: 'Marzo–Novembre',
    gpx_url: '/gpx/monti-aurunci.gpx',
    is_premium: true,
    cover_url: null,
    tracciato: [
      [41.497, 13.062],
      [41.480, 13.120],
      [41.469, 13.180],
      [41.480, 13.290],
      [41.495, 13.402],
      [41.440, 13.540],
      [41.387, 13.685],
    ],
    pro_extra: {
      variante:
        'Deviazione su Vallecorsa per i tornanti del Monte Faggeto: più tecnici, asfalto un po\' rovinato in alcuni punti ma vista pazzesca sulla valle del Sacco.',
      weekend:
        'Pernotto a Esperia, il giorno dopo gita tranquilla al Santuario di Civita per chi vuole allungare il weekend senza fretta.',
    },
    tappe: tappe('aurunci', [
      [1, 'Sezze', 'partenza', 41.497, 13.062, null],
      [2, 'Priverno', 'cibo', 41.469, 13.18, 'Mozzarella di bufala: fai scorta'],
      [3, 'Castro dei Volsci', 'panorama', 41.495, 13.402, 'Balcone sulla valle del Sacco'],
      [4, 'Esperia', 'arrivo', 41.387, 13.685, 'Cuore del parco degli Aurunci'],
    ]),
  },
];

// Avvisi attivi: stato strade, lavori, consigli stagionali.
// In produzione vengono gestiti dal database (tabella `avvisi`),
// così possono essere aggiornati senza toccare il codice.
//
// REGOLA: nessun avviso senza una fonte verificabile (campo `fonte`).
// Quello sotto è verificato: lavori reali sulla Braccianese Claudia
// ad Allumiere, avviati il 24/02/2026, durata massima prevista 120
// giorni (quindi presumibilmente ancora in corso). Prima di lanciare
// il sito, controlla lo stato aggiornato su Luceverde Lazio e aggiorna
// o disattiva questo avviso di conseguenza.
export const AVVISI_FALLBACK: Avviso[] = [
  {
    id: 'avviso-tolfa-1',
    itinerario_id: 'tolfa',
    tipo: 'lavori',
    titolo: 'Senso unico alternato sulla Braccianese Claudia ad Allumiere',
    descrizione:
      'Lavori di messa in sicurezza al km 31+650 (frana), partiti il 24 febbraio 2026 con durata massima prevista di 120 giorni: possibile ancora attivo a giugno. Il tratto è in senso unico alternato. Verifica lo stato aggiornato su Luceverde Lazio prima di partire.',
    data: '2026-02-24',
    fonte: 'Comunicato Città Metropolitana di Roma, 23/02/2026 (lagone.it) — da riverificare su Luceverde Lazio',
  },
];
