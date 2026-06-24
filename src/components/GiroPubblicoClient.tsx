'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { formattaDurata, formattaKmDisplay } from '@/lib/geo';
import type { GiroPubblico } from '@/lib/giri-public';
import { BRAND_DOMAIN } from '@/lib/brand-display';
import { scaricaGpx } from '@/lib/gpx-export';

const MappaTraccia = dynamic(() => import('@/components/MappaTraccia'), { ssr: false });

interface Props {
  giro: GiroPubblico;
}

export default function GiroPubblicoClient({ giro }: Props) {
  const data = new Date(giro.createdAt).toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-brand">Giro community</p>
      <h1 className="mt-1 font-display text-4xl font-black uppercase leading-none tracking-tight text-white">
        {giro.nome}
      </h1>
      <p className="mt-2 text-sm text-cemento/60">
        <Link href={`/profilo/${giro.autore}`} className="text-brand hover:underline">
          {giro.autore}
        </Link>
        {' · '}
        {data}
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { l: 'Distanza', v: formattaKmDisplay(giro.km), u: 'km' },
          { l: 'Durata', v: formattaDurata(giro.durataSec), u: '' },
          { l: 'Curve', v: String(giro.curve), u: '' },
          { l: 'Dislivello', v: String(giro.dislivelloM), u: 'm' },
        ].map((x) => (
          <div key={x.l} className="rounded-app border border-white/10 bg-white/[0.04] p-3">
            <p className="font-mono text-[9px] uppercase text-cemento/45">{x.l}</p>
            <p className="mt-1 font-display text-2xl font-black text-white">{x.v}</p>
            {x.u && <p className="font-mono text-[9px] uppercase text-cemento/40">{x.u}</p>}
          </div>
        ))}
      </div>

      {giro.punti.length > 1 && (
        <div className="mt-8">
          <p className="mb-2 font-mono text-[11px] uppercase tracking-wide text-cemento/55">Tracciato</p>
          <MappaTraccia punti={giro.punti} inCorso={false} />
        </div>
      )}

      <div className="mt-8 flex flex-col gap-2 sm:flex-row">
        {giro.punti.length > 1 && (
          <button
            type="button"
            onClick={() => scaricaGpx(giro.punti, giro.nome)}
            className="tap btn-primary flex-1"
          >
            Scarica GPX
          </button>
        )}
        <Link href="/traccia" className="tap editor-card-btn-secondary flex-1 text-center">
          Traccia il tuo giro
        </Link>
      </div>

      <p className="mt-8 text-center font-mono text-[10px] uppercase tracking-wide text-cemento/40">
        MotoGarage · {BRAND_DOMAIN}
      </p>
    </div>
  );
}
