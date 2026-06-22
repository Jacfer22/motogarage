'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { chromeMobileNascosto } from '@/lib/chrome-app';
import LogoHomeLink from '@/components/LogoHomeLink';

/** Logo fisso in alto a sinistra quando l'header è nascosto (mobile app / nav fullscreen). */
export default function LogoHomeShell() {
  const pathname = usePathname();
  const { user, loading, nonConfigurato } = useAuth();
  const loggato = !loading && !!user && !nonConfigurato;
  const [mostra, setMostra] = useState(false);

  useEffect(() => {
    const aggiorna = () => {
      if (pathname.startsWith('/reel')) {
        setMostra(false);
        return;
      }
      const mobile = window.matchMedia('(max-width: 767px)').matches;
      const navFullscreen = document.body.classList.contains('nav-fullscreen-active');
      const chromeOff = mobile && chromeMobileNascosto(pathname, loggato);
      setMostra(chromeOff || navFullscreen);
    };

    aggiorna();
    window.addEventListener('resize', aggiorna);
    const obs = new MutationObserver(aggiorna);
    obs.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => {
      window.removeEventListener('resize', aggiorna);
      obs.disconnect();
    };
  }, [pathname, loggato]);

  if (!mostra) return null;

  return <LogoHomeLink variant="floating" />;
}
