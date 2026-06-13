'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from './AuthProvider';

export default function Header() {
  const { user, loading, nonConfigurato } = useAuth();

  return (
    <header className="bg-asfalto text-cemento">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/icon-bike.png"
            alt=""
            width={40}
            height={40}
            className="h-10 w-10"
            priority
          />
          <span className="font-display text-3xl font-bold uppercase tracking-tight">
            Giro<span className="text-segnale">Secco</span>
          </span>
          <span className="hidden font-mono text-xs text-guardrail sm:inline">
            itinerari moto · Lazio
          </span>
        </Link>
        <nav className="flex items-center gap-4">
          <a
            href="/#itinerari"
            className="font-mono text-sm uppercase tracking-wide hover:text-segnale"
          >
            Itinerari
          </a>
          <Link
            href="/pro"
            className="bg-segnale px-3 py-1.5 font-mono text-sm font-medium uppercase tracking-wide text-asfalto hover:bg-white"
          >
            Pro
          </Link>
          {!nonConfigurato && !loading && (
            <Link
              href={user ? '/account' : '/accedi'}
              className="font-mono text-sm uppercase tracking-wide hover:text-segnale"
            >
              {user ? 'Account' : 'Accedi'}
            </Link>
          )}
        </nav>
      </div>
      <div className="mezzeria mezzeria-animata" aria-hidden="true" />
    </header>
  );
}
