'use client';

import { useEffect, useState } from 'react';
import { useAuth } from './AuthProvider';
import { useChecklistVisibile } from './ChecklistHub';
import { Button } from './Button';

const CHIAVE = 'motogarage-tutorial-v1';

const PASSI = [
  {
    titolo: 'Traccia vs Naviga',
    testo:
      'Traccia registra il giro GPS reale — km, statistiche e card social. Naviga ti indica la strada verso una destinazione. Due funzioni diverse, entrambe in MotoGarage.',
    icona: '📍',
  },
  {
    titolo: 'Card social a fine giro',
    testo:
      'Al termine di un giro crei una card con tracciato, km e tempo — pronta per Instagram e TikTok, con didascalia già pronta da copiare.',
    icona: '📸',
  },
  {
    titolo: 'Avatar 3D nel garage',
    testo:
      'Carica una foto laterale della moto e ottieni l’avatar 3D nel tuo garage virtuale. La prima moto si genera subito; dalla seconda serve approvazione admin.',
    icona: '🏍️',
  },
  {
    titolo: 'Itinerari e community',
    testo:
      'Esplora itinerari verificati in Italia, condividi giri pubblici nel feed e confronta i km con la classifica dei rider.',
    icona: '🗺️',
  },
];

export default function TutorialPrimoAccesso() {
  const { user, profilo, loading } = useAuth();
  const profiloOk = Boolean(profilo?.username && profilo?.avatar_url);
  const checklistVisibile = useChecklistVisibile(user?.id, profiloOk);
  const [visibile, setVisibile] = useState(false);
  const [passo, setPasso] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined' || loading || !user) return;
    if (localStorage.getItem(CHIAVE)) return;
    if (checklistVisibile) return;

    const timer = window.setTimeout(() => setVisibile(true), 2200);
    return () => window.clearTimeout(timer);
  }, [loading, user, checklistVisibile]);

  function chiudiPermanente() {
    localStorage.setItem(CHIAVE, '1');
    setVisibile(false);
  }

  function avanti() {
    if (passo < PASSI.length - 1) {
      setPasso((p) => p + 1);
      return;
    }
    chiudiPermanente();
  }

  if (!visibile) return null;

  const step = PASSI[passo];
  const ultimo = passo === PASSI.length - 1;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/65 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tutorial-titolo"
    >
      <div className="w-full max-w-md rounded-app-lg border border-white/10 bg-asfalto p-6 text-cemento shadow-app-lg">
        <div className="flex items-start justify-between gap-4">
          <span className="text-3xl" aria-hidden="true">{step.icona}</span>
          <button
            type="button"
            onClick={chiudiPermanente}
            className="tap font-mono text-lg text-cemento/40 hover:text-cemento"
            aria-label="Chiudi tutorial"
          >
            ×
          </button>
        </div>

        <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.24em] text-brand">
          Benvenuto su MotoGarage · {passo + 1}/{PASSI.length}
        </p>
        <h2 id="tutorial-titolo" className="mt-2 font-display text-2xl font-black uppercase leading-tight tracking-tight text-white">
          {step.titolo}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-cemento/75">{step.testo}</p>

        <div className="mt-5 flex justify-center gap-2">
          {PASSI.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 w-6 rounded-full transition-colors ${i === passo ? 'bg-brand' : 'bg-white/15'}`}
            />
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center">
          {passo > 0 && (
            <Button variant="ghost" onClick={() => setPasso((p) => p - 1)}>
              Indietro
            </Button>
          )}
          <Button onClick={avanti} className="flex-1">
            {ultimo ? 'Ho capito' : 'Continua'}
          </Button>
        </div>

        <button
          type="button"
          onClick={chiudiPermanente}
          className="tap mt-3 w-full py-2 font-mono text-[10px] uppercase tracking-wide text-cemento/45 hover:text-cemento/70"
        >
          Non mostrare più
        </button>
      </div>
    </div>
  );
}
