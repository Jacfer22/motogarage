import { Accesso, Difficolta, Itinerario } from './types';

const PESO_DIFF: Record<Difficolta, number> = {
  facile: 0,
  medio: 1,
  impegnativo: 2,
};

// Ordina gli itinerari di una regione dal più accessibile al più impegnativo:
// prima per difficoltà, a parità per chilometri. Il primo della lista è il giro
// "aperto a tutti", il secondo è "sblocca registrandoti", gli altri sono Pro.
export function ordinaPerAccessibilita(itinerari: Itinerario[]): Itinerario[] {
  return [...itinerari].sort((a, b) => {
    const d = PESO_DIFF[a.difficolta] - PESO_DIFF[b.difficolta];
    if (d !== 0) return d;
    return a.km - b.km;
  });
}

// Mappa ogni itinerario di UNA regione al suo livello di accesso.
// Modello attuale (Pro non ancora attivo): il giro più accessibile di ogni
// regione è "aperto" a tutti, tutti gli altri si sbloccano con la
// registrazione gratuita. Nessun giro reale è bloccato dietro il Pro.
export function livelliAccessoRegione(
  itinerariRegione: Itinerario[]
): Map<string, Accesso> {
  const ordinati = ordinaPerAccessibilita(itinerariRegione);
  const mappa = new Map<string, Accesso>();
  ordinati.forEach((it, i) => {
    if (it.is_placeholder) {
      mappa.set(it.id, 'pro');
      return;
    }
    const livello: Accesso = i === 0 ? 'aperto' : 'registrati';
    mappa.set(it.id, livello);
  });
  return mappa;
}

// Accesso di un singolo itinerario considerando TUTTE le regioni che tocca:
// vince il livello più permissivo (se è "aperto" in almeno una regione, è
// aperto). Serve nella pagina di dettaglio, dove non c'è una regione di
// contesto. `tuttiItinerari` è l'elenco completo da cui ricavare le regioni.
export function accessoItinerario(
  itinerario: Itinerario,
  tuttiItinerari: Itinerario[]
): Accesso {
  const ordine: Accesso[] = ['aperto', 'registrati', 'pro'];
  let migliore: Accesso = 'pro';

  for (const regione of itinerario.regioni ?? []) {
    const dellaRegione = tuttiItinerari.filter((i) =>
      (i.regioni ?? []).includes(regione)
    );
    const livello = livelliAccessoRegione(dellaRegione).get(itinerario.id);
    if (livello && ordine.indexOf(livello) < ordine.indexOf(migliore)) {
      migliore = livello;
    }
  }
  return migliore;
}
