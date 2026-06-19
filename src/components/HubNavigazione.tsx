'use client';

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
    href: '/garage',
    titolo: 'Il mio Garage',
    sotto: 'Entra nell’officina virtuale e crea il gemello 3D della tua moto',
    icona: '🏍️',
    solo: 'loggato',
    evidenza: true,
  },
  {
    href: '/itinerari',
    titolo: 'Itinerari',
    sotto: 'Giri curati, mappe, roadbook e tracce GPX',
    icona: '🗺️',
  },
  {
    href: '/traccia',
    titolo: 'Traccia un giro',
    sotto: 'Registra il percorso via GPS e crea la card da condividere',
    icona: '📍',
    solo: 'loggato',
  },
  {
    href: '/community',
    titolo: 'Community',
    sotto: 'Foto, giri pubblici, commenti e motociclisti',
    icona: '🤝',
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
    sotto: 'Username, moto, foto e impostazioni account',
    icona: '👤',
    solo: 'loggato',
  },
  {
    href: '/pro',
    titolo: 'Passa a Pro',
    sotto: 'GPX, varianti e pacchetti weekend sbloccati',
    icona: '⚡',
    evidenza: true,
  },
  {
    href: '/admin',
    titolo: 'Pannello admin',
    sotto: 'Avvisi, utenti Pro, articoli e aggiornamenti strade',
    icona: '🛠️',
    solo: 'admin',
  },
];

export default function HubNavigazione() {
  const { user, profilo, loading } = useAuth();
  if (loading) return null;

  const loggato = Boolean(user);
  const isPro = Boolean(profilo?.is_pro || profilo?.is_admin);
  const isAdmin = Boolean(profilo?.is_admin);
  const tiles = TILES.filter((tile) => {
    if (tile.solo === 'loggato' && !loggato) return false;
    if (tile.solo === 'admin' && !isAdmin) return false;
    if (tile.solo === 'pro' && !isPro) return false;
    if (tile.href === '/pro' && isPro) return false;
    return true;
  });

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      {loggato && (
        <div className="mb-8 flex items-center gap-4">
          {profilo?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profilo.avatar_url} alt="" className="h-14 w-14 rounded-2xl border-2 border-red-600 object-cover" />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-red-600 bg-asfalto">
              <Image src="/logo-motogarage.svg" alt="" width={38} height={44} />
            </div>
          )}
          <div>
            <p className="font-display text-2xl font-bold uppercase tracking-tight">
              {profilo?.username ? `Ciao, ${profilo.username}` : 'Bentornato'}
            </p>
            <p className="font-mono text-xs uppercase text-asfalto/50">
              {profilo?.is_admin ? 'Account admin · tutto sbloccato' : profilo?.is_pro ? 'Account Pro attivo' : 'Account free'}
              {profilo?.moto ? ` · ${profilo.moto}` : ''}
            </p>
          </div>
        </div>
      )}

      {!loggato && (
        <div className="mb-8 rounded-app-lg border border-white/10 bg-asfalto px-6 py-5 text-cemento shadow-app">
          <p className="font-mono text-xs uppercase tracking-wide text-red-400">Nuovo su MotoGarage?</p>
          <p className="mt-1 font-display text-2xl font-bold uppercase">Crea il tuo profilo gratis</p>
          <p className="mt-1 text-sm text-guardrail">Itinerari, community, GPS e il tuo futuro garage digitale.</p>
          <div className="mt-4 flex gap-3">
            <a href="/accedi#registrati" className="rounded-app bg-red-600 px-4 py-2 font-mono text-sm font-medium uppercase text-white">Registrati</a>
            <a href="/accedi" className="rounded-app border border-guardrail/40 px-4 py-2 font-mono text-sm uppercase text-cemento">Accedi</a>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((tile) => (
          <a
            key={tile.href + tile.titolo}
            href={tile.href}
            className={`group flex flex-col gap-2 rounded-app-lg border-2 p-5 transition-colors hover:bg-asfalto hover:text-cemento ${
              tile.evidenza ? 'border-red-600 bg-white dark:bg-carbone' : 'border-asfalto/15 bg-white dark:bg-carbone'
            }`}
          >
            <span className="text-2xl">{tile.icona}</span>
            <h3 className="font-display text-2xl font-bold uppercase leading-tight tracking-tight">{tile.titolo}</h3>
            <p className="text-sm text-asfalto/70 group-hover:text-cemento/70">{tile.sotto}</p>
          </a>
        ))}
      </div>
    </section>
  );
}
