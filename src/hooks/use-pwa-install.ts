'use client';

import { useCallback, useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function usePwaInstall() {
  const [evento, setEvento] = useState<BeforeInstallPromptEvent | null>(null);
  const [installata, setInstallata] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstallata(true);
      return;
    }

    function onPrompt(e: Event) {
      e.preventDefault();
      setEvento(e as BeforeInstallPromptEvent);
    }

    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  const installa = useCallback(async () => {
    if (!evento) return false;
    await evento.prompt();
    const scelta = await evento.userChoice;
    if (scelta.outcome === 'accepted') {
      setEvento(null);
      setInstallata(true);
      return true;
    }
    return false;
  }, [evento]);

  return {
    disponibile: !!evento && !installata,
    installata,
    installa,
  };
}
