'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import RiepilogoGiroConcluso from '@/components/RiepilogoGiroConcluso';
import { useTracciamentoGiro } from '@/hooks/use-tracciamento-giro';
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
  const { user } = useAuth();
  const track = useTracciamentoGiro(user?.id);
  const [query, setQuery] = useState('');
  const [risultati, setRisultati] = useState<DestinazioneNav[]>([]);
  const [destinazione, setDestinazione] = useState<DestinazioneNav | null>(null);
  const [rotta, setRotta] = useState<RottaCalcolata | null>(null);
  const [navOn, setNavOn] = useState(false);
  const [caricamento, setCaricamento] = useState(false);
  const [erroreNav, setErroreNav] = useState<string | null>(null);
  const [segui, setSegui] = useState(true);
  const [ricentraTick, setRicentraTick] = useState(0);

  async function cerca() {
    setErroreNav(null);
    setCaricamento(true);
    try {
      const elenco = await cercaDestinazione(query);
      setRisultati(elenco);
      if (elenco.length === 0) setErroreNav('Nessun risultato. Prova un altro nome.');
    } catch (e) {
      setErroreNav(e instanceof Error ? e.message : 'Ricerca fallita.');
      setRisultati([]);
    } finally {
      setCaricamento(false);
    }
  }

  async function impostaDestinazione(dest: DestinazioneNav) {
    setDestinazione(dest);
    setRisultati([]);
    setQuery(dest.nome);
    setErroreNav(null);
    setCaricamento(true);
    try {
      const partenza = track.posizioneLive ?? (await ottieniPosizione());
      const nuova = await calcolaRotta(partenza, dest);
      setRotta(nuova);
      setNavOn(true);
      setSegui(true);
      setRicentraTick((t) => t + 1);

      if (track.stato === 'pronto') {
        const titolo = dest.nome.length > 40 ? `${dest.nome.slice(0, 37)}…` : dest.nome;
        track.setLuogoCard(titolo);
        track.iniziaPercorso(titolo);
      }
    } catch (e) {
      setErroreNav(e instanceof Error ? e.message : 'Percorso non calcolato.');
      setRotta(null);
      setNavOn(false);
    } finally {
      setCaricamento(false);
    }
  }

  function chiudiNav() {
    if (track.stato === 'in_corso' && !window.confirm('Chiudere le indicazioni? Il tracciamento GPS continua.')) {
      return;
    }
    setNavOn(false);
    setDestinazione(null);
    setRotta(null);
    setRisultati([]);
  }

  function ricentra() {
    setSegui(true);
    setRicentraTick((t) => t + 1);
  }

  const posizione = track.posizioneLive;
  const passoIdx = rotta && posizione ? indicePassoCorrente(rotta.passi, posizione) : 0;
  const passo = rotta?.passi[passoIdx] ?? null;
  const distanzaMano = passo && posizione ? distanzaAlPasso(posizione, passo) : null;
  const inGiro = track.stato === 'in_corso' || track.stato === 'in_pausa';

  if (track.stato === 'concluso' && track.giroConcluso) {
    return (
      <div className="px-4 py-4">
        <RiepilogoGiroConcluso
          giroConcluso={track.giroConcluso}
          distanzaM={track.distanzaM}
          durataSec={track.durataSec}
          punti={track.punti}
          luogoCard={track.luogoCard}
          onLuogoCardChange={track.setLuogoCard}
          salvataggioCloud={track.salvataggioCloud}
          loggato={!!user}
          onNomeChange={track.aggiornaNomeGiro}
          onPubblicoChange={track.giroConcluso.cloudId ? track.impostaGiroPubblico : undefined}
          onElimina={track.eliminaGiroConcluso}
          onNuovoGiro={() => {
            track.nuovoGiro();
            setNavOn(false);
            setDestinazione(null);
            setRotta(null);
          }}
          info={track.info}
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100dvh-4rem)] flex-col">
      {!navOn && (
        <div className="border-b border-white/10 bg-[#1a1f24] px-4 py-4 text-cemento shadow-[0_8px_24px_rgba(0,0,0,0.28)]">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-brand-chiaro">Navigatore</p>
          <p className="mt-1 text-sm leading-relaxed text-cemento/80">
            Scegli dove andare: il <strong>giro GPS parte in automatico</strong> e alla fine hai la card.
          </p>
          <div className="mt-3 flex gap-2">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && cerca()}
              placeholder="Dove vuoi andare?"
              className="input-app min-w-0 flex-1 border-white/15 bg-[#0f1215] text-cemento placeholder:text-cemento/70"
              maxLength={80}
            />
            <button
              type="button"
              onClick={cerca}
              disabled={caricamento || query.trim().length < 2}
              className="shrink-0 rounded-app bg-brand px-4 py-2 font-mono text-[10px] font-bold uppercase text-white shadow-brand transition-colors hover:bg-brand-chiaro disabled:bg-white/10 disabled:text-cemento/55 disabled:shadow-none"
            >
              Vai
            </button>
          </div>
          {risultati.length > 0 && (
            <ul className="mt-2 max-h-36 overflow-y-auto rounded-app border border-white/10 bg-[#101418] text-cemento">
              {risultati.map((r) => (
                <li key={`${r.lat}-${r.lng}`}>
                  <button
                    type="button"
                    onClick={() => impostaDestinazione(r)}
                    className="w-full px-3 py-2.5 text-left text-sm text-cemento/85 hover:bg-white/10 hover:text-white"
                  >
                    {r.nome}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {(erroreNav || track.errore) && (
            <p className="mt-2 rounded-app border border-red-400/25 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {erroreNav ?? track.errore}
            </p>
          )}
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

      {inGiro && (
        <div className="flex items-center justify-between gap-3 border-b border-bosco/20 bg-bosco/10 px-4 py-2">
          <p className="font-mono text-[11px] font-bold uppercase text-bosco">
            ● Giro in corso — {track.formattaKm(track.distanzaM)} km · {track.formattaDurata(track.durataSec)}
          </p>
          <button
            type="button"
            onClick={() => void track.terminaGiro()}
            className="rounded-app bg-asfalto px-3 py-1.5 font-mono text-[10px] font-bold uppercase text-cemento"
          >
            Termina
          </button>
        </div>
      )}

      <div className="relative min-h-[52dvh] flex-1 border-y border-asfalto/10">
        <MappaNavigatore
          posizione={posizione}
          percorsoNav={rotta?.percorso}
          percorsoGps={track.punti}
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

      {caricamento && (
        <p className="px-4 py-2 font-mono text-[10px] uppercase text-cemento/80">Calcolo percorso…</p>
      )}

      <div className="border-t border-white/10 bg-[#101418] px-4 py-3">
        <Link
          href="/traccia"
          className="font-mono text-[10px] font-bold uppercase tracking-wide text-cemento/80 underline hover:text-brand-chiaro"
        >
          Traccia un giro senza destinazione →
        </Link>
      </div>
    </div>
  );
}

function ottieniPosizione() {
  return new Promise<{ lat: number; lng: number }>((resolve, reject) => {
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
