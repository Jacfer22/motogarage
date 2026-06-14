export type Difficolta = 'facile' | 'medio' | 'impegnativo';

// Livello di accesso a un itinerario, calcolato in base alla posizione nella
// sua regione: il più accessibile è aperto a tutti, il secondo si sblocca
// registrandosi gratis, gli altri sono Pro.
export type Accesso = 'aperto' | 'registrati' | 'pro';

export type TipoTappa = 'partenza' | 'panorama' | 'cibo' | 'benzina' | 'sosta' | 'arrivo';

export interface Tappa {
  id: string;
  itinerario_id: string;
  ordine: number;
  nome: string;
  tipo: TipoTappa;
  lat: number;
  lng: number;
  note: string | null;
}

export interface ProExtra {
  variante: string;
  weekend: string;
}

// Aggiornamenti sullo stato della strada: chiusure, lavori, info utili, consigli stagionali.
export type TipoAvviso = 'chiuso' | 'lavori' | 'info' | 'consiglio';

export interface Avviso {
  id: string;
  itinerario_id: string;
  tipo: TipoAvviso;
  titolo: string;
  descrizione: string;
  // Data dell'ultimo aggiornamento, formato YYYY-MM-DD
  data: string;
  // Fonte verificabile (comune, ente, articolo). Obbligatoria:
  // nessun avviso va pubblicato senza una fonte controllabile.
  fonte: string;
}

export interface Itinerario {
  id: string;
  slug: string;
  titolo: string;
  sottotitolo: string;
  descrizione: string;
  zona: string;
  // Una o più regioni: un giro che scavalla il confine appare in entrambe.
  regioni: string[];
  km: number;
  durata_ore: number;
  difficolta: Difficolta;
  periodo_ideale: string;
  // 'verificato' = percorso provato in sella con tappe GPS;
  // 'classico' = strada-icona della regione, dati da fonti pubbliche,
  // tracciato di dettaglio ancora da rifinire.
  origine: 'verificato' | 'classico';
  gpx_url: string | null;
  is_premium: boolean;
  cover_url: string | null;
  // Sequenza di punti che disegna il percorso reale su strada (più densa delle tappe)
  tracciato: [number, number][];
  // Contenuti extra per gli itinerari Pro
  pro_extra?: ProExtra | null;
  tappe?: Tappa[];
  avvisi?: Avviso[];
  // Nome ufficiale della strada percorsa (solo se verificato). Null = da verificare.
  strada?: string | null;
  strada_fonte?: string | null;
}

export type StatoArticolo = 'in_revisione' | 'pubblicato' | 'rifiutato';

export interface Articolo {
  id: string;
  autore_id: string;
  titolo: string;
  contenuto: string;
  stato: StatoArticolo;
  created_at: string;
  pubblicato_at: string | null;
  // Presente quando l'articolo viene letto con il join su profiles
  autore?: { username: string | null } | null;
}
