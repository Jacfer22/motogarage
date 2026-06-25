// Badge progressivi in base ai km totali registrati col GPS.

export interface Badge {
  id: string;
  nome: string;
  kmRichiesti: number;
  /** 0 = più semplice · 6 = massimo (cornice, strati, corona) */
  rango: number;
}

export const BADGES: Badge[] = [
  { id: 'chiave-in-mano', nome: 'Chiave in mano', kmRichiesti: 0, rango: 0 },
  { id: 'strada-aperta', nome: 'Strada aperta', kmRichiesti: 500, rango: 1 },
  { id: 'centauro-asfalto', nome: 'Centauro dell\'asfalto', kmRichiesti: 2_500, rango: 2 },
  { id: 'conquistatore-passi', nome: 'Conquistatore dei passi', kmRichiesti: 7_500, rango: 3 },
  { id: 're-delle-curve', nome: 'Re delle curve', kmRichiesti: 15_000, rango: 4 },
  { id: 'leggenda-in-sella', nome: 'Leggenda in sella', kmRichiesti: 30_000, rango: 5 },
  { id: 'divinita-bitume', nome: 'Divinità del bitume', kmRichiesti: 50_000, rango: 6 },
];

export const KM_MASSIMO_BADGE = BADGES[BADGES.length - 1].kmRichiesti;

export function badgeRaggiunto(kmTotali: number): Badge {
  let attuale = BADGES[0];
  for (const b of BADGES) {
    if (kmTotali >= b.kmRichiesti) attuale = b;
  }
  return attuale;
}

export function prossimoBadge(kmTotali: number): Badge | null {
  for (const b of BADGES) {
    if (kmTotali < b.kmRichiesti) return b;
  }
  return null;
}

export function avanzamento(kmTotali: number): number {
  const attuale = badgeRaggiunto(kmTotali);
  const prossimo = prossimoBadge(kmTotali);
  if (!prossimo) return 100;
  const base = attuale.kmRichiesti;
  const traguardo = prossimo.kmRichiesti;
  return Math.round(((kmTotali - base) / (traguardo - base)) * 100);
}
