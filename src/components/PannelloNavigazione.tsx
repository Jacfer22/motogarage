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
    if (navOn && rotta && posizione) {
      aggiornaPasso(rotta, posizione);
    }
  }, [navOn, rotta, posizione, attiva, aggiornaPasso]);

  const passoIdx = rotta && posizione ? indicePassoCorrente(rotta.passi, posizione) : 0;
  const passo = rotta?.passi[passoIdx] ?? null;
  const distanzaMano = passo && posizione ? distanzaAlPasso(posizione, passo) : null;

  return (
    <div className="overflow-hidden rounded-app-lg border-2 border-brand/35 bg-gradient-to-br from-asfalto via-carbone to-notte p-5 shadow-[0_12px_40px_rgba(237,33,0,0.18)] sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-brand">Navigatore integrato</p>
          <h2 className="mt-1 font-display text-2xl font-black uppercase leading-none tracking-tight text-white sm:text-3xl">
            Dove vuoi andare?
          </h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-cemento/75">
            Strumento di supporto mentre guidi. Il <strong className="text-white">giro GPS resta sempre il tuo percorso reale</strong>
            {' '}— la linea gialla sulla mappa è quella che conta per km, curve e card social.
          </p>
        </div>
        {navOn && (
          <button
            type="button"
            onClick={disattiva}
            className="shrink-0 rounded-app border border-white/15 px-3 py-1.5 font-mono text-[10px] font-bold uppercase text-cemento/70 transition-colors hover:border-white/30 hover:text-white"
          >
            Chiudi
          </button>
        )}
      </div>

      {!navOn && (
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && cerca()}
            placeholder="Passo, lago, bar, città…"
            className="input-app min-w-0 flex-1 border-white/15 bg-white/95 text-asfalto placeholder:text-asfalto/40"
            maxLength={80}
          />
          <button
            type="button"
            onClick={cerca}
            disabled={caricamento || query.trim().length < 2}
            className="shrink-0 rounded-app bg-brand px-6 py-3 font-mono text-xs font-bold uppercase text-white transition-colors hover:bg-brand-chiaro disabled:opacity-40"
          >
            Cerca
          </button>
        </div>
      )}

      {risultati.length > 0 && (
        <ul className="mt-3 max-h-44 overflow-y-auto rounded-app border border-white/10 bg-black/25">
          {risultati.map((r) => (
            <li key={`${r.lat}-${r.lng}`}>
              <button
                type="button"
                onClick={() => impostaDestinazione(r)}
                className="w-full px-4 py-3 text-left text-sm text-cemento transition-colors hover:bg-brand/15 hover:text-white"
              >
                {r.nome}
              </button>
            </li>
          ))}
        </ul>
      )}

      {errore && (
        <p className="mt-3 rounded-app border border-red-400/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-100">{errore}</p>
      )}

      {navOn && rotta && (
        <div className="mt-5 rounded-app border-2 border-brand/50 bg-black/30 p-5">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-brand">Prossima manovra</p>
          <p className="mt-2 font-display text-3xl font-black uppercase leading-tight tracking-tight text-white sm:text-4xl">
            {passo?.istruzione ?? 'Segui il percorso'}
          </p>
          {distanzaMano !== null && passo?.istruzione !== 'Sei arrivato a destinazione' && (
            <p className="mt-3 font-display text-5xl font-black leading-none text-brand sm:text-6xl">
              {formattaDistanzaNav(distanzaMano)}
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 font-mono text-[11px] uppercase tracking-wide text-cemento/55">
            <span>Destinazione: {destinazione?.nome}</span>
            <span>
              Strada: {formattaDistanzaNav(rotta.distanzaM)} · ~
              {Math.max(1, Math.round(rotta.durataSec / 60))} min
            </span>
          </div>
        </div>
      )}

      {caricamento && (
        <p className="mt-3 font-mono text-[11px] uppercase tracking-wide text-cemento/45">Calcolo percorso…</p>
      )}

      {!navOn && (
        <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-cemento/40">
          Poi premi Inizia percorso — traccia e naviga insieme, senza confondere i km.
        </p>
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
