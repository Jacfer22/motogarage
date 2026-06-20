'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import type { Punto } from '@/lib/geo';
import {
  calcolaRotta,
  cercaDestinazione,
  distanzaAlPasso,
  formattaDistanzaNav,
  indicePassoCorrente,
  type DestinazioneNav,
  type RottaCalcolata,
} from '@/lib/navigazione-osrm';

const MappaNavigatore = dynamic(() => import('./MappaNavigatore'), { ssr: false });

export default function PaginaNavigatore() {
  const [posizione, setPosizione] = useState<Punto | null>(null);
  const [query, setQuery] = useState('');
  const [risultati, setRisultati] = useState<DestinazioneNav[]>([]);
  const [destinazione, setDestinazione] = useState<DestinazioneNav | null>(null);
  const [rotta, setRotta] = useState<RottaCalcolata | null>(null);
  const [navOn, setNavOn] = useState(false);
  const [caricamento, setCaricamento] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);
  const [segui, setSegui] = useState(true);
  const [ricentraTick, setRicentraTick] = useState(0);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setErrore('Attiva il GPS per usare il navigatore.');
      return;
    }
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => setPosizione({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setErrore('Non riesco a leggere il GPS. Controlla i permessi.'),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 },
    );
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  async function cerca() {
    setErrore(null);
    setCaricamento(true);
    try {
      const elenco = await cercaDestinazione(query);
      setRisultati(elenco);
      if (elenco.length === 0) setErrore('Nessun risultato. Prova un altro nome.');
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
    setErrore(null);
    setCaricamento(true);
    try {
      const partenza = posizione ?? (await ottieniPosizione());
      const nuova = await calcolaRotta(partenza, dest);
      setRotta(nuova);
      setNavOn(true);
      setSegui(true);
      setRicentraTick((t) => t + 1);
    } catch (e) {
      setErrore(e instanceof Error ? e.message : 'Percorso non calcolato.');
      setRotta(null);
      setNavOn(false);
    } finally {
      setCaricamento(false);
    }
  }

  function chiudiNav() {
    setNavOn(false);
    setDestinazione(null);
    setRotta(null);
    setRisultati([]);
  }

  function ricentra() {
    setSegui(true);
    setRicentraTick((t) => t + 1);
  }

  const passoIdx = rotta && posizione ? indicePassoCorrente(rotta.passi, posizione) : 0;
  const passo = rotta?.passi[passoIdx] ?? null;
  const distanzaMano = passo && posizione ? distanzaAlPasso(posizione, passo) : null;

  return (
    <div className="flex min-h-[calc(100dvh-4rem)] flex-col">
      {!navOn && (
        <div className="border-b border-asfalto/10 bg-white px-4 py-3">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-brand">Navigatore</p>
          <div className="mt-2 flex gap-2">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && cerca()}
              placeholder="Dove vuoi andare?"
              className="input-app min-w-0 flex-1"
              maxLength={80}
            />
            <button
              type="button"
              onClick={cerca}
              disabled={caricamento || query.trim().length < 2}
              className="shrink-0 rounded-app bg-asfalto px-4 py-2 font-mono text-[10px] font-bold uppercase text-cemento disabled:opacity-40"
            >
              Vai
            </button>
          </div>
          {risultati.length > 0 && (
            <ul className="mt-2 max-h-36 overflow-y-auto rounded-app border border-asfalto/12">
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
          {errore && !navOn && (
            <p className="mt-2 text-sm text-red-700">{errore}</p>
          )}
          <p className="mt-2 font-mono text-[10px] uppercase tracking-wide text-asfalto/40">
            Guarda poco lo schermo — in sella la strada viene prima.
          </p>
        </div>
      )}

      {navOn && passo && (
        <div className="border-b-2 border-brand/40 bg-asfalto px-4 py-4 text-white">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-display text-2xl font-black uppercase leading-tight tracking-tight sm:text-3xl">
                {passo.istruzione}
              </p>
              {distanzaMano !== null && passo.istruzione !== 'Sei arrivato a destinazione' && (
                <p className="mt-1 font-display text-4xl font-black leading-none text-brand sm:text-5xl">
                  {formattaDistanzaNav(distanzaMano)}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={chiudiNav}
              className="shrink-0 rounded-app border border-white/20 px-2 py-1 font-mono text-[10px] font-bold uppercase text-cemento/70"
            >
              Chiudi
            </button>
          </div>
        </div>
      )}

      <div className="relative min-h-[52dvh] flex-1 border-y border-asfalto/10">
        <MappaNavigatore
          posizione={posizione}
          percorsoNav={rotta?.percorso}
          destinazione={destinazione}
          segui={segui}
          onSeguiChange={setSegui}
          ricentraTick={ricentraTick}
        />
        <button
          type="button"
          onClick={ricentra}
          className={`absolute bottom-4 right-4 z-[600] flex h-12 w-12 items-center justify-center rounded-full border-2 shadow-lg transition-colors ${
            segui
              ? 'border-asfalto/15 bg-white/95 text-asfalto'
              : 'border-brand bg-brand text-white'
          }`}
          aria-label="Ricentra sulla mia posizione"
          title="Ricentra"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" strokeLinecap="round" />
          </svg>
        </button>
        {!segui && (
          <p className="pointer-events-none absolute bottom-4 left-4 z-[600] rounded-app bg-asfalto/90 px-2 py-1 font-mono text-[10px] font-bold uppercase text-white">
            Mappa libera
          </p>
        )}
      </div>

      {navOn && errore && (
        <p className="px-4 py-2 text-sm text-red-700">{errore}</p>
      )}

      {caricamento && (
        <p className="px-4 py-2 font-mono text-[10px] uppercase text-asfalto/45">Calcolo percorso…</p>
      )}

      <div className="flex flex-wrap gap-3 border-t border-asfalto/8 bg-white/80 px-4 py-3">
        <Link
          href="/traccia"
          className="font-mono text-[10px] font-bold uppercase tracking-wide text-asfalto/50 underline hover:text-brand"
        >
          Traccia il giro GPS →
        </Link>
      </div>
    </div>
  );
}

function ottieniPosizione(): Promise<Punto> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('GPS non disponibile.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => reject(new Error('Attiva il GPS.')),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 5000 },
    );
  });
}
