'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Punto } from '@/lib/geo';
import {
  calcolaRotta,
  cercaDestinazione,
  distanzaAlPasso,
  formattaDistanzaNav,
  indicePassoCorrente,
  type DestinazioneNav,
  type PassoNavigazione,
  type RottaCalcolata,
} from '@/lib/navigazione-osrm';

interface Props {
  posizione: Punto | null;
  attiva: boolean;
  onDestinazioneChange: (dest: DestinazioneNav | null) => void;
  onRottaChange: (rotta: RottaCalcolata | null) => void;
  onPassoChange: (indice: number, passo: PassoNavigazione | null) => void;
}

export default function PannelloNavigazione({
  posizione,
  attiva,
  onDestinazioneChange,
  onRottaChange,
  onPassoChange,
}: Props) {
  const [query, setQuery] = useState('');
  const [risultati, setRisultati] = useState<DestinazioneNav[]>([]);
  const [destinazione, setDestinazione] = useState<DestinazioneNav | null>(null);
  const [rotta, setRotta] = useState<RottaCalcolata | null>(null);
  const [caricamento, setCaricamento] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);
  const [navOn, setNavOn] = useState(false);

  const aggiornaPasso = useCallback((r: RottaCalcolata | null, pos: Punto | null) => {
    if (!r || !pos || r.passi.length === 0) {
      onPassoChange(0, null);
      return;
    }
    const idx = indicePassoCorrente(r.passi, pos);
    onPassoChange(idx, r.passi[idx] ?? null);
  }, [onPassoChange]);

  async function cerca() {
    setErrore(null);
    setCaricamento(true);
    try {
      const elenco = await cercaDestinazione(query);
      setRisultati(elenco);
      if (elenco.length === 0) setErrore('Nessun risultato in Italia. Prova un altro nome.');
    } catch (e) {
      setErrore(e instanceof Error ? e.message : 'Ricerca fallita.');
      setRisultati([]);
    } finally {
      setCaricamento(false);
    }
  }

  async function impostaDestinazione(dest: DestinazioneNav) {
    setDestinazione(dest);
    setRisultati([]);
    setQuery(dest.nome);
    onDestinazioneChange(dest);
    setErrore(null);
    setCaricamento(true);

    try {
      const partenza = await ottieniPartenza(posizione);
      const nuova = await calcolaRotta(partenza, dest);
      setRotta(nuova);
      onRottaChange(nuova);
      aggiornaPasso(nuova, partenza);
      setNavOn(true);
    } catch (e) {
      setErrore(e instanceof Error ? e.message : 'Percorso non calcolato.');
      setRotta(null);
      onRottaChange(null);
    } finally {
      setCaricamento(false);
    }
  }

  function disattiva() {
    setNavOn(false);
    setDestinazione(null);
    setRotta(null);
    setRisultati([]);
    onDestinazioneChange(null);
    onRottaChange(null);
    onPassoChange(0, null);
  }

  useEffect(() => {
    if (navOn && rotta && posizione && attiva) {
      aggiornaPasso(rotta, posizione);
    }
  }, [navOn, rotta, posizione, attiva, aggiornaPasso]);

  const passoIdx = rotta && posizione ? indicePassoCorrente(rotta.passi, posizione) : 0;
  const passo = rotta?.passi[passoIdx] ?? null;
  const distanzaMano = passo && posizione ? distanzaAlPasso(posizione, passo) : null;

  return (
    <div className="rounded-app-lg border border-asfalto/10 bg-white p-4 shadow-app">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-brand">Navigazione</p>
          <h2 className="font-display text-xl font-bold uppercase tracking-tight">Vai verso un punto</h2>
        </div>
        {navOn && (
          <button
            type="button"
            onClick={disattiva}
            className="font-mono text-[10px] uppercase text-asfalto/50 underline hover:text-asfalto"
          >
            Chiudi
          </button>
        )}
      </div>
      <p className="mt-1 text-xs text-asfalto/55">
        OpenStreetMap + OSRM (open source, gratuito). Indicazioni stradali mentre l&apos;app è aperta.
      </p>

      {!navOn && (
        <div className="mt-3 flex gap-2">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && cerca()}
            placeholder="Es. Lago di Bracciano, Roma Termini…"
            className="input-app min-w-0 flex-1"
            maxLength={80}
          />
          <button
            type="button"
            onClick={cerca}
            disabled={caricamento || query.trim().length < 2}
            className="shrink-0 rounded-app bg-asfalto px-4 py-2 font-mono text-[10px] font-bold uppercase text-cemento disabled:opacity-40"
          >
            Cerca
          </button>
        </div>
      )}

      {risultati.length > 0 && (
        <ul className="mt-2 max-h-40 overflow-y-auto rounded-app border border-asfalto/10">
          {risultati.map((r) => (
            <li key={`${r.lat}-${r.lng}`}>
              <button
                type="button"
                onClick={() => impostaDestinazione(r)}
                className="w-full px-3 py-2.5 text-left text-sm hover:bg-asfalto/[0.04]"
              >
                {r.nome}
              </button>
            </li>
          ))}
        </ul>
      )}

      {errore && (
        <p className="mt-2 rounded-app border border-red-500/25 bg-red-50 px-3 py-2 text-xs text-red-800">{errore}</p>
      )}

      {navOn && rotta && (
        <div className="mt-4 rounded-app border-2 border-brand/30 bg-brand/5 p-4">
          <p className="font-mono text-[10px] uppercase tracking-wide text-asfalto/45">Prossima manovra</p>
          <p className="mt-1 font-display text-2xl font-bold uppercase leading-tight tracking-tight">
            {passo?.istruzione ?? 'Segui il percorso'}
          </p>
          {distanzaMano !== null && passo?.istruzione !== 'Sei arrivato a destinazione' && (
            <p className="mt-2 font-display text-3xl font-black text-brand">
              {formattaDistanzaNav(distanzaMano)}
            </p>
          )}
          <p className="mt-3 font-mono text-[10px] uppercase text-asfalto/45">
            Destinazione: {destinazione?.nome}
          </p>
          <p className="font-mono text-[10px] uppercase text-asfalto/45">
            Percorso: {formattaDistanzaNav(rotta.distanzaM)} · ~
            {Math.max(1, Math.round(rotta.durataSec / 60))} min
          </p>
        </div>
      )}

      {caricamento && (
        <p className="mt-2 font-mono text-[10px] uppercase text-asfalto/40">Calcolo percorso…</p>
      )}
    </div>
  );
}

async function ottieniPartenza(posizione: Punto | null): Promise<Punto> {
  if (posizione) return posizione;
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('GPS non disponibile per calcolare il percorso.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => reject(new Error('Attiva il GPS per partire verso la destinazione.')),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 5000 },
    );
  });
}
