import type { Punto } from '@/lib/geo';
import { distanzaMetri } from '@/lib/geo';

/** Piazzale Clodio / Via Trionfale → Piazza del Popolo (reel marketing) */
export const REEL_NAV_PARTENZA: Punto = { lat: 41.90785, lng: 12.45605 };
export const REEL_NAV_DESTINAZIONE = {
  lat: 41.91092,
  lng: 12.47628,
  nome: 'Piazza del Popolo, Roma',
};

export function lunghezzaPercorso(punti: Punto[]): number {
  let tot = 0;
  for (let i = 1; i < punti.length; i++) tot += distanzaMetri(punti[i - 1]!, punti[i]!);
  return tot;
}

function bearingGradi(da: Punto, a: Punto): number {
  const φ1 = (da.lat * Math.PI) / 180;
  const φ2 = (a.lat * Math.PI) / 180;
  const Δλ = ((a.lng - da.lng) * Math.PI) / 180;
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

/** Punto lungo il percorso a distanza cumulata (metri) + direzione di marcia. */
export function puntoSuPercorso(
  punti: Punto[],
  distanzaM: number,
): { punto: Punto; bearing: number } {
  if (punti.length === 0) return { punto: REEL_NAV_PARTENZA, bearing: 45 };
  if (punti.length === 1) return { punto: punti[0]!, bearing: 0 };

  let rimanente = Math.max(0, distanzaM);
  for (let i = 1; i < punti.length; i++) {
    const a = punti[i - 1]!;
    const b = punti[i]!;
    const seg = distanzaMetri(a, b);
    if (rimanente <= seg || i === punti.length - 1) {
      const t = seg > 0 ? Math.min(1, rimanente / seg) : 0;
      return {
        punto: {
          lat: a.lat + (b.lat - a.lat) * t,
          lng: a.lng + (b.lng - a.lng) * t,
        },
        bearing: bearingGradi(a, b),
      };
    }
    rimanente -= seg;
  }
  const ultimo = punti[punti.length - 1]!;
  const penultimo = punti[punti.length - 2]!;
  return { punto: ultimo, bearing: bearingGradi(penultimo, ultimo) };
}

/** Traccia GPS già percorsa fino a distanzaM lungo il polyline. */
export function tracciaFinoA(punti: Punto[], distanzaM: number): Punto[] {
  if (punti.length === 0) return [];
  if (punti.length === 1) return [...punti];
  const out: Punto[] = [punti[0]!];
  let acc = 0;
  for (let i = 1; i < punti.length; i++) {
    const a = punti[i - 1]!;
    const b = punti[i]!;
    const seg = distanzaMetri(a, b);
    if (acc + seg >= distanzaM) {
      const t = seg > 0 ? (distanzaM - acc) / seg : 0;
      out.push({ lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t });
      return out;
    }
    acc += seg;
    out.push(b);
  }
  return out;
}
