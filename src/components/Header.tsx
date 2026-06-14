'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';

export default function Header() {
  const { user, profilo, loading, nonConfigurato } = useAuth();
  const pathname = usePathname();
  const [menuAperto, setMenuAperto] = useState(false);

  // evidenzia la voce di menu corrispondente alla pagina corrente
  const attivo = (prefisso: string) => pathname.startsWith(prefisso);
  const voce = (prefisso: string) =>
    `font-mono text-sm uppercase tracking-wide transition-colors ${
      attivo(prefisso) ? 'text-segnale' : 'hover:text-segnale'
    }`;

  const isAdmin = !loading && profilo?.is_admin;
  const mostraAuth = !nonConfigurato && !loading;

  function chiudi() {
    setMenuAperto(false);
  }

  return (
    <header className="vetro-scuro sticky top-0 z-40 text-cemento shadow-app-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="tap flex min-w-0 items-center gap-2" onClick={chiudi}>
          <Image
            src="/icon-bike.png"
            alt=""
            width={40}
            height={40}
            className="h-9 w-9 shrink-0 sm:h-10 sm:w-10"
            priority
          />
          <span className="font-display text-2xl font-bold uppercase tracking-tight sm:text-3xl">
            Giro<span className="text-segnale">Secco</span>
          </span>
        </Link>

        {/* Nav desktop */}
        <nav className="hidden items-center gap-4 sm:flex">
          <Link href="/itinerari" className={voce('/itinerari')}>
            Itinerari
          </Link>
          <Link href="/foto" className={voce('/foto')}>
            Foto
          </Link>
          <Link href="/blog" className={voce('/blog')}>
            Blog
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              className="tap rounded-app border border-cartello px-3 py-1.5 font-mono text-sm font-medium uppercase tracking-wide text-cartello hover:bg-cartello hover:text-cemento"
            >
              Admin
            </Link>
          )}
          <Link
            href="/pro"
            className="tap rounded-app bg-segnale px-3 py-1.5 font-mono text-sm font-medium uppercase tracking-wide text-asfalto shadow-segnale hover:bg-white"
          >
            {profilo?.is_pro ? 'Pro ✓' : 'Pro'}
          </Link>
          {mostraAuth && (
            <Link
              href={user ? '/hub' : '/accedi'}
              className="font-mono text-sm uppercase tracking-wide transition-colors hover:text-segnale"
            >
              {user ? 'Hub' : 'Accedi'}
            </Link>
          )}
        </nav>

        {/* Bottone menu mobile */}
        <button
          type="button"
          onClick={() => setMenuAperto((v) => !v)}
          className="flex h-10 w-10 items-center justify-center border border-guardrail/40 sm:hidden"
          aria-label={menuAperto ? 'Chiudi menu' : 'Apri menu'}
          aria-expanded={menuAperto}
        >
          <span className="font-mono text-lg">{menuAperto ? '✕' : '☰'}</span>
        </button>
      </div>

      {/* Menu mobile a tendina */}
      {menuAperto && (
        <nav className="border-t border-guardrail/20 px-4 pb-4 pt-2 sm:hidden">
          <Link
            href="/itinerari"
            onClick={chiudi}
            className="block border-b border-guardrail/10 py-3 font-mono text-sm uppercase tracking-wide hover:text-segnale"
          >
            Itinerari
          </Link>
          <Link
            href="/foto"
            onClick={chiudi}
            className="block border-b border-guardrail/10 py-3 font-mono text-sm uppercase tracking-wide hover:text-segnale"
          >
            Foto dei Bikers
          </Link>
          <Link
            href="/blog"
            onClick={chiudi}
            className="block border-b border-guardrail/10 py-3 font-mono text-sm uppercase tracking-wide hover:text-segnale"
          >
            Blog
          </Link>
          <Link
            href="/pro"
            onClick={chiudi}
            className="block border-b border-guardrail/10 py-3 font-mono text-sm uppercase tracking-wide hover:text-segnale"
          >
            {profilo?.is_pro ? 'Pro ✓' : 'Passa a Pro'}
          </Link>
          {mostraAuth && (
            <Link
              href={user ? '/hub' : '/accedi'}
              onClick={chiudi}
              className="block border-b border-guardrail/10 py-3 font-mono text-sm uppercase tracking-wide hover:text-segnale"
            >
              {user ? 'Il tuo hub' : 'Accedi'}
            </Link>
          )}
          {isAdmin && (
            <Link
              href="/admin"
              onClick={chiudi}
              className="block py-3 font-mono text-sm uppercase tracking-wide text-cartello hover:text-white"
            >
              Pannello admin
            </Link>
          )}
        </nav>
      )}

      <div className="mezzeria mezzeria-animata" aria-hidden="true" />
    </header>
  );
}
