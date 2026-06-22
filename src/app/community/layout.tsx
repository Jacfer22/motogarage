'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import CercaUtenti from '@/components/CercaUtenti';
import AppPageShell from '@/components/AppPageShell';

const TAB = [
  { href: '/community', label: 'Attività', match: (p: string) => p === '/community' },
  { href: '/community/classifica', label: 'Classifica km', match: (p: string) => p.startsWith('/community/classifica') },
];

export default function LayoutCommunity({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AppPageShell>
      <p className="font-mono text-sm uppercase tracking-[0.2em] text-cartello">In sella ora</p>
      <h1 className="mt-1 font-display text-4xl font-bold uppercase leading-none tracking-tight text-white sm:text-5xl">
        Community
      </h1>
      <p className="mt-4 text-lg text-cemento/70">
        Foto dei giri, classifica chilometri e ricerca rider.
      </p>

      <div className="mt-6">
        <CercaUtenti />
      </div>

      <nav className="mt-6 flex gap-2 border-b border-white/10 pb-px" aria-label="Sezioni community">
        {TAB.map((tab) => {
          const attivo = tab.match(pathname);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`tap rounded-t-app px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-wide transition-colors ${
                attivo
                  ? 'border-b-2 border-brand bg-brand/10 text-brand'
                  : 'text-cemento/50 hover:text-cemento'
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-8">{children}</div>
    </AppPageShell>
  );
}
