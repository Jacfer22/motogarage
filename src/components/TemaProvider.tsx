'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Tema = 'chiaro' | 'scuro';

interface ContestoTema {
  tema: Tema;
  alterna: () => void;
}

const TemaContext = createContext<ContestoTema>({ tema: 'chiaro', alterna: () => {} });

export function useTema() {
  return useContext(TemaContext);
}

export function TemaProvider({ children }: { children: React.ReactNode }) {
  const [tema, setTema] = useState<Tema>('chiaro');

  // all'avvio leggo la preferenza salvata (o quella di sistema)
  useEffect(() => {
    const salvato = localStorage.getItem('motogarage-tema') as Tema | null;
    const preferenzaSistema = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const iniziale: Tema = salvato ?? (preferenzaSistema ? 'scuro' : 'chiaro');
    applica(iniziale);
    setTema(iniziale);
  }, []);

  function applica(t: Tema) {
    const html = document.documentElement;
    if (t === 'scuro') html.classList.add('dark');
    else html.classList.remove('dark');
  }

  function alterna() {
    const nuovo: Tema = tema === 'scuro' ? 'chiaro' : 'scuro';
    setTema(nuovo);
    applica(nuovo);
    localStorage.setItem('motogarage-tema', nuovo);
  }

  return (
    <TemaContext.Provider value={{ tema, alterna }}>{children}</TemaContext.Provider>
  );
}
