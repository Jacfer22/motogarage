'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from './AuthProvider';

interface Tile {
  href: string;
  titolo: string;
  sotto: string;
  icona: string;
  evidenza?: boolean;
  solo?: 'loggato' | 'admin' | 'pro';
}

const TILES: Tile[] = [
  {
    href: '/#itinerari',
    titolo: 'Itinerari',
    sotto: '10 giri curati nel Lazio, con mappa e roadbook',
    icona: '🗺️',
  },
  {
    href: '/blog',
    titolo: 'Blog',
    sotto: 'Strade, moto e storie da chi guida davvero',
    icona: '📖',
  },
  {
    href: '/account',
    titolo: 'Il tuo profilo',
    sotto: 'Scegli username, tipo di moto e foto',
    icona: '👤',
    solo: 'loggato',
    evidenza: true,
  },
  {
    href: '/traccia',
    titolo: 'Traccia un giro',
    sotto: 'Registra il percorso via GPS e crea la card da condividere',
    icona: '📱',
    solo: 'loggato',
  },
  {
    href: '/pro',
    titolo: 'Passa a Pro',
    sotto: 'GPX, varianti, pacchetto weekend — tutto sbloccato',
    icona: '⚡',
    evidenza: true,
  },
  {
    href: '/admin',
    titolo: 'Pannello admin',
    sotto: 'Avvisi, utenti Pro, aggiornamenti strade',
    icona: '🛠️',
    solo: 'admin',
  },
];

export default function HubNavigazione() {
  const { user, profilo, loading } = useAuth();

  if (loading) return null;

  const loggato = !!user;
  const isPro = !!profilo?.is_pro || !!profilo?.is_admin;
  const isAdmin = !!profilo?.is_admin;

  const tiles = TILES.filter((t) => {
    if (t.solo === 'loggato' && !loggato) return false;
    if (t.solo === 'admin' && !isAdmin) return false;
    if (t.solo === 'pro' && !isPro) return false;
    // Nascondi "Passa a Pro" se già Pro o Admin
    if (t.href === '/pro' && isPro) return false;
    return true;
  });

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      {loggato && (
        <div className="mb-8 flex items-center gap-4">
          {profilo?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profilo.avatar_url}
              alt=""
              className="h-14 w-14 border-2 border-segnale object-cover"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center border-2 border-segnale bg-asfalto">
              <Image src="/icon-bike.png" alt="" width={36} height={36} className="opacity-80" />
            </div>
          )}
          <div>
            <p className="font-display text-2xl font-bold uppercase tracking-tight">
              {profilo?.username ? `Ciao, ${profilo.username}` : 'Bentornato'}
            </p>
            <p className="font-mono text-xs uppercase text-asfalto/50">
              {profilo?.is_admin
                ? 'Account admin · tutto sbloccato'
                : profilo?.is_pro
                  ? 'Account Pro attivo'
                  : 'Account free'}
              {profilo?.moto ? ` · ${profilo.moto}` : ''}
            </p>
          </div>
        </div>
      )}

      {!loggato && (
        <div className="mb-8 border-2 border-asfalto bg-asfalto px-6 py-5 text-cemento">
          <p className="font-mono text-xs uppercase tracking-wide text-segnale">
            Nuovo su GiroSecco?
          </p>
          <p className="mt-1 font-display text-2xl font-bold uppercase">
            Crea il tuo profilo gratis
          </p>
          <p className="mt-1 text-sm text-guardrail">
            Mappa, roadbook e GPX per tutti gli itinerari. Zero spam.
          </p>
          <div className="mt-4 flex gap-3">
            <a
              href="/accedi#registrati"
              className="bg-segnale px-4 py-2 font-mono text-sm font-medium uppercase text-asfalto hover:bg-white"
            >
              Registrati
            </a>
            <a
              href="/accedi"
              className="border border-guardrail/40 px-4 py-2 font-mono text-sm uppercase text-cemento hover:border-cemento"
            >
              Accedi
            </a>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((t) => (
          <a
            key={t.href + t.titolo}
            href={t.href}
            className={`group flex flex-col gap-2 border-2 p-5 transition-colors hover:bg-asfalto hover:text-cemento ${
              t.evidenza
                ? 'border-segnale bg-white'
                : 'border-asfalto bg-white'
            }`}
          >
            <span className="text-2xl">{t.icona}</span>
            <h3 className="font-display text-2xl font-bold uppercase leading-tight tracking-tight">
              {t.titolo}
            </h3>
            <p className="text-sm text-asfalto/70 group-hover:text-cemento/70">{t.sotto}</p>
          </a>
        ))}
      </div>
    </section>
  );
}
