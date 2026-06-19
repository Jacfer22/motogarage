'use client';

import { useEffect, useMemo, useState } from 'react';

const FASI = [
  { fino: 8, label: 'Caricamento immagini' },
  { fino: 18, label: 'Analisi profilo moto' },
  { fino: 32, label: 'Ricostruzione viste mancanti' },
  { fino: 48, label: 'Generazione geometria' },
  { fino: 62, label: 'Creazione mesh 3D' },
  { fino: 78, label: 'Applicazione texture' },
  { fino: 90, label: 'Ottimizzazione modello' },
  { fino: 98, label: 'Salvataggio nel Garage' },
  { fino: 100, label: 'Gemello digitale pronto' },
];

function faseAttuale(pct: number) {
  return FASI.find((fase) => pct <= fase.fino)?.label ?? FASI[FASI.length - 1].label;
}

function percentualeSimulata(reale: number | null, secondi: number): number {
  if (reale !== null && reale >= 100) return 100;

  const simulata =
    secondi < 5 ? secondi * 4 :
    secondi < 30 ? 20 + (secondi - 5) * 1.2 :
    secondi < 90 ? 50 + (secondi - 30) * 0.65 :
    90 + Math.min(5, (secondi - 90) * 0.05);

  return Math.min(95, Math.max(reale ?? 0, Math.round(simulata)));
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
    if (completato) {
      setPct(100);
      return;
    }

    const interval = setInterval(() => {
      setSecondi((attuale) => {
        const prossimo = attuale + 1;
        setPct(percentualeSimulata(percentualeReale ?? null, prossimo));
        return prossimo;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [completato, percentualeReale]);

  const motoX = useMemo(() => Math.min(91, Math.max(6, pct * 0.88 + 5)), [pct]);
  const nome = `${marca} ${modello}${anno ? ` ${anno}` : ''}`.trim();

  if (completato) {
    return (
      <main className="grid min-h-[100dvh] place-items-center bg-[radial-gradient(circle_at_top,rgba(242,183,5,0.24),transparent_32%),linear-gradient(135deg,#050608,#15181a)] px-4 py-12 text-center text-cemento">
        <div className="w-full max-w-xl rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-[0_30px_100px_rgba(0,0,0,0.45)] backdrop-blur">
          <div className="mx-auto mb-6 grid h-24 w-24 place-items-center rounded-[28px] bg-segnale text-5xl shadow-segnale">🏁</div>
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-segnale">MotoGarage</p>
          <h1 className="mt-3 font-display text-5xl font-black uppercase leading-none tracking-tight">La tua moto è pronta</h1>
          <p className="mt-4 text-cemento/65">Il gemello digitale di <strong className="text-segnale">{nome}</strong> è stato salvato nel tuo garage.</p>
          <button type="button" onClick={onApriGarage} className="tap mt-8 rounded-app bg-segnale px-8 py-4 font-mono text-sm font-bold uppercase tracking-wide text-asfalto shadow-segnale hover:bg-white">
            Apri nel mio Garage
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] bg-[radial-gradient(circle_at_top_left,rgba(242,183,5,0.22),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(220,38,38,0.20),transparent_28%),linear-gradient(135deg,#f4f4f5,#e7e8ea)] px-4 py-10 dark:from-notte dark:to-carbone">
      <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
        <p className="font-mono text-sm uppercase tracking-[0.34em] text-segnale">Gemello digitale in creazione</p>
        <h1 className="mt-8 font-display text-4xl font-black uppercase leading-none tracking-tight text-asfalto sm:text-6xl dark:text-cemento">
          {nome}
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-asfalto/45 sm:text-base dark:text-cemento/55">
          Può richiedere qualche minuto. Puoi chiudere l'app e tornare più tardi: il modello verrà salvato automaticamente nel Garage.
        </p>

        <section className="mt-10 w-full overflow-hidden rounded-[32px] border border-white/20 bg-[#0b0d10] shadow-[0_28px_90px_rgba(21,24,26,0.25)]">
          <div className="relative h-64 sm:h-72">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_16%,rgba(242,183,5,0.16),transparent_28%),linear-gradient(180deg,#15181a,#07080a)]" />
            <div className="absolute inset-x-0 bottom-0 h-28 bg-[#111318]" />
            <div className="absolute inset-x-0 bottom-16 h-1 bg-segnale/25" />
            <div className="absolute inset-x-8 bottom-14 flex justify-between overflow-hidden">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <span key={i} className="h-2 w-14 rounded-full bg-segnale/55" style={{ animation: `motogarage-road 1s ${i * -0.14}s linear infinite` }} />
              ))}
            </div>
            <div className="absolute bottom-20 transition-all duration-1000 ease-linear" style={{ left: `${motoX}%`, transform: 'translateX(-50%)' }}>
              <div className="relative">
                <div className="absolute inset-x-0 bottom-0 h-5 rounded-full bg-segnale/25 blur-xl" />
                <div className="text-5xl drop-shadow-[0_0_18px_rgba(242,183,5,0.55)]">🏍️</div>
              </div>
            </div>
            <div className="absolute bottom-16 right-5 text-5xl">🏁</div>
            <div className="absolute left-6 top-6 rounded-full border border-white/10 bg-white/5 px-4 py-2 font-mono text-xs uppercase tracking-[0.22em] text-cemento/60">
              Powered by Hunyuan3D · HuggingFace
            </div>
          </div>
        </section>

        <section className="mt-7 w-full max-w-2xl">
          <div className="mb-3 flex items-end justify-between gap-4">
            <span className="text-left font-mono text-xs uppercase tracking-wide text-asfalto/45 dark:text-cemento/45">{faseAttuale(pct)}</span>
            <span className="font-display text-4xl font-black text-segnale">{pct}%</span>
          </div>
          <div className="h-4 overflow-hidden rounded-full bg-asfalto/15 shadow-inner dark:bg-white/10">
            <div className="h-full rounded-full bg-segnale transition-all duration-1000 ease-out shadow-segnale" style={{ width: `${pct}%` }} />
          </div>
        </section>
      </div>

      <style>{`
        @keyframes motogarage-road {
          from { transform: translateX(0); }
          to { transform: translateX(-220%); }
        }
      `}</style>
    </main>
  );
}
