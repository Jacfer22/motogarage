'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';
import InterruttoreTema from './InterruttoreTema';

export default function Header() {
  const { user, profilo, loading, nonConfigurato } = useAuth();
  const pathname = usePathname();
  const [menuAperto, setMenuAperto] = useState(false);

  const attivo = (p: string) => pathname.startsWith(p);
  const voce = (p: string) =>
    `font-mono text-sm uppercase tracking-wide transition-colors ${attivo(p) ? 'text-segnale' : 'hover:text-segnale'}`;

  const isAdmin = !loading && profilo?.is_admin;
  const isLogged = !loading && !!user && !nonConfigurato;

  function chiudi() { setMenuAperto(false); }

  return (
    <header className="vetro-scuro sticky top-0 z-40 text-cemento shadow-app-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2.5">
        {/* Logo */}
        <Link href="/" className="tap flex min-w-0 items-center gap-2.5" onClick={chiudi}>
          <img src="/logo-motogarage.svg" alt="" width={38} height={45} className="h-10 w-auto shrink-0"/>
          <span className="font-display text-2xl font-bold uppercase tracking-tight sm:text-3xl">
            Moto<span className="text-segnale">Garage</span>
          </span>
        </Link>

        {/* Nav desktop */}
        <nav className="hidden items-center gap-4 sm:flex">
          <Link href="/itinerari" className={voce('/itinerari')}>Itinerari</Link>
          <Link href="/community" className={voce('/community')}>Community</Link>
          <Link href="/foto" className={voce('/foto')}>Foto</Link>
          <Link href="/blog" className={voce('/blog')}>Blog</Link>
          {isLogged && (
            <Link href="/garage"
              className={`tap rounded-app border px-3 py-1.5 font-mono text-sm font-medium uppercase tracking-wide transition-colors ${
                attivo('/garage') ? 'border-segnale bg-segnale text-asfalto' : 'border-guardrail/30 text-cemento hover:border-segnale hover:text-segnale'
              }`}>
              🏍 Garage
            </Link>
          )}
          {isAdmin && (
            <Link href="/admin" className="tap rounded-app border border-cartello px-3 py-1.5 font-mono text-sm font-medium uppercase tracking-wide text-cartello hover:bg-cartello hover:text-cemento">
              Admin
            </Link>
          )}
          <Link href="/pro" className="tap rounded-app bg-segnale px-3 py-1.5 font-mono text-sm font-medium uppercase tracking-wide text-asfalto shadow-segnale hover:bg-white">
            {profilo?.is_pro ? 'Pro ✓' : 'Pro'}
          </Link>
          {!loading && !nonConfigurato && (
            <Link href={user ? '/hub' : '/accedi'} className="font-mono text-sm uppercase tracking-wide hover:text-segnale">
              {user ? 'Hub' : 'Accedi'}
            </Link>
          )}
          <InterruttoreTema />
        </nav>

        {/* Mobile */}
        <div className="flex items-center gap-2 sm:hidden">
          <InterruttoreTema />
          <button type="button" onClick={() => setMenuAperto(v => !v)}
            className="flex h-10 w-10 items-center justify-center border border-guardrail/40"
            aria-label={menuAperto ? 'Chiudi' : 'Menu'} aria-expanded={menuAperto}>
            <span className="font-mono text-lg">{menuAperto ? '✕' : '☰'}</span>
          </button>
        </div>
      </div>

      {/* Menu mobile */}
      {menuAperto && (
        <nav className="border-t border-guardrail/20 px-4 pb-4 pt-2 sm:hidden">
          {[
            ['/itinerari','Itinerari'],
            ['/community','Community'],
            ['/foto','Foto dei Bikers'],
            ['/blog','Blog'],
          ].map(([href, label]) => (
            <Link key={href} href={href} onClick={chiudi}
              className="block border-b border-guardrail/10 py-3 font-mono text-sm uppercase tracking-wide hover:text-segnale">
              {label}
            </Link>
          ))}
          {isLogged && (
            <Link href="/garage" onClick={chiudi}
              className={`block border-b border-guardrail/10 py-3 font-mono text-sm uppercase tracking-wide ${attivo('/garage') ? 'text-segnale' : 'hover:text-segnale'}`}>
              🏍 Il mio Garage
            </Link>
          )}
          <Link href="/pro" onClick={chiudi} className="block border-b border-guardrail/10 py-3 font-mono text-sm uppercase tracking-wide hover:text-segnale">
            {profilo?.is_pro ? 'Pro ✓' : 'Passa a Pro'}
          </Link>
          {!loading && !nonConfigurato && (
            <Link href={user ? '/hub' : '/accedi'} onClick={chiudi}
              className="block border-b border-guardrail/10 py-3 font-mono text-sm uppercase tracking-wide hover:text-segnale">
              {user ? 'Il tuo Hub' : 'Accedi'}
            </Link>
          )}
          {isAdmin && (
            <Link href="/admin" onClick={chiudi}
              className="block py-3 font-mono text-sm uppercase tracking-wide text-cartello hover:text-white">
              Pannello Admin
            </Link>
          )}
        </nav>
      )}
      <div className="mezzeria mezzeria-animata" aria-hidden="true"/>
    </header>
  );
}
