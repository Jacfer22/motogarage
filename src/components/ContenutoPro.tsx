'use client';

import Link from 'next/link';
import { useAuth } from './AuthProvider';
import type { ProExtra } from '@/lib/types';

interface Props {
  isPremium: boolean;
  proExtra: ProExtra | null | undefined;
  gpxUrl: string | null;
}

export default function ContenutoPro({ isPremium, proExtra, gpxUrl }: Props) {
  const { profilo, loading, nonConfigurato, user } = useAuth();
  const sbloccato = nonConfigurato || Boolean(profilo?.is_pro);

  if (isPremium && !sbloccato) {
    return (
      <>
        <section className="mt-10 border-2 border-segnale bg-white">
          <div className="flex items-center gap-2 border-b-2 border-segnale bg-asfalto px-4 py-2">
            <span className="bg-segnale px-2 py-0.5 font-mono text-xs font-medium uppercase text-asfalto">Pro</span>
            <span className="font-mono text-xs uppercase tracking-wide text-guardrail">Contenuti riservati</span>
          </div>
          <div className="p-5">
            <h3 className="font-display text-2xl font-bold uppercase tracking-tight">Variante del percorso e pacchetto weekend</h3>
            <p className="mt-1 text-asfalto/85">Questo itinerario include una variante e un pacchetto weekend con orari, soste e pernottamenti, riservati agli iscritti Pro.</p>
          </div>
        </section>

        <section className="mt-10 border-2 border-asfalto bg-asfalto p-6 text-cemento">
          <h2 className="font-display text-3xl font-bold uppercase tracking-tight">Traccia GPX</h2>
          <p className="mt-2 text-guardrail">GPX, varianti del percorso e pacchetto weekend sono riservati agli iscritti Pro.</p>
          <Link href="/pro" className="mt-4 inline-block bg-segnale px-5 py-2.5 font-mono font-medium uppercase text-asfalto hover:bg-white">Sblocca con Pro</Link>
          {!loading && !nonConfigurato && !user && (
            <p className="mt-3 font-mono text-xs text-guardrail">
              Hai già un account Pro? <Link href="/accedi" className="underline">Accedi</Link>.
            </p>
          )}
        </section>
      </>
    );
  }

  return (
    <>
      {isPremium && proExtra && (
        <section className="mt-10 border-2 border-segnale bg-white">
          <div className="flex items-center gap-2 border-b-2 border-segnale bg-asfalto px-4 py-2">
            <span className="bg-segnale px-2 py-0.5 font-mono text-xs font-medium uppercase text-asfalto">Pro</span>
            <span className="font-mono text-xs uppercase tracking-wide text-guardrail">Contenuti riservati — sbloccati</span>
          </div>
          <div className="space-y-5 p-5">
            <div>
              <h3 className="font-display text-2xl font-bold uppercase tracking-tight">Variante del percorso</h3>
              <p className="mt-1 text-asfalto/85">{proExtra.variante}</p>
            </div>
            <div>
              <h3 className="font-display text-2xl font-bold uppercase tracking-tight">Pacchetto weekend</h3>
              <p className="mt-1 text-asfalto/85">{proExtra.weekend}</p>
            </div>
          </div>
        </section>
      )}

      <section className="mt-10 border-2 border-asfalto bg-asfalto p-6 text-cemento">
        <h2 className="font-display text-3xl font-bold uppercase tracking-tight">Traccia GPX</h2>
        {gpxUrl ? (
          <>
            <p className="mt-2 text-guardrail">Percorso proposto da MotoGarage: scaricalo e caricalo sul navigatore o sull’app che usi.</p>
            <a href={gpxUrl} download className="mt-4 inline-block bg-segnale px-5 py-2.5 font-mono font-medium uppercase text-asfalto hover:bg-white">Scarica GPX</a>
          </>
        ) : (
          <p className="mt-2 font-mono text-sm text-guardrail">GPX in arrivo per questo itinerario.</p>
        )}
      </section>
    </>
  );
}
