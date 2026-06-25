'use client';

import { useEffect, useState } from 'react';
import { useFeedback } from './FeedbackProvider';

const CHIAVE = 'motogarage-onboard-traccia-v1';

const PASSI = [
  {
    titolo: 'Avvia il GPS',
    testo: 'Premi Inizia e concedi la posizione. Il tracciato si disegna mentre guidi.',
  },
  {
    titolo: 'Km e statistiche live',
    testo: 'Velocità, distanza e tempo si aggiornano in tempo reale sulla mappa.',
  },
  {
    titolo: 'Card per Instagram',
    testo: 'A fine giro crei la card 9:16 con didascalia pronta — un tap e condividi.',
  },
];

export default function OnboardingTraccia({ pronto }: { pronto: boolean }) {
  const { toast } = useFeedback();
  const [passo, setPasso] = useState(0);
  const [aperto, setAperto] = useState(false);

  useEffect(() => {
    if (!pronto || typeof window === 'undefined') return;
    if (localStorage.getItem(CHIAVE)) return;
    const t = window.setTimeout(() => setAperto(true), 600);
    return () => window.clearTimeout(t);
  }, [pronto]);

  if (!aperto) return null;

  const step = PASSI[passo];
  const ultimo = passo === PASSI.length - 1;

  function chiudi() {
    localStorage.setItem(CHIAVE, '1');
    setAperto(false);
    if (ultimo) toast('Buon giro! Termina e condividi la card su Instagram.');
  }

  function avanti() {
    if (ultimo) chiudi();
    else setPasso((p) => p + 1);
  }

  return (
    <div className="onboard-leggero" role="dialog" aria-modal="true" aria-labelledby="onboard-traccia-titolo">
      <div className="onboard-leggero-card">
        <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-brand">
          Primo giro · {passo + 1}/{PASSI.length}
        </p>
        <h2 id="onboard-traccia-titolo" className="mt-2 font-display text-xl font-black uppercase leading-tight text-white">
          {step.titolo}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-cemento/75">{step.testo}</p>
        <div className="mt-4 flex gap-1.5">
          {PASSI.map((_, i) => (
            <span key={i} className={`h-1 flex-1 rounded-full ${i <= passo ? 'bg-brand' : 'bg-white/12'}`} />
          ))}
        </div>
        <div className="mt-5 flex gap-2">
          <button type="button" onClick={chiudi} className="tap flex-1 rounded-app border border-white/12 py-2.5 font-mono text-[10px] font-bold uppercase text-cemento/55">
            Salta
          </button>
          <button type="button" onClick={avanti} className="tap flex-1 rounded-app bg-brand py-2.5 font-mono text-[10px] font-bold uppercase text-white">
            {ultimo ? 'Parti!' : 'Avanti'}
          </button>
        </div>
      </div>
    </div>
  );
}
