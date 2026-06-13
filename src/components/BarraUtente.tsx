'use client';

import Link from 'next/link';
import { useAuth } from './AuthProvider';

export default function BarraUtente() {
  const { user, profilo, loading, nonConfigurato } = useAuth();

  if (loading || nonConfigurato || !user) return null;

  const nome = profilo?.username ?? 'motociclista';

  return (
    <div className="border-b-2 border-segnale bg-asfalto text-cemento">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2 font-mono text-xs uppercase tracking-wide sm:text-sm">
        <p>
          Ciao, <span className="text-segnale">{nome}</span>
          {profilo?.is_admin ? (
            <span className="ml-2 text-cartello">· account admin</span>
          ) : profilo?.is_pro ? (
            <span className="ml-2 text-segnale">· Pro attivo</span>
          ) : (
            <span className="ml-2 text-guardrail">· account free</span>
          )}
        </p>
        <div className="flex items-center gap-4">
          {!profilo?.is_pro && (
            <Link href="/pro" className="underline hover:text-segnale">
              Passa a Pro
            </Link>
          )}
          {profilo?.is_admin && (
            <Link href="/admin" className="text-cartello underline hover:text-white">
              Pannello admin
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
