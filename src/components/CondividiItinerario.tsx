'use client';

import { useState } from 'react';
import { generaCardGiro } from '@/lib/card-canvas';
import { Punto } from '@/lib/geo';
import { getSupabaseBrowser } from '@/lib/supabase-browser';

// Pulsante che genera al volo la card del percorso di un itinerario e la
// condivide. Usa la traccia GPS reale se qualcuno l'ha registrata e resa
// pubblica su questo itinerario (così le curve sono vere); altrimenti ripiega
// sui punti-città del tracciato base.
export default function CondividiItinerario({
  itinerarioId,
  titolo,
  zona,
  km,
  durataOre,
  tracciato,
}: {
  itinerarioId: string;
  titolo: string;
  zona: string;
  km: number;
  durataOre: number;
  tracciato: [number, number][];
}) {
  const [stato, setStato] = useState<'idle' | 'genero' | 'errore'>('idle');

  // Cerca l'ultima traccia GPS pubblica e densa registrata su questo itinerario.
  async function tracciaReale(): Promise<[number, number][] | null> {
    const supabase = getSupabaseBrowser();
    if (!supabase) return null;
    try {
      const { data } = await supabase
        .from('giri')
        .select('tracciato')
        .eq('itinerario_id', itinerarioId)
        .eq('pubblico', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      const t = data?.tracciato as [number, number][] | undefined;
      // serve densa per avere curve vere
      if (t && Array.isArray(t) && t.length >= 15) return t;
    } catch {
      // ignora: si userà il tracciato base
    }
    return null;
  }

  async function condividi() {
    if (tracciato.length < 2) return;
    setStato('genero');
    try {
      const reale = await tracciaReale();
      const coords = reale ?? tracciato;
      const punti: Punto[] = coords.map(([lat, lng]) => ({ lat, lng }));
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
        `${km} km in moto 🏍️ — itinerario su MotoGarage`;

      const res = await fetch(url);
      const blob = await res.blob();
      const file = new File([blob], 'motogarage-itinerario.png', { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: titolo, text: testo });
      } else {
        const a = document.createElement('a');
        a.href = url;
        a.download = 'motogarage-itinerario.png';
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
