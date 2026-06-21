'use client';

import { usePathname } from 'next/navigation';
import Logo from './Logo';

import { footerNascosto } from '@/lib/chrome-app';

const PAGINE_IMMERSIVE = ['/naviga', '/traccia'];

const LINK_NAV = [
  { href: '/traccia', label: 'Traccia' },
  { href: '/naviga', label: 'Navigatore' },
  { href: '/itinerari', label: 'Itinerari' },
  { href: '/garage', label: 'Garage' },
  { href: '/community', label: 'Community' },
  { href: '/pro', label: 'Pro' },
];

export default function Footer() {
  const pathname = usePathname();
  const immersivo = footerNascosto(pathname) || PAGINE_IMMERSIVE.some((p) => pathname.startsWith(p));

  if (immersivo) return null;

  return (
    <footer className="app-chrome-footer mt-16 bg-asfalto text-cemento">
      <div className="strada-viva" aria-hidden="true" />
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2">
            <Logo variante="footer" />
            <p className="mt-5 max-w-md text-sm leading-relaxed text-guardrail/90">
              Traccia giri GPS, crea card social, costruisci il garage 3D e connettiti con i motociclisti italiani.
            </p>
            <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-guardrail/60">
              Made in Italy · per veri biker
            </p>
          </div>

          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-guardrail/50">Esplora</p>
            <ul className="mt-3 space-y-2">
              {LINK_NAV.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="font-mono text-xs uppercase tracking-wide text-guardrail/75 hover:text-brand">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-guardrail/50">Legale</p>
            <ul className="mt-3 space-y-2 font-mono text-xs uppercase tracking-wide text-guardrail/75">
              <li><a href="/privacy" className="hover:text-brand">Privacy</a></li>
              <li><a href="/termini" className="hover:text-brand">Termini</a></li>
              <li><a href="mailto:info@motogarage.it" className="hover:text-brand">Contatti</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 font-mono text-[10px] uppercase tracking-wide text-guardrail/50">
          © {new Date().getFullYear()} MotoGarage · Italia
        </div>
      </div>
    </footer>
  );
}
