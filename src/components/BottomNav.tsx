'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';

// Icone SVG inline (nessuna dipendenza esterna). currentColor segue il testo.
function IconaBussola({ attiva }: { attiva: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="none"
        stroke="currentColor"
        strokeWidth={attiva ? 2.4 : 2}
      />
      <path
        d="M12 3v2M12 19v2M3 12h2M19 12h2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <polygon
        points="12,5 14.2,13.5 12,11.2 9.8,13.5"
        fill={attiva ? '#d11919' : 'currentColor'}
      />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
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
function IconaClassifica({ attiva }: { attiva: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={attiva ? 2.4 : 2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 21h8" />
      <path d="M12 17V7" />
      <path d="M7 7h10L12 3z" />
      <path d="M5 11h2M17 11h2" />
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
    { href: '/naviga', label: 'Navigatore', Icona: IconaBussola, match: (p: string) => p.startsWith('/naviga') },
    { href: '/community', label: 'Community', Icona: IconaFoto, match: (p: string) => (p.startsWith('/community') && !p.startsWith('/community/classifica')) || p.startsWith('/foto') },
    { href: '/community/classifica', label: 'Classifica', Icona: IconaClassifica, match: (p: string) => p.startsWith('/community/classifica') },
    {
      href: loggato ? '/hub' : '/accedi',
      label: loggato ? 'Tu' : 'Accedi',
      Icona: IconaProfilo,
      match: (p: string) => p.startsWith('/hub') || p.startsWith('/account') || p.startsWith('/accedi'),
    },
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#101418] text-cemento shadow-[0_-10px_28px_rgba(0,0,0,0.32)] md:hidden"
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
                attiva ? 'text-white' : 'text-cemento/70'
              }`}
            >
              <span className={attiva ? 'text-brand-chiaro' : ''}>
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
