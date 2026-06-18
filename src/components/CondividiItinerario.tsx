'use client';

import { useState } from 'react';
import { generaCardGiro } from '@/lib/card-canvas';
import { Punto } from '@/lib/geo';

// Pulsante che genera al volo la card del percorso di un itinerario (tema
// tracciato 3D) e la condivide. Serve a rendere ogni itinerario "postabile"
// sui social, anche da chi non l'ha registrato col GPS — pubblicità per il sito.
export default function CondividiItinerario({
  titolo,
  zona,
  km,
  durataOre,
  tracciato,
}: {
  titolo: string;
  zona: string;
  km: number;
  durataOre: number;
  tracciato: [number, number][];
}) {
  const [stato, setStato] = useState<'idle' | 'genero' | 'errore'>('idle');

  async function condividi() {
    if (tracciato.length < 2) return;
    setStato('genero');
    try {
      const punti: Punto[] = tracciato.map(([lat, lng]) => ({ lat, lng }));
      const durata = `${Math.floor(durataOre)}:${String(Math.round((durataOre % 1) * 60)).padStart(2, '0')}`;
      const url = await generaCardGiro({
        titolo,
        km: String(km),
        durata,
        data: new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }),
        punti,
        tema: 'tracciato',
        luogo: titolo,
      });

      const testo =
        `${titolo} · ${zona}\n` +
        `${km} km in moto 🏍️ — itinerario su GiroSecco\n` +
        `https://girosecco.vercel.app`;

      const res = await fetch(url);
      const blob = await res.blob();
      const file = new File([blob], 'girosecco-itinerario.png', { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: titolo, text: testo });
      } else {
        // fallback: scarica l'immagine
        const a = document.createElement('a');
        a.href = url;
        a.download = 'girosecco-itinerario.png';
        a.click();
      }
      setStato('idle');
    } catch {
      setStato('errore');
    }
  }

  if (tracciato.length < 2) return null;

  return (
    <div>
      <button
        type="button"
        onClick={condividi}
        disabled={stato === 'genero'}
        className="tap inline-flex items-center gap-2 rounded-app border-2 border-asfalto px-4 py-2 font-mono text-xs font-medium uppercase tracking-wide hover:bg-asfalto hover:text-cemento disabled:opacity-60"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <path d="m8.6 13.5 6.8 4M15.4 6.5 8.6 10.5" />
        </svg>
        {stato === 'genero' ? 'Genero la card…' : 'Condividi questo giro'}
      </button>
      {stato === 'errore' && (
        <p className="mt-1 font-mono text-xs text-cartello">Non sono riuscito a generare la card.</p>
      )}
    </div>
  );
}
