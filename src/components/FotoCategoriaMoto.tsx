'use client';

import { useState } from 'react';
import {
  fotoCategoria,
  risolviCategoriaMoto,
  etichettaCategoriaMoto,
} from '@/lib/foto-categoria-moto';

interface Props {
  categoriaEsplicita?: string | null;
  testoModello?: string | null;
  modello?: string | null;
  className?: string;
}

export default function FotoCategoriaMoto({
  categoriaEsplicita,
  testoModello,
  modello,
  className = '',
}: Props) {
  const testo = testoModello ?? modello ?? '';
  const categoria = risolviCategoriaMoto(categoriaEsplicita, testo);
  const etichetta = etichettaCategoriaMoto(categoriaEsplicita, testo);
  const [usaLocale, setUsaLocale] = useState(false);
  const [errore, setErrore] = useState(false);
  const src = fotoCategoria(categoria, !usaLocale);

  return (
    <div className={`overflow-hidden rounded-app-lg bg-asfalto ${className}`}>
      {!errore ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={etichetta}
          className="aspect-[16/10] w-full object-cover object-center"
          onError={() => {
            if (!usaLocale) setUsaLocale(true);
            else setErrore(true);
          }}
        />
      ) : (
        <div className="flex aspect-[16/10] w-full items-center justify-center bg-asfalto/90">
          <span className="font-display text-2xl font-bold uppercase text-cemento/40">{etichetta}</span>
        </div>
      )}
      <div className="border-t border-white/10 px-4 py-3 text-center">
        {modello && (
          <p className="font-display text-lg font-bold uppercase tracking-tight text-white">{modello}</p>
        )}
        <p className="font-mono text-[11px] uppercase tracking-wide text-cemento/55">{etichetta}</p>
      </div>
    </div>
  );
}
