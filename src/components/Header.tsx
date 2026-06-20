'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from './AuthProvider';
import { getSupabaseBrowser } from '@/lib/supabase-browser';
import Logo from './Logo';

export default function Header() {
  const { user, profilo, loading, nonConfigurato } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [menuAperto, setMenuAperto] = useState(false);
  const [esce, setEsce] = useState(false);

  const isLogged = !loading && !!user && !nonConfigurato;
  const isAdmin = !loading && profilo?.is_admin;
  const attivo = (href: string) => pathname.startsWith(href);

  function chiudiMenu() {
    setMenuAperto(false);
  }

  async function logout() {
    const supabase = getSupabaseBrowser();
    if (!supabase || esce) return;
    setEsce(true);
    await supabase.auth.signOut();
    chiudiMenu();
    router.push('/');
    router.refresh();
    setEsce(false);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-asfalto/97 text-cemento shadow-app-sm backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2.5">
        <Link href="/" onClick={chiudiMenu} className="tap flex shrink-0 items-center gap-2.5 sm:gap-3">
          <Logo variante="header" />
          <span className="font-display text-base font-bold uppercase leading-none tracking-tight text-cemento sm:text-lg">
            Moto Garage
          </span>
        </Link>

        <nav className="hidden items-center gap-5 sm:flex">
          <Voce href="/itinerari" label="Itinerari" attivo={attivo('/itinerari')} />
          <Voce href="/community" label="Community" attivo={attivo('/community')} />
          {isLogged && <Voce href="/garage" label="Garage" attivo={attivo('/garage')} evidenza />}
          {isLogged && <Voce href="/giri" label="I miei giri" attivo={attivo('/giri')} />}
          {isAdmin && <Voce href="/admin" label="Admin" attivo={attivo('/admin')} />}
          {!loading && !nonConfigurato && (
            <Voce
              href={user ? '/hub' : '/accedi'}
              label={user ? 'Hub' : 'Accedi'}
              attivo={attivo(user ? '/hub' : '/accedi')}
            />
          )}
          {isLogged && (
            <button
              type="button"
              onClick={logout}
              disabled={esce}
              className="tap rounded-app border border-white/15 px-3 py-2 font-mono text-xs font-bold uppercase tracking-wide text-cemento/75 transition-colors hover:border-brand/40 hover:text-brand-chiaro disabled:opacity-50"
            >
              {esce ? 'Uscita…' : 'Esci'}
            </button>
          )}
        </nav>

        <div className="flex items-center gap-2 sm:hidden">
          <button
            type="button"
            onClick={() => setMenuAperto((v) => !v)}
            className="grid h-10 w-10 place-items-center rounded-app border border-white/15 bg-white/5 font-mono text-lg text-cemento"
            aria-label={menuAperto ? 'Chiudi menu' : 'Apri menu'}
          >
            {menuAperto ? '×' : '☰'}
          </button>
        </div>
      </div>

      {menuAperto && (
        <nav className="border-t border-white/10 bg-asfalto px-4 pb-4">
          <MenuMobile href="/itinerari" label="Itinerari" onClick={chiudiMenu} />
          <MenuMobile href="/community" label="Community" onClick={chiudiMenu} />
          {isLogged && <MenuMobile href="/garage" label="Il mio Garage" onClick={chiudiMenu} />}
          {isLogged && <MenuMobile href="/giri" label="I miei giri" onClick={chiudiMenu} />}
          {!loading && !nonConfigurato && (
            <MenuMobile href={user ? '/hub' : '/accedi'} label={user ? 'Hub' : 'Accedi'} onClick={chiudiMenu} />
          )}
          {isAdmin && <MenuMobile href="/admin" label="Admin" onClick={chiudiMenu} />}
          {isLogged && (
            <button
              type="button"
              onClick={logout}
              disabled={esce}
              className="mt-2 w-full rounded-app border border-white/15 py-4 font-mono text-sm font-bold uppercase tracking-wide text-cemento/80 hover:text-brand-chiaro disabled:opacity-50"
            >
              {esce ? 'Uscita…' : 'Esci'}
            </button>
          )}
        </nav>
      )}
      <div className="strada-viva strada-viva-animata" aria-hidden="true" />
    </header>
  );
}

function Voce({ href, label, attivo, evidenza }: { href: string; label: string; attivo: boolean; evidenza?: boolean }) {
  if (evidenza) {
    return (
      <Link
        href={href}
        className={`tap rounded-app px-4 py-2 font-mono text-xs font-bold uppercase tracking-wide transition-colors ${
          attivo
            ? 'bg-brand text-white shadow-brand'
            : 'border border-white/15 text-cemento hover:border-brand hover:text-brand-chiaro'
        }`}
      >
        {label}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={`font-mono text-xs font-bold uppercase tracking-wide transition-colors ${
        attivo
          ? 'text-brand'
          : 'text-cemento/75 hover:text-brand-chiaro'
      }`}
    >
      {label}
    </Link>
  );
}

function MenuMobile({ href, label, onClick }: { href: string; label: string; onClick: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="block border-b border-white/10 py-4 font-mono text-sm font-bold uppercase tracking-wide text-cemento/80 hover:text-brand-chiaro"
    >
      {label}
    </Link>
  );
}
