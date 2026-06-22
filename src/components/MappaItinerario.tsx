'use client';

import { useEffect, useRef } from 'react';
import { Tappa } from '@/lib/types';

const PIXEL_TRASPARENTE =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

interface Props {
  tappe: Tappa[];
  tracciato: [number, number][];
}

export default function MappaItinerario({ tappe, tracciato }: Props) {
  const contenitore = useRef<HTMLDivElement>(null);
  const mappaRef = useRef<unknown>(null);

  useEffect(() => {
    let attivo = true;

    async function init() {
      if (!contenitore.current || tappe.length === 0 || mappaRef.current) return;
      const L = (await import('leaflet')).default;
      if (!attivo || !contenitore.current) return;

      const mappa = L.map(contenitore.current, { scrollWheelZoom: false });
      mappaRef.current = mappa;

      // CARTO Voyager: stesso dato OpenStreetMap, ma pensato per essere
      // incorporato (più affidabile in iframe/sandbox di tile.openstreetmap.org).
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19,
        errorTileUrl: PIXEL_TRASPARENTE,
      }).addTo(mappa);

      // Linea del percorso: usa il tracciato dettagliato se presente,
      // altrimenti collega semplicemente le tappe.
      const lineaPunti =
        tracciato && tracciato.length > 1
          ? tracciato
          : tappe.map((t) => [t.lat, t.lng] as [number, number]);

      L.polyline(lineaPunti, {
        color: '#28282B',
        weight: 4,
        opacity: 0.85,
        lineJoin: 'round',
      }).addTo(mappa);

      // Marker numerati (corrispondono al roadbook), senza emoji
      tappe.forEach((t) => {
        const icona = L.divIcon({
          className: '',
          html: `<div class="marker-tappa">${t.ordine}</div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });
        L.marker([t.lat, t.lng], { icon: icona })
          .addTo(mappa)
          .bindTooltip(t.nome, {
            permanent: true,
            direction: 'top',
            offset: [0, -14],
            className: 'etichetta-tappa',
          })
          .bindPopup(
            `<strong>${t.ordine}. ${t.nome}</strong>${t.note ? `<br/>${t.note}` : ''}`
          );
      });

      // Bussola
      const Bussola = L.Control.extend({
        onAdd: function () {
          const div = L.DomUtil.create('div', 'bussola-mappa');
          div.innerHTML = 'N<span>▲</span>';
          return div;
        },
      });
      new Bussola({ position: 'topright' }).addTo(mappa);

      const bounds = L.latLngBounds(lineaPunti as [number, number][]);
      mappa.fitBounds(bounds, { padding: [40, 40] });
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
  }, [tappe, tracciato]);

  return (
    <div
      ref={contenitore}
      className="mappa-itinerario h-72 w-full border-2 border-asfalto sm:h-96"
      role="img"
      aria-label="Mappa dell’itinerario con il percorso, le tappe numerate e i loro nomi"
    />
  );
}
