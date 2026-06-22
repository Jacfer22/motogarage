'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { caricaClassificaKm, type RigaClassifica } from '@/lib/classifica';
import { ButtonLink } from '@/components/Button';

function iniziali(username: string) {
  return username.slice(0, 2).toUpperCase();
}

function medaglia(posizione: number) {
  if (posizione === 1) return '🥇';
  if (posizione === 2) return '🥈';
  if (posizione === 3) return '🥉';
  return null;
}

export default function ClassificaKm() {
  const [righe, setRighe] = useState<RigaClassifica[] | null>(null);
  const [errore, setErrore] = useState('');

  useEffect(() => {
    caricaClassificaKm(50).then(({ righe: dati, errore: messaggio }) => {
      setErrore(messaggio ?? '');
      setRighe(dati);
    });
  }, []);

  if (righe === null) {
    return (
      <div className="space-y-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton h-16 rounded-app" />
        ))}
      </div>
    );
  }

  if (righe.length === 0) {
    return (
      <div className="rounded-app-lg border border-dashed border-asfalto/25 bg-white/40 p-8 text-center dark:bg-carbone/40">
        <p className="font-display text-2xl font-bold uppercase tracking-tight text-asfalto/40">
          {errore ? 'Classifica non disponibile' : 'Nessun km in classifica'}
        </p>
        <p className="mt-2 text-sm text-asfalto/60">
          {errore || 'Traccia un giro con GPS: i km compariranno qui appena registrati.'}
        </p>
        {!errore && (
          <ButtonLink href="/traccia" className="mt-4">
            Traccia un giro
          </ButtonLink>
        )}
      </div>
    );
  }

  return (
    <ol className="space-y-2">
      {righe.map((riga, indice) => {
        const posizione = indice + 1;
        const icona = medaglia(posizione);
        return (
          <li key={riga.utente_id}>
            <Link
              href={`/profilo/${riga.username}`}
              className={`card-app flex items-center gap-3 p-4 transition-colors hover:border-brand/30 ${posizione <= 3 ? 'border-brand/20 bg-brand/5' : ''}`}
            >
              <span className="w-8 shrink-0 text-center font-display text-xl font-black text-asfalto/35">
                {icona ?? posizione}
              </span>
              {riga.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={riga.avatar_url} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover" />
              ) : (
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-asfalto font-display text-sm font-bold text-cemento">
                  {iniziali(riga.username)}
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate font-display text-lg font-bold uppercase">{riga.username}</span>
                <span className="font-mono text-[10px] uppercase text-asfalto/45">
                  {riga.giri_count} {riga.giri_count === 1 ? 'giro' : 'giri'}
                  {riga.moto ? ` · ${riga.moto}` : ''}
                </span>
              </span>
              <span className="shrink-0 text-right">
                <span className="block font-display text-2xl font-black leading-none text-brand">
                  {Math.round(riga.km_totali)}
                </span>
                <span className="font-mono text-[10px] uppercase text-asfalto/45">km</span>
              </span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
