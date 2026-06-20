'use client';

import { useEffect, useRef } from 'react';
import type { Punto } from '@/lib/geo';

const PIXEL_TRASPARENTE =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

interface Props {
  posizione: Punto | null;
  percorsoNav?: Punto[];
  percorsoGps?: Punto[];
  destinazione?: { lat: number; lng: number } | null;
  segui: boolean;
  onSeguiChange: (segui: boolean) => void;
  ricentraTick: number;
}

export default function MappaNavigatore({
  posizione,
  percorsoNav,
  percorsoGps,
  destinazione,
  segui,
  onSeguiChange,
  ricentraTick,
}: Props) {
  const contenitore = useRef<HTMLDivElement>(null);
  const mappaRef = useRef<unknown>(null);
  const lineaNavRef = useRef<unknown>(null);
  const lineaGpsRef = useRef<unknown>(null);
  const markerRef = useRef<unknown>(null);
  const markerDestRef = useRef<unknown>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leafletRef = useRef<any>(null);
  const onSeguiChangeRef = useRef(onSeguiChange);

  useEffect(() => {
    onSeguiChangeRef.current = onSeguiChange;
  }, [onSeguiChange]);

  useEffect(() => {
    let attivo = true;

    async function init() {
      if (!contenitore.current || mappaRef.current) return;
      const L = (await import('leaflet')).default;
      if (!attivo || !contenitore.current) return;
      leafletRef.current = L;

      const centro: [number, number] = posizione
        ? [posizione.lat, posizione.lng]
        : [41.9, 12.5];

      const mappa = L.map(contenitore.current, {
        scrollWheelZoom: false,
        zoomControl: false,
      }).setView(centro, 15);
      mappaRef.current = mappa;

      mappa.on('dragstart', () => onSeguiChangeRef.current(false));

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19,
        errorTileUrl: PIXEL_TRASPARENTE,
      }).addTo(mappa);

      lineaNavRef.current = L.polyline([], {
        color: '#2563eb',
        weight: 7,
        opacity: 0.85,
        lineJoin: 'round',
      }).addTo(mappa);

      lineaGpsRef.current = L.polyline([], {
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
      markerRef.current = null;
      markerDestRef.current = null;
      if (mappaRef.current) {
        (mappaRef.current as { remove: () => void }).remove();
        mappaRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const L = leafletRef.current;
    const mappa = mappaRef.current as {
      setView: (latlng: [number, number], zoom?: number, opts?: object) => void;
      getZoom: () => number;
      panTo: (latlng: [number, number], opts?: object) => void;
    } | null;
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
  }, [percorsoNav, destinazione]);

  useEffect(() => {
    const lineaGps = lineaGpsRef.current as { setLatLngs: (l: [number, number][]) => void } | null;
    if (!lineaGps) return;
    const gpsLatlngs = (percorsoGps ?? []).map((p) => [p.lat, p.lng] as [number, number]);
    lineaGps.setLatLngs(gpsLatlngs);
  }, [percorsoGps]);

  useEffect(() => {
    const L = leafletRef.current;
    const mappa = mappaRef.current as {
      setView: (latlng: [number, number], zoom?: number, opts?: object) => void;
      getZoom: () => number;
      panTo: (latlng: [number, number], opts?: object) => void;
    } | null;
    if (!L || !mappa || !posizione) return;

    const latlng: [number, number] = [posizione.lat, posizione.lng];

    if (!markerRef.current) {
      const icona = L.divIcon({
        className: '',
        html: '<div class="marker-posizione"></div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });
      markerRef.current = L.marker(latlng, { icon: icona, zIndexOffset: 1000 }).addTo(mappa);
    } else {
      (markerRef.current as { setLatLng: (l: [number, number]) => void }).setLatLng(latlng);
    }

    if (segui) {
      mappa.setView(latlng, Math.max(mappa.getZoom(), 16), { animate: true });
    }
  }, [posizione, segui]);

  useEffect(() => {
    const mappa = mappaRef.current as {
      setView: (latlng: [number, number], zoom?: number, opts?: object) => void;
      getZoom: () => number;
    } | null;
    if (!mappa || !posizione || ricentraTick === 0) return;
    const latlng: [number, number] = [posizione.lat, posizione.lng];
    mappa.setView(latlng, Math.max(mappa.getZoom(), 16), { animate: true });
  }, [ricentraTick, posizione]);

  return (
    <div
      ref={contenitore}
      className="h-full min-h-[52dvh] w-full"
      role="img"
      aria-label="Mappa navigatore con la tua posizione GPS"
    />
  );
}
