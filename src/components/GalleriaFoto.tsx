'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Foto } from '@/lib/types';

function formattaData(iso: string): string {
  return new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
}

export default function GalleriaFoto({
  foto,
  mostraItinerario = false,
}: {
  foto: Foto[];
  mostraItinerario?: boolean;
}) {
  const [aperta, setAperta] = useState<Foto | null>(null);

  if (foto.length === 0) {
    return (
      <div className="rounded-app border border-dashed border-asfalto/25 bg-white/40 p-8 text-center">
        <p className="font-display text-2xl font-bold uppercase tracking-tight text-asfalto/35">
          Ancora nessuna foto
        </p>
        <p className="mt-1 text-sm text-asfalto/55">
          Le prime foto di questo giro le scatti tu. Carica la tua.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="columns-2 gap-3 sm:columns-3 lg:columns-4 [&>*]:mb-3">
        {foto.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setAperta(f)}
            className="tap group block w-full overflow-hidden rounded-app border border-asfalto/10 bg-white shadow-app-sm"
          >
            <div className="relative overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={f.url}
                alt={f.didascalia ?? 'Foto di un biker'}
                loading="lazy"
                className="w-full transition-transform duration-500 ease-app group-hover:scale-[1.04]"
              />
            </div>
            {(f.didascalia || f.autore?.username) && (
              <div className="px-3 py-2 text-left">
                {f.didascalia && (
                  <p className="line-clamp-2 text-sm text-asfalto/80">{f.didascalia}</p>
                )}
                <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wide text-asfalto/45">
                  {f.autore?.username ?? 'biker'} · {formattaData(f.created_at)}
                </p>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {aperta && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-notte/90 p-4 backdrop-blur-sm animate-scale-in"
          onClick={() => setAperta(null)}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={() => setAperta(null)}
            className="tap absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 font-mono text-lg text-cemento hover:bg-white/20"
            aria-label="Chiudi"
          >
            ✕
          </button>
          <div className="max-h-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={aperta.url}
              alt={aperta.didascalia ?? 'Foto di un biker'}
              className="max-h-[78vh] w-auto rounded-app"
            />
            <div className="mt-3 text-cemento">
              {aperta.didascalia && <p className="text-lg">{aperta.didascalia}</p>}
              <p className="mt-1 font-mono text-xs uppercase tracking-wide text-guardrail">
                {aperta.autore?.username ?? 'biker'} · {formattaData(aperta.created_at)}
                {mostraItinerario && aperta.itinerario && (
                  <>
                    {' · '}
                    <Link href={`/itinerari/${aperta.itinerario.slug}`} className="text-segnale underline">
                      {aperta.itinerario.titolo}
                    </Link>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
