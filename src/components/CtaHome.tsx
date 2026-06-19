'use client';

import Link from 'next/link';
import { useAuth } from './AuthProvider';

export default function CtaHome() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex gap-3">
        <div className="skeleton h-12 w-44 rounded-app" />
        <div className="skeleton h-12 w-44 rounded-app" />
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/traccia"
          className="tap rounded-app bg-segnale px-6 py-3 text-center font-mono text-sm font-medium uppercase tracking-wide text-asfalto shadow-segnale hover:bg-white"
        >
          Traccia un giro
        </Link>
        <Link
          href="/garage"
          className="tap rounded-app border border-guardrail/30 px-6 py-3 text-center font-mono text-sm uppercase tracking-wide text-cemento hover:border-cemento hover:bg-white/5"
        >
          Il mio garage
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Link
        href="/itinerari"
        className="tap rounded-app bg-segnale px-6 py-3 text-center font-mono text-sm font-medium uppercase tracking-wide text-asfalto shadow-segnale hover:bg-white"
      >
        Vedi gli itinerari
      </Link>
      <Link
        href="/accedi#registrati"
        className="tap rounded-app border border-guardrail/30 px-6 py-3 text-center font-mono text-sm uppercase tracking-wide text-cemento hover:border-cemento hover:bg-white/5"
      >
        Accedi / Registrati
      </Link>
    </div>
  );
}
