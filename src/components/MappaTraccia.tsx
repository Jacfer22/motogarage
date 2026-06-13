'use client';

import { useEffect, useRef } from 'react';
import { Punto } from '@/lib/geo';

const PIXEL_TRASPARENTE =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

interface Props {
  punti: Punto[];
  inCorso: boolean;
}

export default function MappaTraccia({ punti, inCorso }: Props) {
  const contenitore = useRef<HTMLDivElement>(null);
  const mappaRef = useRef<unknown>(null);
  const lineaRef = useRef<unknown>(null);
  const markerRef = useRef<unknown>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leafletRef = useRef<any>(null);

  // Inizializza la mappa una sola volta
  useEffect(() => {
    let attivo = true;

    async function init() {
      if (!contenitore.current || mappaRef.current) return;
      const L = (await import('leaflet')).default;
      if (!attivo || !contenitore.current) return;
      leafletRef.current = L;

      const centro: [number, number] = punti[0]
        ? [punti[0].lat, punti[0].lng]
        : [41.9, 12.5]; // Roma, in attesa del primo punto GPS

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

      setTimeout(() => mappa.invalidateSize(), 200);
    }

    init();

    return () => {
      attivo = false;
      if (mappaRef.current) {
        (mappaRef.current as { remove: () => void }).remove();
        mappaRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Aggiorna il tracciato e il marker ad ogni nuovo punto
  useEffect(() => {
    const L = leafletRef.current;
    const mappa = mappaRef.current as {
      panTo: (latlng: [number, number], opts?: object) => void;
      fitBounds: (bounds: unknown, opts?: object) => void;
    } | null;
    const linea = lineaRef.current as { setLatLngs: (latlngs: [number, number][]) => void } | null;
    if (!L || !mappa || !linea || punti.length === 0) return;

    const latlngs = punti.map((p) => [p.lat, p.lng] as [number, number]);
    linea.setLatLngs(latlngs);

    const ultimo = latlngs[latlngs.length - 1];

    if (!markerRef.current) {
      const icona = L.divIcon({
        className: '',
        html: '<div class="marker-posizione"></div>',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });
      markerRef.current = L.marker(ultimo, { icon: icona }).addTo(mappa);
    } else {
      (markerRef.current as { setLatLng: (latlng: [number, number]) => void }).setLatLng(ultimo);
    }

    if (inCorso) {
      mappa.panTo(ultimo, { animate: true });
    } else if (latlngs.length > 1) {
      mappa.fitBounds(L.latLngBounds(latlngs), { padding: [30, 30] });
    }
  }, [punti, inCorso]);

  return (
    <div
      ref={contenitore}
      className="mappa-itinerario h-72 w-full border-2 border-asfalto sm:h-96"
      role="img"
      aria-label="Mappa con il tracciato GPS del giro in corso"
    />
  );
}
