'use client';

import { useEffect, useState } from 'react';

const FASI = [
  { fino: 8,  label: 'Caricamento immagini…' },
  { fino: 18, label: 'Analisi moto…' },
  { fino: 32, label: 'Ricostruzione geometria…' },
  { fino: 48, label: 'Generazione parti mancanti…' },
  { fino: 62, label: 'Creazione mesh 3D…' },
  { fino: 78, label: 'Applicazione texture…' },
  { fino: 90, label: 'Ottimizzazione modello…' },
  { fino: 98, label: 'Salvataggio nel Garage…' },
  { fino: 100, label: 'Il tuo gemello è pronto!' },
];

function faseAttuale(pct: number) {
  return FASI.find(f => pct <= f.fino)?.label ?? FASI[FASI.length - 1].label;
}

// Progressione credibile anche senza % reale dal backend
function percentualeSimulata(reale: number | null, tempo: number): number {
  if (reale !== null && reale >= 100) return 100;
  // Salita rapida fino a 20%, poi lenta fino a 90%, si ferma a 95% in attesa conferma
  const base = reale ?? 0;
  const sim = tempo < 5 ? Math.min(20, tempo * 4) :
    tempo < 30 ? 20 + (tempo - 5) * 1.2 :
    tempo < 90 ? 50 + (tempo - 30) * 0.65 : 90;
  return Math.min(95, Math.max(base, Math.round(sim)));
}

interface Props {
  marca: string;
  modello: string;
  anno?: number | null;
  percentualeReale?: number | null;
  completato?: boolean;
  onApriGarage?: () => void;
}

export default function GenerazioneProgress({ marca, modello, anno, percentualeReale, completato, onApriGarage }: Props) {
  const [secondi, setSecondi] = useState(0);
  const [pct, setPct] = useState(0);

  useEffect(() => {
    if (completato) { setPct(100); return; }
    const iv = setInterval(() => {
      setSecondi(s => {
        const ns = s + 1;
        setPct(percentualeSimulata(percentualeReale ?? null, ns));
        return ns;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [completato, percentualeReale]);

  // Posizione moto sulla strada: 0% = sinistra, 100% = destra
  const motoX = Math.min(88, Math.max(4, pct * 0.88));

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-12 text-center">
      {completato ? (
        <>
          {/* Traguardo */}
          <div className="mb-6 text-7xl animate-bounce">🏁</div>
          <h2 className="font-display text-4xl font-bold uppercase tracking-tight text-cemento sm:text-5xl">
            La tua moto è pronta
          </h2>
          <p className="mt-3 text-guardrail">
            Il gemello digitale di <strong className="text-segnale">{marca} {modello}</strong> è nel tuo garage.
          </p>
          <button
            type="button"
            onClick={onApriGarage}
            className="tap mt-8 rounded-app bg-segnale px-8 py-4 font-mono font-medium uppercase tracking-wide text-asfalto shadow-segnale hover:bg-white"
          >
            Apri nel mio Garage
          </button>
        </>
      ) : (
        <>
          <p className="font-mono text-sm uppercase tracking-[0.2em] text-segnale mb-2">
            Gemello digitale in creazione
          </p>
          <h2 className="font-display text-3xl font-bold uppercase tracking-tight text-cemento sm:text-4xl">
            Stiamo costruendo la tua<br/>
            <span className="text-segnale">{marca} {modello}{anno ? ` ${anno}` : ''}</span>
          </h2>
          <p className="mt-3 max-w-sm text-sm text-guardrail">
            Può richiedere qualche minuto. Puoi chiudere l'app e tornare più tardi: il modello verrà salvato automaticamente.
          </p>

          {/* Animazione strada con moto */}
          <div className="relative mt-10 w-full max-w-md overflow-hidden rounded-app-lg bg-asfalto" style={{ height: 120 }}>
            {/* Strada */}
            <div className="absolute inset-x-0 bottom-0 h-16 bg-[#1a1a1a]"/>
            {/* Linee strada animate */}
            <div className="absolute bottom-6 inset-x-0 flex justify-around overflow-hidden">
              {[0,1,2,3,4,5,6].map(i => (
                <div key={i} className="h-1 w-8 rounded bg-segnale/60" style={{
                  animation: `slide-left 1s ${i * -0.14}s linear infinite`,
                }}/>
              ))}
            </div>
            {/* Moto (emoji scalabile sulla strada) */}
            <div
              className="absolute bottom-5 transition-all duration-1000 ease-linear text-3xl"
              style={{ left: `${motoX}%`, transform: 'translateX(-50%)' }}
            >
              🏍️
            </div>
            {/* Traguardo */}
            <div className="absolute right-2 bottom-4 text-2xl">🏁</div>
          </div>

          {/* Barra progresso */}
          <div className="mt-6 w-full max-w-md">
            <div className="flex justify-between mb-2">
              <span className="font-mono text-xs uppercase text-guardrail">{faseAttuale(pct)}</span>
              <span className="font-mono text-xs font-medium text-segnale">{pct}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-asfalto overflow-hidden">
              <div
                className="h-full rounded-full bg-segnale transition-all duration-1000 ease-out"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          <p className="mt-4 font-mono text-xs text-guardrail/50 uppercase tracking-wide">
            Powered by Hunyuan3D · HuggingFace
          </p>
        </>
      )}

      <style>{`
        @keyframes slide-left {
          from { transform: translateX(0); }
          to { transform: translateX(-200%); }
        }
      `}</style>
    </div>
  );
}
