'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/components/AuthProvider';
import { etichettaCategoria } from '@/lib/categorie-moto';

const AZIONI = [
  {
    href: '/#itinerari',
    ancora: true,
    titolo: 'Itinerari',
    sotto: '10 giri curati nel Lazio, con mappa, roadbook e GPX',
    colore: 'bg-asfalto text-cemento',
    span: 'col-span-2',
  },
  {
    href: '/account',
    titolo: 'Il tuo profilo',
    sotto: 'Foto, username, tipo di moto',
    colore: 'bg-segnale text-asfalto',
    span: 'col-span-1',
  },
  {
    href: '/blog',
    titolo: 'Blog',
    sotto: 'Strade e storie da chi guida davvero',
    colore: 'bg-white border-2 border-asfalto text-asfalto',
    span: 'col-span-1',
  },
  {
    href: '/pro',
    titolo: 'Piano Pro',
    sotto: 'GPX, varianti, pacchetti weekend — tutto sbloccato',
    colore: 'bg-white border-2 border-asfalto text-asfalto',
    span: 'col-span-1',
    soloFree: true,
  },
  {
    href: '/admin',
    titolo: 'Pannello admin',
    sotto: 'Avvisi, utenti Pro, aggiornamenti strade in tempo reale',
    colore: 'bg-cartello text-cemento',
    span: 'col-span-1',
    soloAdmin: true,
  },
];

export default function PaginaHub() {
  const { user, profilo, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = '/accedi';
    }
  }, [loading, user]);

  if (loading || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="mezzeria w-32" />
      </div>
    );
  }

  const isPro = !!profilo?.is_pro || !!profilo?.is_admin;
  const isAdmin = !!profilo?.is_admin;
  const categoria = etichettaCategoria(profilo?.categoria_moto ?? null);

  const azioni = AZIONI.filter((a) => {
    if (a.soloAdmin && !isAdmin) return false;
    if (a.soloFree && isPro) return false;
    return true;
  });

  return (
    <div className="min-h-[80vh]">
      {/* Banner benvenuto */}
      <section className="bg-asfalto text-cemento">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between">
          {/* Avatar + info */}
          <div className="flex items-center gap-5">
            <div className="relative shrink-0">
              {profilo?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profilo.avatar_url}
                  alt=""
                  className="h-20 w-20 border-2 border-segnale object-cover sm:h-24 sm:w-24"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center border-2 border-segnale bg-asfalto sm:h-24 sm:w-24">
                  <Image src="/icon-bike.png" alt="" width={52} height={52} className="opacity-80" />
                </div>
              )}
              {isAdmin && (
                <span className="absolute -bottom-2 -right-2 bg-cartello px-1.5 py-0.5 font-mono text-[10px] uppercase text-cemento">
                  admin
                </span>
              )}
              {!isAdmin && isPro && (
                <span className="absolute -bottom-2 -right-2 bg-segnale px-1.5 py-0.5 font-mono text-[10px] uppercase text-asfalto">
                  pro
                </span>
              )}
            </div>
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-guardrail">
                Bentornato
              </p>
              <h1 className="font-display text-4xl font-bold uppercase leading-none tracking-tight sm:text-5xl">
                {profilo?.username ?? 'Motociclista'}
              </h1>
              {(categoria || profilo?.moto) && (
                <p className="mt-1 font-mono text-sm text-guardrail">
                  {[categoria, profilo?.moto].filter(Boolean).join(' · ')}
                </p>
              )}
              {!profilo?.username && (
                <Link
                  href="/account"
                  className="mt-2 inline-block font-mono text-xs uppercase text-segnale underline"
                >
                  Scegli un username →
                </Link>
              )}
            </div>
          </div>

          {/* Stato abbonamento */}
          <div className="shrink-0 border-2 border-guardrail/20 p-4 sm:text-right">
            <p className="font-mono text-xs uppercase text-guardrail">Stato account</p>
            {isAdmin ? (
              <p className="mt-1 font-display text-xl font-bold uppercase text-cartello">
                Admin · tutto sbloccato
              </p>
            ) : isPro ? (
              <p className="mt-1 font-display text-xl font-bold uppercase text-segnale">
                Pro attivo
              </p>
            ) : (
              <>
                <p className="mt-1 font-display text-xl font-bold uppercase text-cemento">
                  Account free
                </p>
                <Link
                  href="/pro"
                  className="mt-2 inline-block bg-segnale px-3 py-1.5 font-mono text-xs font-medium uppercase text-asfalto hover:bg-white"
                >
                  Passa a Pro →
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="mezzeria mezzeria-animata" aria-hidden="true" />
      </section>

      {/* Griglia azioni */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <p className="font-mono text-xs uppercase tracking-widest text-asfalto/40">
          Cosa vuoi fare?
        </p>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {azioni.map((a) => {
            const contenuto = (
              <>
                <h2 className="font-display text-3xl font-bold uppercase leading-tight tracking-tight sm:text-4xl">
                  {a.titolo}
                </h2>
                <p className="mt-2 text-sm opacity-75">{a.sotto}</p>
                <span className="mt-4 block font-mono text-xs uppercase tracking-wide opacity-60">
                  Vai →
                </span>
              </>
            );

            const cls = `${a.span ?? 'col-span-1'} ${a.colore} flex flex-col p-5 transition-opacity hover:opacity-90`;

            return a.ancora ? (
              <a key={a.titolo} href={a.href} className={cls}>
                {contenuto}
              </a>
            ) : (
              <Link key={a.titolo} href={a.href} className={cls}>
                {contenuto}
              </Link>
            );
          })}

          {/* Tile "Card del giro" coming soon */}
          <div className="col-span-1 flex flex-col border-2 border-dashed border-asfalto/20 p-5 text-asfalto/30">
            <h2 className="font-display text-3xl font-bold uppercase leading-tight tracking-tight sm:text-4xl">
              Card del giro
            </h2>
            <p className="mt-2 text-sm">
              Genera la card da condividere su TikTok e Instagram
            </p>
            <span className="mt-4 block font-mono text-xs uppercase tracking-wide">
              In arrivo
            </span>
          </div>
        </div>
      </section>

      {/* Avviso strade attivo */}
      <section className="mx-auto max-w-6xl px-4 pb-10">
        <div className="border-2 border-cartello bg-cartello/10 p-5">
          <p className="font-mono text-xs uppercase tracking-wide text-cartello">
            🚧 Avviso strade attivo
          </p>
          <p className="mt-1 font-medium">
            Senso unico alternato sulla Braccianese Claudia ad Allumiere (km 31+650)
          </p>
          <p className="mt-1 text-sm text-asfalto/70">
            Lavori di messa in sicurezza, partiti il 24 febbraio 2026 — possibile ancora attivo.
            Verifica su Luceverde Lazio prima di partire.
          </p>
          <Link
            href="/itinerari/monti-della-tolfa"
            className="mt-3 inline-block font-mono text-xs uppercase underline hover:text-cartello"
          >
            Vedi itinerario Monti della Tolfa →
          </Link>
        </div>
      </section>
    </div>
  );
}
