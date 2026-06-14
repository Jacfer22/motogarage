export interface Punto {
  lat: number;
  lng: number;
  // dati opzionali dal GPS, usati per le statistiche del giro
  alt?: number | null; // altitudine in metri
  vel?: number | null; // velocità in m/s
  t?: number; // timestamp epoch ms
}

// Statistiche di un giro registrato.
export interface StatGiro {
  velMediaKmh: number;
  velMaxKmh: number;
  dislivelloPositivoM: number;
  curve: number;
}

/** Distanza in metri tra due punti GPS (formula haversine). */
export function distanzaMetri(a: Punto, b: Punto): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Somma le distanze tra punti consecutivi di un tracciato, in metri. */
export function lunghezzaTracciato(punti: Punto[]): number {
  let totale = 0;
  for (let i = 1; i < punti.length; i++) {
    totale += distanzaMetri(punti[i - 1], punti[i]);
  }
  return totale;
}

/** Formatta una durata in secondi come "m:ss" o "h:mm:ss". */
export function formattaDurata(secondi: number): string {
  const tot = Math.max(0, Math.floor(secondi));
  const h = Math.floor(tot / 3600);
  const m = Math.floor((tot % 3600) / 60);
  const s = tot % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Formatta una distanza in metri come km con una cifra decimale. */
export function formattaKm(metri: number): string {
  return (metri / 1000).toLocaleString('it-IT', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

/** Indice del punto del tracciato più vicino a una posizione. */
export function indicePuntoPiuVicino(tracciato: Punto[], pos: Punto): number {
  let migliore = 0;
  let distanzaMin = Infinity;
  tracciato.forEach((p, i) => {
    const d = distanzaMetri(p, pos);
    if (d < distanzaMin) {
      distanzaMin = d;
      migliore = i;
    }
  });
  return migliore;
}

/** Distanza (in metri) rimanente sul tracciato a partire da un indice fino alla fine. */
export function distanzaRimanente(tracciato: Punto[], daIndice: number): number {
  let totale = 0;
  for (let i = daIndice; i < tracciato.length - 1; i++) {
    totale += distanzaMetri(tracciato[i], tracciato[i + 1]);
  }
  return totale;
}

/** Converte una velocità in m/s (come da GPS) in km/h. */
export function msAKmh(ms: number | null | undefined): number | null {
  if (ms === null || ms === undefined || Number.isNaN(ms)) return null;
  return ms * 3.6;
}

/** Rotta (bearing) in gradi 0-360 da un punto al successivo. */
function bearing(a: Punto, b: Punto): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

/** Differenza angolare assoluta tra due rotte, 0-180 gradi. */
function deltaAngolo(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

/**
 * Calcola le statistiche di un giro dai punti GPS.
 * - velocità media: distanza totale / tempo in movimento
 * - velocità max: massimo tra le letture GPS (o stimata dai segmenti)
 * - dislivello positivo: somma delle salite (se l'altitudine è disponibile)
 * - curve: numero di cambi di direzione significativi (> 35°)
 */
export function statisticheGiro(punti: Punto[], durataSec: number, distanzaM: number): StatGiro {
  // velocità media (km/h)
  const velMediaKmh = durataSec > 0 ? (distanzaM / durataSec) * 3.6 : 0;

  // velocità massima: usa le letture GPS se ci sono, altrimenti stima dai segmenti col tempo
  let velMax = 0;
  for (const p of punti) {
    if (typeof p.vel === 'number' && p.vel > velMax) velMax = p.vel;
  }
  if (velMax === 0) {
    for (let i = 1; i < punti.length; i++) {
      const a = punti[i - 1];
      const b = punti[i];
      if (a.t && b.t && b.t > a.t) {
        const v = distanzaMetri(a, b) / ((b.t - a.t) / 1000);
        if (v > velMax) velMax = v;
      }
    }
  }
  const velMaxKmh = velMax * 3.6;

  // dislivello positivo (somma delle salite), con piccola soglia anti-rumore
  let dislivelloPositivoM = 0;
  for (let i = 1; i < punti.length; i++) {
    const aAlt = punti[i - 1].alt;
    const bAlt = punti[i].alt;
    if (typeof aAlt === 'number' && typeof bAlt === 'number') {
      const d = bAlt - aAlt;
      if (d > 1) dislivelloPositivoM += d;
    }
  }

  // curve: cambi di rotta oltre 35° tra segmenti consecutivi abbastanza lunghi
  let curve = 0;
  let rottaPrec: number | null = null;
  for (let i = 1; i < punti.length; i++) {
    if (distanzaMetri(punti[i - 1], punti[i]) < 12) continue;
    const r = bearing(punti[i - 1], punti[i]);
    if (rottaPrec !== null && deltaAngolo(rottaPrec, r) > 35) curve++;
    rottaPrec = r;
  }

  return {
    velMediaKmh: Math.round(velMediaKmh),
    velMaxKmh: Math.round(velMaxKmh),
    dislivelloPositivoM: Math.round(dislivelloPositivoM),
    curve,
  };
}
