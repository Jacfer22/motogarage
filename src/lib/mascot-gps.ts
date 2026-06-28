import type { Punto } from '@/lib/geo';

export type IdMascotGps = 'rosso' | 'blu' | 'nero';

export interface MascotGps {
  id: IdMascotGps;
  nome: string;
  ruolo: string;
  immagine: string;
  accent: string;
  rotazioneBase: number;
}

export const MASCOTTE_GPS: MascotGps[] = [
  {
    id: 'rosso',
    nome: 'Rosso',
    ruolo: 'Sport',
    immagine: '/mascot/rosso-sport.png',
    accent: '#ED2100',
    rotazioneBase: -90,
  },
  {
    id: 'blu',
    nome: 'Blu',
    ruolo: 'Adventure',
    immagine: '/mascot/blu-adventure.png',
    accent: '#2B8CDE',
    rotazioneBase: 90,
  },
  {
    id: 'nero',
    nome: 'Nero',
    ruolo: 'Cruiser',
    immagine: '/mascot/nero-cruiser.png',
    accent: '#C8C4BC',
    rotazioneBase: -90,
  },
];

export const MOTO_GPS_FUTURE = [
  { id: 'panigale', nome: 'Panigale', emoji: '🏁' },
  { id: 'africa', nome: 'Adventure', emoji: '🏔️' },
  { id: 'bobber', nome: 'Bobber', emoji: '🛣️' },
  { id: 'scrambler', nome: 'Scrambler', emoji: '🌄' },
  { id: 'naked', nome: 'Naked', emoji: '⚡' },
  { id: 'touring', nome: 'Touring', emoji: '🧭' },
] as const;

const CHIAVE_STORAGE = 'motogarage-mascot-gps';

/** Pixel display sul marker mappa (PNG sorgente molto grandi) */
export const MASCOT_MARKER_PX = 40;

export function mascotGps(id: IdMascotGps): MascotGps {
  return MASCOTTE_GPS.find((m) => m.id === id) ?? MASCOTTE_GPS[0];
}

export function leggiMascotGps(): IdMascotGps {
  if (typeof window === 'undefined') return 'rosso';
  const raw = localStorage.getItem(CHIAVE_STORAGE);
  if (raw === 'rosso' || raw === 'blu' || raw === 'nero') return raw;
  return 'rosso';
}

export function salvaMascotGps(id: IdMascotGps): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CHIAVE_STORAGE, id);
}

export function direzioneGradi(da: Punto, a: Punto): number {
  const lat1 = (da.lat * Math.PI) / 180;
  const lat2 = (a.lat * Math.PI) / 180;
  const dLng = ((a.lng - da.lng) * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

export function rotazioneMarkerMascot(punti: Punto[], mascot: MascotGps): number {
  if (punti.length >= 2) {
    const da = punti[punti.length - 2];
    const a = punti[punti.length - 1];
    if (Math.hypot(a.lat - da.lat, a.lng - da.lng) > 1e-7) {
      return direzioneGradi(da, a) + mascot.rotazioneBase;
    }
  }
  return mascot.rotazioneBase;
}

export function rotazioneMascotNav(
  percorsoGps: Punto[] | undefined,
  posizione: Punto | null,
  mascot: MascotGps,
): number {
  if (percorsoGps && percorsoGps.length >= 2) {
    return rotazioneMarkerMascot(percorsoGps, mascot);
  }
  if (posizione && percorsoGps && percorsoGps.length === 1) {
    return rotazioneMarkerMascot([percorsoGps[0], posizione], mascot);
  }
  return mascot.rotazioneBase;
}

/** HTML marker con dimensioni inline — Leaflet ignora spesso il CSS globale sulle PNG enormi */
export function htmlMarkerMascotGps(mascot: MascotGps, rotazioneGradi = mascot.rotazioneBase): string {
  const px = MASCOT_MARKER_PX;
  return `<div class="marker-mascot-gps" style="width:${px}px;height:${px}px;overflow:visible;display:flex;align-items:flex-end;justify-content:center;--mascot-accent:${mascot.accent}">
    <img src="${mascot.immagine}" alt="" draggable="false" width="${px}" height="${px}" style="width:${px}px;height:${px}px;max-width:${px}px;max-height:${px}px;object-fit:contain;display:block;transform:rotate(${rotazioneGradi}deg);transform-origin:center bottom" />
  </div>`;
}

export const DIMENSIONI_MARKER_MASCOT = {
  iconSize: [44, 44] as [number, number],
  iconAnchor: [22, 38] as [number, number],
};

export function creaIconaMascotLeaflet(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  L: any,
  mascot: MascotGps,
  rotazioneGradi: number,
) {
  return L.divIcon({
    className: 'marker-mascot-wrap',
    html: htmlMarkerMascotGps(mascot, rotazioneGradi),
    iconSize: DIMENSIONI_MARKER_MASCOT.iconSize,
    iconAnchor: DIMENSIONI_MARKER_MASCOT.iconAnchor,
  });
}
