'use client';

import { createContext, useContext, useEffect } from 'react';

type Tema = 'scuro';

interface ContestoTema {
  tema: Tema;
}

const TemaContext = createContext<ContestoTema>({ tema: 'scuro' });

export function useTema() {
  return useContext(TemaContext);
}

export function TemaProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.documentElement.classList.add('dark');
    localStorage.setItem('motogarage-tema', 'scuro');
  }, []);

  return (
    <TemaContext.Provider value={{ tema: 'scuro' }}>{children}</TemaContext.Provider>
  );
}
