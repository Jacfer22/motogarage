'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import CercaUtenti from '@/components/CercaUtenti';

const TAB = [
  { href: '/community', label: 'Attività', match: (p: string) => p === '/community' },
  { href: '/community/classifica', label: 'Classifica km', match: (p: string) => p.startsWith('/community/classifica') },
];

export default function LayoutCommunity({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <p className="font-mono text-sm uppercase tracking-[0.2em] text-cartello">In sella ora</p>
      <h1 className="mt-1 font-display text-5xl font-bold uppercase leading-none tracking-tight sm:text-6xl">
        Community
      </h1>
      <p className="mt-4 text-lg text-asfalto/75">
        Foto dei giri, classifica chilometri e ricerca rider.
      </p>

      <div className="mt-6">
        <CercaUtenti />
      </div>

      <nav className="mt-6 flex gap-2 border-b border-asfalto/12 pb-px" aria-label="Sezioni community">
        {TAB.map((tab) => {
          const attivo = tab.match(pathname);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`tap rounded-t-app px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-wide transition-colors ${
                attivo
                  ? 'border-b-2 border-brand bg-brand/10 text-brand'
                  : 'text-asfalto/65 hover:text-asfalto dark:text-cemento/70 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-8">{children}</div>
    </div>
  );
}
