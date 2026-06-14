'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';

// Icone SVG inline (nessuna dipendenza esterna). currentColor segue il testo.
function IconaStrada({ attiva }: { attiva: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={attiva ? 2.4 : 2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 22 9 2" />
      <path d="M20 22 15 2" />
      <path d="M12 6v2" />
      <path d="M12 12v2" />
      <path d="M12 18v2" />
    </svg>
  );
}
function IconaFoto({ attiva }: { attiva: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={attiva ? 2.4 : 2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="8.5" cy="10" r="1.5" />
      <path d="m21 16-4.5-4.5L7 21" />
    </svg>
  );
}
function IconaBlog({ attiva }: { attiva: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={attiva ? 2.4 : 2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 4h16v16H4z" />
      <path d="M8 9h8" />
      <path d="M8 13h6" />
    </svg>
  );
}
function IconaProfilo({ attiva }: { attiva: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={attiva ? 2.4 : 2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.5-6 8-6s8 2 8 6" />
    </svg>
  );
}

export default function BottomNav() {
  const pathname = usePathname();
  const { user, nonConfigurato } = useAuth();
  const loggato = nonConfigurato || !!user;

  const voci = [
    { href: '/itinerari', label: 'Itinerari', Icona: IconaStrada, match: (p: string) => p.startsWith('/itinerari') },
    { href: '/foto', label: 'Foto', Icona: IconaFoto, match: (p: string) => p.startsWith('/foto') },
    { href: '/blog', label: 'Blog', Icona: IconaBlog, match: (p: string) => p.startsWith('/blog') },
    {
      href: loggato ? '/hub' : '/accedi',
      label: loggato ? 'Tu' : 'Accedi',
      Icona: IconaProfilo,
      match: (p: string) => p.startsWith('/hub') || p.startsWith('/account') || p.startsWith('/accedi'),
    },
  ];

  return (
    <nav
      className="vetro fixed inset-x-0 bottom-0 z-40 border-t border-asfalto/10 md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Navigazione principale"
    >
      <div className="mx-auto flex max-w-md items-stretch justify-around">
        {voci.map(({ href, label, Icona, match }) => {
          const attiva = match(pathname);
          return (
            <Link
              key={href}
              href={href}
              className={`tap flex flex-1 flex-col items-center gap-1 py-2.5 ${
                attiva ? 'text-asfalto' : 'text-asfalto/45'
              }`}
            >
              <span className={attiva ? 'text-segnale-scuro' : ''}>
                <Icona attiva={attiva} />
              </span>
              <span className="font-mono text-[10px] uppercase tracking-wide">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
