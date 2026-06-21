'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';

function IconaBussola({ attiva }: { attiva: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth={attiva ? 2.4 : 2} />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <polygon points="12,5 14.2,13.5 12,11.2 9.8,13.5" fill={attiva ? '#d11919' : 'currentColor'} />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  );
}

function IconaTraccia({ attiva }: { attiva: boolean }) {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={attiva ? 2.5 : 2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="6" cy="18" r="2" fill={attiva ? 'currentColor' : 'none'} />
      <circle cx="18" cy="6" r="2" fill={attiva ? 'currentColor' : 'none'} />
      <path d="M8 16c3-4 5-6 10-8" />
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

function IconaGiri({ attiva }: { attiva: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={attiva ? 2.4 : 2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 6h16M4 12h10M4 18h6" />
      <circle cx="19" cy="12" r="2" fill={attiva ? 'currentColor' : 'none'} />
      <circle cx="15" cy="18" r="2" fill={attiva ? 'currentColor' : 'none'} />
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

  const vociLaterali = [
    { href: '/naviga', label: 'Naviga', Icona: IconaBussola, match: (p: string) => p.startsWith('/naviga') },
    { href: '/community', label: 'Community', Icona: IconaFoto, match: (p: string) => (p.startsWith('/community') && !p.startsWith('/community/classifica')) || p.startsWith('/foto') },
    { href: '/giri', label: 'Giri', Icona: IconaGiri, match: (p: string) => p.startsWith('/giri') },
    {
      href: loggato ? '/hub' : '/accedi',
      label: loggato ? 'Tu' : 'Accedi',
      Icona: IconaProfilo,
      match: (p: string) => p.startsWith('/hub') || p.startsWith('/account') || p.startsWith('/accedi'),
    },
  ];

  const tracciaAttiva = pathname.startsWith('/traccia');

  return (
    <nav
      className="app-chrome-bottomnav vetro fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-asfalto/95 text-cemento md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Navigazione principale"
    >
      <div className="mx-auto flex max-w-md items-end justify-between px-1">
        <VoceNav {...vociLaterali[0]} pathname={pathname} />
        <VoceNav {...vociLaterali[1]} pathname={pathname} />

        <Link
          href="/traccia"
          className={`tap tap-nav-centrale -mt-5 flex w-[4.5rem] flex-col items-center gap-1 ${
            tracciaAttiva ? 'text-white' : 'text-cemento'
          }`}
        >
          <span
            className={`flex h-14 w-14 items-center justify-center rounded-full border-2 shadow-lg transition-colors ${
              tracciaAttiva
                ? 'border-brand bg-brand text-white shadow-brand'
                : 'border-white/20 bg-brand text-white'
            }`}
          >
            <IconaTraccia attiva={tracciaAttiva} />
          </span>
          <span className="font-mono text-[10px] font-bold uppercase tracking-wide">Traccia</span>
        </Link>

        <VoceNav {...vociLaterali[2]} pathname={pathname} />
        <VoceNav {...vociLaterali[3]} pathname={pathname} />
      </div>
    </nav>
  );
}

function VoceNav({
  href,
  label,
  Icona,
  match,
  pathname,
}: {
  href: string;
  label: string;
  Icona: React.ComponentType<{ attiva: boolean }>;
  match: (p: string) => boolean;
  pathname: string;
}) {
  const attiva = match(pathname);
  return (
    <Link
      href={href}
      className={`tap flex min-h-[44px] min-w-[3.25rem] flex-1 flex-col items-center justify-end gap-1 py-2 ${
        attiva ? 'text-cemento' : 'text-cemento/45'
      }`}
    >
      <span className={attiva ? 'text-brand' : ''}>
        <Icona attiva={attiva} />
      </span>
      <span className="font-mono text-[9px] uppercase tracking-wide">{label}</span>
    </Link>
  );
}
