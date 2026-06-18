'use client';

import { useEffect, useRef } from 'react';
import { Foto } from '@/lib/types';

const PIXEL_TRASPARENTE =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

// Mostra su mappa le foto che hanno una posizione (lat/lng). Le foto senza
// posizione non appaiono qui (restano nella galleria a colonna).
export default function MappaFoto({ foto }: { foto: Foto[] }) {
  const contenitore = useRef<HTMLDivElement>(null);
  const mappaRef = useRef<unknown>(null);

  const conPosizione = foto.filter(
    (f) => typeof f.lat === 'number' && typeof f.lng === 'number'
  );

  useEffect(() => {
    let attivo = true;

    async function init() {
      if (!contenitore.current || conPosizione.length === 0 || mappaRef.current) return;
      const L = (await import('leaflet')).default;
      if (!attivo || !contenitore.current) return;

      const mappa = L.map(contenitore.current, { scrollWheelZoom: false });
      mappaRef.current = mappa;

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19,
        errorTileUrl: PIXEL_TRASPARENTE,
      }).addTo(mappa);

      const punti: [number, number][] = [];
      for (const f of conPosizione) {
        const lat = f.lat as number;
        const lng = f.lng as number;
        punti.push([lat, lng]);

        const icona = L.divIcon({
          className: '',
          html: `<div style="width:18px;height:18px;border-radius:50%;background:#F2B705;border:3px solid #15181A;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>`,
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        });
        const marker = L.marker([lat, lng], { icon: icona }).addTo(mappa);
        const didascalia = f.didascalia ? `<p style="margin:4px 0 0;font-size:12px">${f.didascalia}</p>` : '';
        marker.bindPopup(
          `<div style="width:160px"><img src="${f.url}" style="width:100%;border-radius:6px;display:block" alt=""/>${didascalia}</div>`
        );
      }

      if (punti.length === 1) {
        mappa.setView(punti[0], 13);
      } else {
        mappa.fitBounds(punti, { padding: [40, 40] });
      }
    }

    init();
    return () => {
      attivo = false;
      if (mappaRef.current) {
        (mappaRef.current as { remove: () => void }).remove();
        mappaRef.current = null;
      }
    };
  }, [conPosizione]);

  if (conPosizione.length === 0) return null;

  return (
    <div className="mt-6">
      <p className="mb-2 font-mono text-xs uppercase tracking-wide text-asfalto/50">
        Le foto sulla mappa ({conPosizione.length})
      </p>
      <div
        ref={contenitore}
        className="h-72 w-full overflow-hidden rounded-app border border-asfalto/15"
      />
    </div>
  );
}
