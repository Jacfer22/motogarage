'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';
import IconaGpsLive from './icons/IconaGpsLive';

function IconaBussola({ attiva }: { attiva: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth={attiva ? 2.4 : 2} />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <polygon points="12,5 14.2,13.5 12,11.2 9.8,13.5" fill={attiva ? '#ED2100' : 'currentColor'} />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  );
}

function IconaGarage({ attiva }: { attiva: boolean }) {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={attiva ? 2.5 : 2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M8 21V10c0-1 .5-2 2-2h4c1.5 0 2 1 2 2v11" />
    </svg>
  );
}

function IconaTraccia({ attiva }: { attiva: boolean }) {
  return (
    <IconaGpsLive
      size={22}
      className={attiva ? 'text-brand' : 'text-cemento/70'}
    />
  );
}

function IconaCommunity({ attiva }: { attiva: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={attiva ? 2.4 : 2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="8.5" cy="10" r="1.5" />
      <path d="m21 16-4.5-4.5L7 21" />
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

  if (!loggato) {
    return (
      <nav
        className="app-chrome-bottomnav vetro fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-asfalto/95 text-cemento md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        aria-label="Navigazione principale"
      >
        <div className="mx-auto flex max-w-md items-end justify-between px-4 py-2">
          <Link href="/itinerari" className="font-mono text-[10px] uppercase text-cemento/60">Itinerari</Link>
          <Link href="/community" className="font-mono text-[10px] uppercase text-cemento/60">Community</Link>
          <Link href="/accedi" className="rounded-app bg-brand px-4 py-2 font-mono text-[10px] font-bold uppercase text-white">Accedi</Link>
        </div>
      </nav>
    );
  }

  const garageAttivo = pathname.startsWith('/garage');
  const tracciaAttiva = pathname.startsWith('/traccia');

  return (
    <nav
      className="app-chrome-bottomnav vetro fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-asfalto/95 text-cemento md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Navigazione principale"
    >
      <div className="mx-auto flex max-w-md items-end justify-between px-1">
        <VoceNav href="/naviga" label="Naviga" Icona={IconaBussola} attiva={pathname.startsWith('/naviga')} />
        <VoceNav href="/community" label="Community" Icona={IconaCommunity} attiva={pathname.startsWith('/community')} />

        <Link
          href="/garage"
          className={`tap tap-nav-centrale -mt-5 flex w-[4.5rem] flex-col items-center gap-1 ${
            garageAttivo ? 'text-white' : 'text-cemento'
          }`}
        >
          <span
            className={`flex h-14 w-14 items-center justify-center rounded-full border-2 shadow-lg transition-colors ${
              garageAttivo
                ? 'border-brand bg-brand text-white shadow-brand'
                : 'border-brand/50 bg-brand text-white shadow-brand'
            }`}
          >
            <IconaGarage attiva={garageAttivo} />
          </span>
          <span className="font-mono text-[10px] font-bold uppercase tracking-wide text-brand">Garage</span>
        </Link>

        <VoceNav href="/traccia" label="Traccia" Icona={IconaTraccia} attiva={tracciaAttiva} />
        <VoceNav href="/account" label="Profilo" Icona={IconaProfilo} attiva={pathname.startsWith('/account') || pathname.startsWith('/hub')} />
      </div>
    </nav>
  );
}

function VoceNav({
  href,
  label,
  Icona,
  attiva,
}: {
  href: string;
  label: string;
  Icona: React.ComponentType<{ attiva: boolean }>;
  attiva: boolean;
}) {
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
