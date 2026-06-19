'use client';

import { useEffect, useMemo, useState } from 'react';

const FASI = [
  { fino: 10, label: 'Analisi moto' },
  { fino: 28, label: 'Ricostruzione viste mancanti' },
  { fino: 48, label: 'Ricostruzione geometria' },
  { fino: 65, label: 'Generazione mesh' },
  { fino: 82, label: 'Applicazione texture' },
  { fino: 95, label: 'Ottimizzazione' },
  { fino: 99, label: 'Salvataggio' },
  { fino: 100, label: 'Gemello digitale pronto' },
];

function faseAttuale(percentuale: number) {
  return FASI.find((fase) => percentuale <= fase.fino)?.label ?? FASI[FASI.length - 1].label;
}

function simulata(reale: number | null, secondi: number) {
  if (reale !== null && reale >= 100) return 100;
  const valore = secondi < 8
    ? secondi * 2
    : secondi < 45
      ? 16 + (secondi - 8) * 1.05
      : secondi < 180
        ? 55 + (secondi - 45) * 0.24
        : 88 + Math.min(7, (secondi - 180) * 0.025);
  return Math.min(95, Math.max(reale ?? 0, Math.round(valore)));
}

interface Props {
  marca: string;
  modello: string;
  anno?: number | null;
  percentualeReale?: number | null;
  completato?: boolean;
  errore?: string | null;
  onApriGarage?: () => void;
}

export default function GenerazioneProgress({
  marca,
  modello,
  anno,
  percentualeReale = null,
  completato = false,
  errore = null,
  onApriGarage,
}: Props) {
  const [secondi, setSecondi] = useState(0);
  const [percentuale, setPercentuale] = useState(0);

  useEffect(() => {
    if (completato) {
      setPercentuale(100);
      return;
    }
    const timer = window.setInterval(() => {
      setSecondi((value) => {
        const prossimo = value + 1;
        setPercentuale(simulata(percentualeReale, prossimo));
        return prossimo;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [completato, percentualeReale]);

  const posizioneMoto = useMemo(() => Math.min(91, Math.max(5, percentuale * 0.88 + 5)), [percentuale]);
  const nome = `${marca} ${modello}${anno ? ` · ${anno}` : ''}`;

  if (completato) {
    return (
      <main className="grid min-h-[100dvh] place-items-center bg-[radial-gradient(circle_at_top,rgba(220,38,38,0.24),transparent_34%),linear-gradient(135deg,#030405,#15181a)] px-4 py-12 text-center text-cemento">
        <div className="w-full max-w-xl rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-[0_30px_100px_rgba(0,0,0,0.48)] backdrop-blur">
          <div className="mx-auto grid h-24 w-24 place-items-center rounded-[28px] border border-red-400/30 bg-red-600 text-5xl shadow-[0_0_44px_rgba(220,38,38,0.42)]">🏁</div>
          <p className="mt-7 font-mono text-xs uppercase tracking-[0.28em] text-red-400">MotoGarage</p>
          <h1 className="mt-3 font-display text-5xl font-black uppercase leading-none tracking-tight">La tua moto è pronta</h1>
          <p className="mt-4 text-cemento/65">Il gemello digitale di <strong className="text-white">{nome}</strong> è stato inserito nel tuo garage.</p>
          <button type="button" onClick={onApriGarage} className="tap mt-8 rounded-app bg-red-600 px-8 py-4 font-mono text-sm font-bold uppercase tracking-wide text-white hover:bg-white hover:text-asfalto">
            Apri nel mio Garage
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] bg-[radial-gradient(circle_at_top_left,rgba(220,38,38,0.18),transparent_30%),linear-gradient(135deg,#f5f5f6,#e7e8ea)] px-4 py-10 dark:from-notte dark:to-carbone">
      <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
        <p className="font-mono text-sm uppercase tracking-[0.34em] text-red-600 dark:text-red-400">Laboratorio digitale</p>
        <h1 className="mt-7 max-w-3xl font-display text-4xl font-black uppercase leading-none tracking-tight sm:text-6xl">
          Stiamo creando il gemello digitale della tua moto
        </h1>
        <p className="mt-5 max-w-xl text-sm leading-6 text-asfalto/55 sm:text-base dark:text-cemento/55">
          Può richiedere qualche minuto. Puoi chiudere l&apos;app e tornare più tardi.
        </p>
        <p className="mt-2 font-mono text-xs uppercase tracking-wide text-asfalto/35 dark:text-cemento/35">{nome}</p>

        <section className="mt-10 w-full overflow-hidden rounded-[32px] border border-white/15 bg-[#090b0e] shadow-[0_28px_90px_rgba(21,24,26,0.28)]">
          <div className="relative h-64 sm:h-72">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(220,38,38,0.18),transparent_30%),linear-gradient(180deg,#15181a,#07080a)]" />
            <div className="absolute inset-x-0 bottom-0 h-28 bg-[#101217]" />
            <div className="absolute inset-x-8 bottom-14 flex justify-between overflow-hidden">
              {[0, 1, 2, 3, 4, 5].map((indice) => (
                <span key={indice} className="h-2 w-14 rounded-full bg-white/35" style={{ animation: `motogarage-road 1s ${indice * -0.14}s linear infinite` }} />
              ))}
            </div>
            <div className="absolute bottom-20 transition-all duration-1000 ease-linear" style={{ left: `${posizioneMoto}%`, transform: 'translateX(-50%)' }}>
              <div className="relative">
                <div className="absolute inset-x-0 bottom-0 h-5 rounded-full bg-red-500/35 blur-xl" />
                <div className="text-5xl drop-shadow-[0_0_18px_rgba(239,68,68,0.58)]">🏍️</div>
              </div>
            </div>
            <div className="absolute bottom-16 right-5 text-5xl">🏁</div>
            <div className="absolute left-5 top-5 rounded-full border border-white/10 bg-black/35 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-cemento/55">
              Elaborazione sicura lato server
            </div>
          </div>
        </section>

        <section className="mt-7 w-full max-w-2xl">
          <div className="mb-3 flex items-end justify-between gap-4">
            <span className="text-left font-mono text-xs uppercase tracking-wide text-asfalto/50 dark:text-cemento/50">{faseAttuale(percentuale)}</span>
            <span className="font-display text-4xl font-black text-red-600 dark:text-red-400">{percentuale}%</span>
          </div>
          <div className="h-4 overflow-hidden rounded-full bg-asfalto/15 shadow-inner dark:bg-white/10">
            <div className="h-full rounded-full bg-red-600 transition-all duration-1000 ease-out shadow-[0_0_24px_rgba(220,38,38,0.45)]" style={{ width: `${percentuale}%` }} />
          </div>
          {errore && <p role="alert" className="mt-5 rounded-app border border-red-500/30 bg-red-500/10 p-4 text-left text-sm text-red-700 dark:text-red-300">{errore}</p>}
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
