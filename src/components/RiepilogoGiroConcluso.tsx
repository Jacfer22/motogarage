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
    <div className="mt-4 rounded-app-lg border border-segnale bg-white p-5 shadow-app animate-scale-in">
      {info && (
        <p className="mb-3 rounded-app border border-cartello/30 bg-cartello/10 px-3 py-2 text-sm text-asfalto/80">
          {info}
        </p>
      )}
      <h2 className="font-display text-2xl font-bold uppercase tracking-tight">Giro registrato</h2>
      <p className="mt-1 text-asfalto/70">
        {formattaKm(distanzaM)} km in {formattaDurata(durataSec)}.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((x) => (
          <div key={x.l} className="rounded-app bg-cemento p-3 text-center">
            <p className="font-mono text-[10px] uppercase tracking-wide text-asfalto/50">{x.l}</p>
            <p className="mt-0.5 font-display text-2xl font-bold leading-none">{x.v}</p>
            {x.u && <p className="font-mono text-[10px] uppercase text-asfalto/40">{x.u}</p>}
          </div>
        ))}
      </div>

      <p className="mt-4 font-mono text-xs uppercase tracking-wide text-asfalto/50">
        {salvataggioCloud
          ? 'Salvataggio nel cloud…'
          : giroConcluso.cloudId
            ? '✓ Salvato nel cloud'
            : loggato
              ? 'Salvato in locale'
              : 'Accedi per salvare nel cloud'}
      </p>

      <div className="mt-4">
        <p className="mb-1.5 font-mono text-[11px] uppercase tracking-wide text-asfalto/40">Nome giro (opzionale)</p>
        <input
          type="text"
          value={luogoCard}
          onChange={(e) => onLuogoCardChange(e.target.value)}
          placeholder="Es. Passo dello Stelvio"
          maxLength={40}
          className="input-app w-full"
        />
      </div>

      <div className="mt-4">
        <EditorCardGiro
          giro={giroConcluso}
          onNomeChange={onNomeChange}
          onPubblicoChange={onPubblicoChange}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href="/giri"
          className="rounded-app border border-asfalto/15 px-4 py-2.5 font-mono text-xs font-bold uppercase hover:border-brand hover:text-brand"
        >
          I miei giri
        </Link>
        <button
          type="button"
          onClick={onElimina}
          disabled={salvataggioCloud}
          className="rounded-app border border-red-500/35 bg-red-500/10 px-4 py-2.5 font-mono text-xs font-bold uppercase text-red-600 hover:bg-red-500/15 disabled:opacity-40"
        >
          Elimina giro
        </button>
        <button
          type="button"
          onClick={onNuovoGiro}
          className="font-mono text-xs uppercase text-asfalto/60 underline hover:text-asfalto"
        >
          Nuovo giro
        </button>
      </div>
    </div>
  );
}
