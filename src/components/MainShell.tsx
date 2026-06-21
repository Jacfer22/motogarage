'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import TutorialPrimoAccesso from './TutorialPrimoAccesso';
import { useAuth } from './AuthProvider';
import { chromeMobileNascosto, footerNascosto } from '@/lib/chrome-app';

const PAGINE_IMMERSIVE = ['/naviga', '/traccia'];

export default function MainShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading, nonConfigurato } = useAuth();
  const immersivo = PAGINE_IMMERSIVE.some((p) => pathname.startsWith(p));
  const loggato = !loading && !!user && !nonConfigurato;

  useEffect(() => {
    const aggiorna = () => {
      const mobile = window.matchMedia('(max-width: 767px)').matches;
      document.body.classList.toggle('app-immersive-mobile', mobile && chromeMobileNascosto(pathname, loggato));
      document.body.classList.toggle('app-immersive-footer', footerNascosto(pathname));
    };
    aggiorna();
    window.addEventListener('resize', aggiorna);
    return () => window.removeEventListener('resize', aggiorna);
  }, [pathname, loggato]);

  return (
    <>
      <main
        className={`app-main page-enter ${immersivo ? 'main-immersivo flex-1' : 'flex-1'} ${loggato && !pathname.startsWith('/') ? 'app-shell-loggato' : ''}`}
      >
        {children}
      </main>
      <TutorialPrimoAccesso />
    </>
  );
}
