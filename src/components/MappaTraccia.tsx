'use client';

import { useEffect, useRef, useState } from 'react';
import { Punto } from '@/lib/geo';
import {
  creaIconaMascotLeaflet,
  mascotGps,
  rotazioneMarkerMascot,
  type IdMascotGps,
} from '@/lib/mascot-gps';

const PIXEL_TRASPARENTE =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

interface Props {
  punti: Punto[];
  inCorso: boolean;
  percorsoNav?: Punto[];
  destinazione?: { lat: number; lng: number } | null;
  fullscreen?: boolean;
  mascotId?: IdMascotGps;
}

function centroIniziale(
  punti: Punto[],
  percorsoNav: Punto[] | undefined,
  destinazione: { lat: number; lng: number } | null | undefined,
): [number, number] {
  if (punti[0]) return [punti[0].lat, punti[0].lng];
  if (percorsoNav?.[0]) return [percorsoNav[0].lat, percorsoNav[0].lng];
  if (destinazione) return [destinazione.lat, destinazione.lng];
  return [41.9, 12.5];
}

export default function MappaTraccia({
  punti,
  inCorso,
  percorsoNav,
  destinazione,
  fullscreen = false,
  mascotId = 'rosso',
}: Props) {
  const contenitore = useRef<HTMLDivElement>(null);
  const mappaRef = useRef<unknown>(null);
  const lineaRef = useRef<unknown>(null);
  const lineaNavRef = useRef<unknown>(null);
  const markerRef = useRef<unknown>(null);
  const markerDestRef = useRef<unknown>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leafletRef = useRef<any>(null);
  const [mappaPronta, setMappaPronta] = useState(false);
  const ultimaIconaRef = useRef('');

  useEffect(() => {
    const mappa = mappaRef.current as { invalidateSize?: () => void } | null;
    if (!mappa?.invalidateSize) return;
    const t = window.setTimeout(() => mappa.invalidateSize?.(), 250);
    return () => window.clearTimeout(t);
  }, [fullscreen]);

  useEffect(() => {
    let attivo = true;

    async function init() {
      if (!contenitore.current || mappaRef.current) return;
      const L = (await import('leaflet')).default;
      if (!attivo || !contenitore.current) return;
      leafletRef.current = L;

      const centro = centroIniziale(punti, percorsoNav, destinazione);
      const mappa = L.map(contenitore.current, { scrollWheelZoom: false }).setView(centro, 14);
      mappaRef.current = mappa;

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19,
        errorTileUrl: PIXEL_TRASPARENTE,
      }).addTo(mappa);

      lineaRef.current = L.polyline([], {
        color: '#F2B705',
        weight: 5,
        opacity: 0.9,
        lineJoin: 'round',
      }).addTo(mappa);

      lineaNavRef.current = L.polyline([], {
        color: '#2563eb',
        weight: 6,
        opacity: 0.75,
        lineJoin: 'round',
      }).addTo(mappa);

      setMappaPronta(true);
      setTimeout(() => mappa.invalidateSize(), 200);
    }

    init();

    return () => {
      attivo = false;
      setMappaPronta(false);
      markerRef.current = null;
      markerDestRef.current = null;
      if (mappaRef.current) {
        (mappaRef.current as { remove: () => void }).remove();
        mappaRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tracciato GPS (giallo)
  useEffect(() => {
    if (!mappaPronta) return;
    const L = leafletRef.current;
    const mappa = mappaRef.current as {
      panTo: (latlng: [number, number], opts?: object) => void;
      fitBounds: (bounds: unknown, opts?: object) => void;
    } | null;
    const linea = lineaRef.current as { setLatLngs: (latlngs: [number, number][]) => void } | null;
    if (!L || !mappa || !linea) return;

    if (punti.length === 0) {
      linea.setLatLngs([]);
      return;
    }

    const latlngs = punti.map((p) => [p.lat, p.lng] as [number, number]);
    linea.setLatLngs(latlngs);

    const ultimo = latlngs[latlngs.length - 1];
    const mascot = mascotGps(mascotId);
    const rot = rotazioneMarkerMascot(punti, mascot);
    const chiaveIcona = `${mascotId}-${Math.round(rot / 8)}`;

    if (!markerRef.current) {
      markerRef.current = L.marker(ultimo, {
        icon: creaIconaMascotLeaflet(L, mascot, rot),
        zIndexOffset: 1000,
      }).addTo(mappa);
      ultimaIconaRef.current = chiaveIcona;
    } else {
      const m = markerRef.current as {
        setLatLng: (latlng: [number, number]) => void;
        setIcon: (icon: unknown) => void;
      };
      m.setLatLng(ultimo);
      if (chiaveIcona !== ultimaIconaRef.current) {
        ultimaIconaRef.current = chiaveIcona;
        m.setIcon(creaIconaMascotLeaflet(L, mascot, rot));
      }
    }

    if (inCorso) {
      mappa.panTo(ultimo, { animate: true, duration: 0.35, easeLinearity: 0.25 });
    } else if (latlngs.length > 1 && !(percorsoNav && percorsoNav.length > 1)) {
      mappa.fitBounds(L.latLngBounds(latlngs), { padding: [30, 30] });
    }
  }, [punti, inCorso, mappaPronta, percorsoNav, mascotId]);

  // Percorso navigazione OSRM (blu)
  useEffect(() => {
    if (!mappaPronta) return;
    const L = leafletRef.current;
    const mappa = mappaRef.current as { fitBounds: (b: unknown, o?: object) => void } | null;
    const lineaNav = lineaNavRef.current as { setLatLngs: (l: [number, number][]) => void } | null;
    if (!L || !mappa || !lineaNav) return;

    const navLatlngs = (percorsoNav ?? []).map((p) => [p.lat, p.lng] as [number, number]);
    lineaNav.setLatLngs(navLatlngs);

    if (destinazione) {
      const dest: [number, number] = [destinazione.lat, destinazione.lng];
      if (!markerDestRef.current) {
        const icona = L.divIcon({
          className: '',
          html: '<div class="marker-destinazione"></div>',
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        });
        markerDestRef.current = L.marker(dest, { icon: icona }).addTo(mappa);
      } else {
        (markerDestRef.current as { setLatLng: (l: [number, number]) => void }).setLatLng(dest);
      }
    } else if (markerDestRef.current) {
      (markerDestRef.current as { remove: () => void }).remove();
      markerDestRef.current = null;
    }

    if (navLatlngs.length > 1) {
      const bounds = L.latLngBounds(navLatlngs);
      if (punti.length > 0) {
        punti.forEach((p) => bounds.extend([p.lat, p.lng]));
      }
      mappa.fitBounds(bounds, { padding: [36, 36] });
    }
  }, [percorsoNav, destinazione, punti, mappaPronta]);

  return (
    <div
      ref={contenitore}
      className={
        fullscreen
          ? 'absolute inset-0 h-full w-full'
          : 'mappa-itinerario h-72 w-full border-2 border-asfalto sm:h-96'
      }
      role="img"
      aria-label="Mappa con tracciato GPS e percorso di navigazione"
    />
  );
}
