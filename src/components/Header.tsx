'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from './AuthProvider';
import InterruttoreTema from './InterruttoreTema';

export default function Header() {
  const { user, profilo, loading, nonConfigurato } = useAuth();
  const pathname = usePathname();
  const [menuAperto, setMenuAperto] = useState(false);

  const isLogged = !loading && !!user && !nonConfigurato;
  const isAdmin = !loading && profilo?.is_admin;
  const attivo = (href: string) => pathname.startsWith(href);

  function chiudiMenu() {
    setMenuAperto(false);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#111317]/92 text-cemento shadow-app-sm backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" onClick={chiudiMenu} className="tap flex min-w-0 items-center gap-3">
          <img src="/logo-motogarage.svg" alt="MotoGarage" className="h-11 w-11 rounded-2xl object-contain shadow-[0_0_22px_rgba(0,0,0,0.35)]" />
          <span className="font-display text-2xl font-black uppercase leading-none tracking-tight sm:text-3xl">
            Moto<span className="text-segnale">Garage</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-4 sm:flex">
          <Voce href="/itinerari" label="Itinerari" attivo={attivo('/itinerari')} />
          <Voce href="/community" label="Community" attivo={attivo('/community')} />
          <Voce href="/blog" label="Blog" attivo={attivo('/blog')} />
          {isLogged && <Voce href="/garage" label="Garage" attivo={attivo('/garage')} evidenza />}
          {isAdmin && <Voce href="/admin" label="Admin" attivo={attivo('/admin')} />}
          {!loading && !nonConfigurato && <Voce href={user ? '/hub' : '/accedi'} label={user ? 'Hub' : 'Accedi'} attivo={attivo(user ? '/hub' : '/accedi')} />}
          <InterruttoreTema />
        </nav>

        <div className="flex items-center gap-2 sm:hidden">
          <InterruttoreTema />
          <button type="button" onClick={() => setMenuAperto((v) => !v)} className="grid h-11 w-11 place-items-center rounded-app border border-white/15 bg-white/5 font-mono text-lg" aria-label={menuAperto ? 'Chiudi menu' : 'Apri menu'}>
            {menuAperto ? '×' : '☰'}
          </button>
        </div>
      </div>

      {menuAperto && (
        <nav className="border-t border-white/10 bg-[#111317] px-4 pb-4 sm:hidden">
          <MenuMobile href="/itinerari" label="Itinerari" onClick={chiudiMenu} />
          <MenuMobile href="/community" label="Community" onClick={chiudiMenu} />
          <MenuMobile href="/blog" label="Blog" onClick={chiudiMenu} />
          {isLogged && <MenuMobile href="/garage" label="Il mio Garage" onClick={chiudiMenu} />}
          {!loading && !nonConfigurato && <MenuMobile href={user ? '/hub' : '/accedi'} label={user ? 'Hub' : 'Accedi'} onClick={chiudiMenu} />}
          {isAdmin && <MenuMobile href="/admin" label="Admin" onClick={chiudiMenu} />}
        </nav>
      )}
      <div className="mezzeria mezzeria-animata" aria-hidden="true" />
    </header>
  );
}

function Voce({ href, label, attivo, evidenza }: { href: string; label: string; attivo: boolean; evidenza?: boolean }) {
  if (evidenza) {
    return (
      <Link href={href} className={`tap rounded-app px-4 py-2 font-mono text-xs font-bold uppercase tracking-wide transition-colors ${attivo ? 'bg-segnale text-asfalto shadow-segnale' : 'border border-white/15 text-cemento hover:border-segnale hover:text-segnale'}`}>
        {label}
      </Link>
    );
  }

  return (
    <Link href={href} className={`font-mono text-xs font-bold uppercase tracking-wide transition-colors ${attivo ? 'text-segnale' : 'text-cemento/78 hover:text-segnale'}`}>
      {label}
    </Link>
  );
}

function MenuMobile({ href, label, onClick }: { href: string; label: string; onClick: () => void }) {
  return (
    <Link href={href} onClick={onClick} className="block border-b border-white/10 py-4 font-mono text-sm font-bold uppercase tracking-wide text-cemento/80 hover:text-segnale">
      {label}
    </Link>
  );
}
