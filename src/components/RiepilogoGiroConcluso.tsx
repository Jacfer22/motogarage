'use client';

import Link from 'next/link';
import { formattaDurata, formattaKm, statisticheGiro } from '@/lib/geo';
import type { GiroUtente } from '@/lib/giri-store';
import EditorCardGiro from '@/components/EditorCardGiro';

interface Props {
  giroConcluso: GiroUtente;
  distanzaM: number;
  durataSec: number;
  punti: { lat: number; lng: number }[];
  luogoCard: string;
  onLuogoCardChange: (v: string) => void;
  salvataggioCloud: boolean;
  loggato: boolean;
  onNomeChange: (nome: string) => void;
  onPubblicoChange?: (pubblico: boolean) => void;
  onElimina: () => void;
  onNuovoGiro: () => void;
  info?: string | null;
}

export default function RiepilogoGiroConcluso({
  giroConcluso,
  distanzaM,
  durataSec,
  punti,
  luogoCard,
  onLuogoCardChange,
  salvataggioCloud,
  loggato,
  onNomeChange,
  onPubblicoChange,
  onElimina,
  onNuovoGiro,
  info,
}: Props) {
  const stat = statisticheGiro(punti, durataSec, distanzaM);
  const stats = [
    { l: 'Vel. media', v: `${stat.velMediaKmh}`, u: 'km/h' },
    { l: 'Vel. max', v: `${stat.velMaxKmh}`, u: 'km/h' },
    { l: 'Curve', v: `${stat.curve}`, u: '' },
    { l: 'Dislivello', v: `${stat.dislivelloPositivoM}`, u: 'm' },
  ];

  return (
    <div className="mt-4 space-y-4 animate-scale-in">
      <div className="rounded-app-lg border border-white/10 bg-[#12151a] p-4 text-cemento shadow-app sm:p-5">
        {info && (
          <p className="mb-3 rounded-app border border-cartello/30 bg-cartello/10 px-3 py-2 text-sm text-cemento/85">
            {info}
          </p>
        )}
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-brand">Giro concluso</p>
        <h2 className="mt-1 font-display text-2xl font-black uppercase tracking-tight text-white">Registrato</h2>
        <p className="mt-1 font-mono text-xs uppercase tracking-wide text-cemento/50">
          {formattaKm(distanzaM)} km · {formattaDurata(durataSec)}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {stats.map((x) => (
            <div key={x.l} className="rounded-app border border-white/8 bg-white/[0.04] p-3 text-center">
              <p className="font-mono text-[9px] uppercase tracking-wide text-cemento/45">{x.l}</p>
              <p className="mt-0.5 font-display text-xl font-bold leading-none text-white">{x.v}</p>
              {x.u && <p className="font-mono text-[9px] uppercase text-cemento/40">{x.u}</p>}
            </div>
          ))}
        </div>

        <p className="mt-4 font-mono text-[10px] uppercase tracking-wide text-cemento/45">
          {salvataggioCloud
            ? 'Salvataggio nel cloud…'
            : giroConcluso.cloudId
              ? 'Salvato nel cloud'
              : loggato
                ? 'Salvato in locale'
                : 'Accedi per salvare nel cloud'}
        </p>

        <div className="mt-4">
          <label className="editor-card-label" htmlFor="nome-giro">Nome giro</label>
          <input
            id="nome-giro"
            type="text"
            value={luogoCard}
            onChange={(e) => onLuogoCardChange(e.target.value)}
            placeholder="Es. Passo dello Stelvio"
            maxLength={40}
            className="editor-card-input mt-2"
          />
        </div>
      </div>

      <EditorCardGiro
        giro={giroConcluso}
        onNomeChange={onNomeChange}
        onPubblicoChange={onPubblicoChange}
      />

      <div className="flex flex-wrap gap-2">
        <Link href="/giri" className="tap editor-card-btn-secondary">
          I miei giri
        </Link>
        <button
          type="button"
          onClick={onElimina}
          disabled={salvataggioCloud}
          className="tap rounded-app border border-red-500/35 bg-red-500/10 px-4 py-2.5 font-mono text-[10px] font-bold uppercase text-red-400 hover:bg-red-500/15 disabled:opacity-40"
        >
          Elimina giro
        </button>
        <button
          type="button"
          onClick={onNuovoGiro}
          className="tap px-2 py-2.5 font-mono text-[10px] uppercase tracking-wide text-cemento/50 underline hover:text-cemento"
        >
          Nuovo giro
        </button>
      </div>
    </div>
  );
}
