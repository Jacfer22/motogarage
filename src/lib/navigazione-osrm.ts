import type { Punto } from '@/lib/geo';
import { distanzaMetri } from '@/lib/geo';

export interface DestinazioneNav {
  lat: number;
  lng: number;
  nome: string;
}

export interface PassoNavigazione {
  istruzione: string;
  nomeVia: string | null;
  distanzaM: number;
  lat: number;
  lng: number;
}

interface OsrmManeuver {
  type?: string;
  modifier?: string;
}

interface OsrmStep {
  distance: number;
  name?: string;
  maneuver: OsrmManeuver;
  intersections?: { location: [number, number] }[];
}

interface OsrmRoute {
  distance: number;
  duration: number;
  geometry: { coordinates: [number, number][] };
  legs: { steps: OsrmStep[] }[];
}

function istruzioneDaMano(m: OsrmManeuver, nomeVia?: string): string {
  const mod = m.modifier ?? '';
  const via = nomeVia?.trim() ? ` in ${nomeVia.trim()}` : '';
  switch (m.type) {
    case 'arrive':
      return 'Sei arrivato a destinazione';
    case 'depart':
      return `Parti${via}`;
    case 'roundabout':
    case 'rotary':
      return `Prendi la rotonda${via}`;
    case 'fork':
      if (mod.includes('left')) return `Alla biforcazione tieni la sinistra${via}`;
      if (mod.includes('right')) return `Alla biforcazione tieni la destra${via}`;
      return `Alla biforcazione prosegui dritto${via}`;
    case 'turn':
      if (mod.includes('sharp left')) return `Gira nettamente a sinistra${via}`;
      if (mod.includes('sharp right')) return `Gira nettamente a destra${via}`;
      if (mod.includes('slight left')) return `Tieni leggermente la sinistra${via}`;
      if (mod.includes('slight right')) return `Tieni leggermente la destra${via}`;
      if (mod.includes('left')) return `Gira a sinistra${via}`;
      if (mod.includes('right')) return `Gira a destra${via}`;
      return `Prosegui dritto${via}`;
    case 'merge':
      return `Immettiti sulla strada${via}`;
    case 'on ramp':
      return `Prendi la rampa${via}`;
    case 'off ramp':
      return `Esci${via}`;
    case 'end of road':
      if (mod.includes('left')) return `Fine strada — gira a sinistra${via}`;
      if (mod.includes('right')) return `Fine strada — gira a destra${via}`;
      return `Fine strada — prosegui${via}`;
    default:
      return nomeVia ? `Prosegui in ${nomeVia}` : 'Prosegui dritto';
  }
}

export function passiDaRottaOsrm(route: OsrmRoute): PassoNavigazione[] {
  const steps = route.legs[0]?.steps ?? [];
  return steps.map((step) => {
    const loc = step.maneuver as OsrmManeuver & { location?: [number, number] };
    const coord = loc.location ?? step.intersections?.[0]?.location ?? [0, 0];
    return {
      istruzione: istruzioneDaMano(step.maneuver, step.name),
      nomeVia: step.name?.trim() || null,
      distanzaM: Math.round(step.distance),
      lng: coord[0],
      lat: coord[1],
    };
  });
}

export function geometriaDaRottaOsrm(route: OsrmRoute): Punto[] {
  return route.geometry.coordinates.map(([lng, lat]) => ({ lat, lng }));
}

export function indicePassoCorrente(passi: PassoNavigazione[], pos: Punto): number {
  if (passi.length === 0) return 0;
  let migliore = 0;
  let min = Infinity;
  passi.forEach((p, i) => {
    const d = distanzaMetri(pos, { lat: p.lat, lng: p.lng });
    if (d < min) {
      min = d;
      migliore = i;
    }
  });
  if (migliore < passi.length - 1 && min < 40) return migliore + 1;
  return migliore;
}

export function distanzaAlPasso(pos: Punto, passo: PassoNavigazione): number {
  return distanzaMetri(pos, { lat: passo.lat, lng: passo.lng });
}

export function formattaDistanzaNav(m: number): string {
  if (m >= 1000) return `${(m / 1000).toLocaleString('it-IT', { maximumFractionDigits: 1 })} km`;
  return `${Math.max(0, Math.round(m))} m`;
}

/** Distanza grande al centro (modalità solo scritte). */
export function distanzaNavGrande(m: number): string {
  if (m >= 1000) {
    const km = m / 1000;
    const arrotondato = km >= 10 ? Math.round(km) : Math.round(km * 10) / 10;
    return `${arrotondato.toLocaleString('it-IT', { maximumFractionDigits: 1 })} km`;
  }
  return `${Math.max(0, Math.round(m))} m`;
}

/** Manovra senza nome via (es. "Gira a destra"). */
export function manovraBreve(passo: PassoNavigazione): string {
  if (passo.istruzione === 'Sei arrivato a destinazione') return passo.istruzione;
  const tag = ' in ';
  const idx = passo.istruzione.indexOf(tag);
  if (idx >= 0) return passo.istruzione.slice(0, idx);
  return passo.istruzione;
}

/** Solo il tratto di rotta ancora da percorrere (non il GPS già fatto). */
export function percorsoRimanente(percorso: Punto[], pos: Punto): Punto[] {
  if (percorso.length === 0) return [];
  if (percorso.length === 1) return percorso;

  let idx = 0;
  let min = Infinity;
  for (let i = 0; i < percorso.length; i++) {
    const d = distanzaMetri(pos, percorso[i]!);
    if (d <= min) {
      min = d;
      idx = i;
    }
  }

  const resto = percorso.slice(Math.max(0, idx));
  return resto.length > 0 ? resto : percorso.slice(-1);
}

export interface RottaCalcolata {
  percorso: Punto[];
  passi: PassoNavigazione[];
  distanzaM: number;
  durataSec: number;
}

export async function calcolaRotta(
  da: Punto,
  a: DestinazioneNav,
): Promise<RottaCalcolata> {
  const params = new URLSearchParams({
    daLat: String(da.lat),
    daLng: String(da.lng),
    aLat: String(a.lat),
    aLng: String(a.lng),
  });
  const risposta = await fetch(`/api/naviga/route?${params}`);
  const json = await risposta.json() as {
    errore?: string;
    route?: OsrmRoute;
  };
  if (!risposta.ok || !json.route) {
    throw new Error(json.errore ?? 'Percorso non disponibile.');
  }
  const route = json.route;
  return {
    percorso: geometriaDaRottaOsrm(route),
    passi: passiDaRottaOsrm(route),
    distanzaM: Math.round(route.distance),
    durataSec: Math.round(route.duration),
  };
}

export interface RisultatoCerca {
  lat: number;
  lng: number;
  nome: string;
}

export async function cercaDestinazione(query: string): Promise<RisultatoCerca[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const risposta = await fetch(`/api/naviga/cerca?q=${encodeURIComponent(q)}`);
  const json = await risposta.json() as { risultati?: RisultatoCerca[]; errore?: string };
  if (!risposta.ok) throw new Error(json.errore ?? 'Ricerca non riuscita.');
  return json.risultati ?? [];
}
