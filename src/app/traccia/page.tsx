'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useAuth } from '@/components/AuthProvider';
import { distanzaMetri, formattaDurata, formattaKm, Punto } from '@/lib/geo';
import { generaCardGiro } from '@/lib/card-canvas';

const MappaTraccia = dynamic(() => import('@/components/MappaTraccia'), { ssr: false });

const STORAGE_KEY = 'girosecco_giri';
const SOGLIA_MOVIMENTO_M = 8; // ignora punti GPS che "ballano" da fermo
const ACCURATEZZA_MAX_M = 35; // ignora letture GPS troppo imprecise

type Stato = 'pronto' | 'in_corso' | 'in_pausa' | 'concluso';

interface GiroSalvato {
  id: string;
  data: string; // ISO
  km: number;
  durataSec: number;
  punti: Punto[];
}

function caricaStorico(): GiroSalvato[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as GiroSalvato[]) : [];
  } catch {
    return [];
  }
}

function salvaStorico(giri: GiroSalvato[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(giri.slice(0, 20)));
  } catch {
    // storage non disponibile (es. modalità privata): il giro resta visibile solo in sessione
  }
}

function formattaDataBreve(iso: string): string {
  return new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function PaginaTraccia() {
  const { user, loading } = useAuth();

  const [stato, setStato] = useState<Stato>('pronto');
  const [punti, setPunti] = useState<Punto[]>([]);
  const [distanzaM, setDistanzaM] = useState(0);
  const [durataSec, setDurataSec] = useState(0);
  const [errore, setErrore] = useState<string | null>(null);
  const [storico, setStorico] = useState<GiroSalvato[]>([]);
  const [cardUrl, setCardUrl] = useState<string | null>(null);
  const [generandoCard, setGenerandoCard] = useState(false);

  const watchIdRef = useRef<number | null>(null);
  const inizioRef = useRef<number | null>(null);
  const pausaAccumulataRef = useRef(0);
  const pausaInizioRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const puntiRef = useRef<Punto[]>([]);

  useEffect(() => {
    setStorico(caricaStorico());
  }, []);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function aggiornaDurata() {
    if (inizioRef.current === null) return;
    const adesso = Date.now();
    const trascorso = (adesso - inizioRef.current - pausaAccumulataRef.current) / 1000;
    setDurataSec(trascorso);
  }

  function aggiungiPunto(lat: number, lng: number, accuratezza: number) {
    if (accuratezza > ACCURATEZZA_MAX_M) return;

    const nuovo: Punto = { lat, lng };
    const precedente = puntiRef.current[puntiRef.current.length - 1];

    if (precedente) {
      const d = distanzaMetri(precedente, nuovo);
      if (d < SOGLIA_MOVIMENTO_M) return; // probabile rumore GPS da fermo
      setDistanzaM((prev) => prev + d);
    }

    puntiRef.current = [...puntiRef.current, nuovo];
    setPunti(puntiRef.current);
  }

  function iniziaPercorso() {
    setErrore(null);
    if (!('geolocation' in navigator)) {
      setErrore('Il tuo browser non supporta la geolocalizzazione.');
      return;
    }

    puntiRef.current = [];
    setPunti([]);
    setDistanzaM(0);
    setDurataSec(0);
    setCardUrl(null);
    inizioRef.current = Date.now();
    pausaAccumulataRef.current = 0;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        aggiungiPunto(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy ?? 999);
      },
      (err) => {
        setErrore(
          err.code === err.PERMISSION_DENIED
            ? 'Permesso posizione negato. Attivalo nelle impostazioni del browser per tracciare il giro.'
            : 'Non riesco a leggere la posizione GPS. Controlla di avere il GPS attivo.'
        );
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 }
    );

    timerRef.current = setInterval(aggiornaDurata, 1000);
    setStato('in_corso');
  }

  function metiInPausa() {
    pausaInizioRef.current = Date.now();
    if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    setStato('in_pausa');
  }

  function riprendiPercorso() {
    if (pausaInizioRef.current !== null) {
      pausaAccumulataRef.current += Date.now() - pausaInizioRef.current;
      pausaInizioRef.current = null;
    }
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        aggiungiPunto(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy ?? 999);
      },
      () => {
        setErrore('Non riesco a leggere la posizione GPS. Controlla di avere il GPS attivo.');
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 }
    );
    timerRef.current = setInterval(aggiornaDurata, 1000);
    setStato('in_corso');
  }

  function terminaGiro() {
    if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    aggiornaDurata();
    setStato('concluso');

    if (puntiRef.current.length > 1) {
      const nuovo: GiroSalvato = {
        id: `${Date.now()}`,
        data: new Date().toISOString(),
        km: distanzaM,
        durataSec,
        punti: puntiRef.current,
      };
      setStorico((prev) => {
        const aggiornato = [nuovo, ...prev];
        salvaStorico(aggiornato);
        return aggiornato;
      });
    }
  }

  function nuovoGiro() {
    setStato('pronto');
    setPunti([]);
    setDistanzaM(0);
    setDurataSec(0);
    setCardUrl(null);
    puntiRef.current = [];
  }

  async function creaCard(datiPunti: Punto[], km: number, durata: number, data: string) {
    setGenerandoCard(true);
    try {
      const url = await generaCardGiro({
        titolo: 'Giro libero',
        km: formattaKm(km),
        durata: formattaDurata(durata),
        data: formattaDataBreve(data),
        punti: datiPunti,
      });
      setCardUrl(url);
    } catch {
      setErrore('Non sono riuscito a generare la card. Riprova.');
    } finally {
      setGenerandoCard(false);
    }
  }

  function scaricaCard() {
    if (!cardUrl) return;
    const a = document.createElement('a');
    a.href = cardUrl;
    a.download = 'girosecco-giro.png';
    a.click();
  }

  async function condividiCard() {
    if (!cardUrl) return;
    try {
      const res = await fetch(cardUrl);
      const blob = await res.blob();
      const file = new File([blob], 'girosecco-giro.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Il mio giro su GiroSecco',
          text: 'Fatto con GiroSecco',
        });
        return;
      }
    } catch {
      // se la condivisione nativa non è disponibile, si scarica il file
    }
    scaricaCard();
  }

  // --- Render: stati account ---

  if (loading) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-14">
        <p className="font-mono text-sm uppercase text-asfalto/40">Caricamento…</p>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-14">
        <p className="font-mono text-sm uppercase tracking-widest text-cartello">GiroSecco</p>
        <h1 className="mt-1 font-display text-5xl font-bold uppercase leading-none tracking-tight">
          Traccia un giro
        </h1>
        <div className="mt-8 border-2 border-asfalto bg-asfalto p-6 text-cemento">
          <p className="text-guardrail">
            Registra il tuo percorso via GPS e genera la card da condividere su
            TikTok e Instagram. Serve un account gratuito.
          </p>
          <a
            href="/accedi#registrati"
            className="mt-4 inline-block bg-segnale px-5 py-2.5 font-mono font-medium uppercase text-asfalto hover:bg-white"
          >
            Registrati gratis
          </a>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-2xl px-4 py-14">
      <p className="font-mono text-sm uppercase tracking-widest text-cartello">GiroSecco</p>
      <h1 className="mt-1 font-display text-5xl font-bold uppercase leading-none tracking-tight">
        Traccia un giro
      </h1>
      <p className="mt-3 text-asfalto/70">
        Registra il percorso via GPS. Funziona meglio all&apos;aperto e con il
        telefono che resta sveglio (schermo acceso o blocco automatico
        disattivato).
      </p>

      {errore && (
        <p className="mt-4 border-2 border-red-700 bg-red-50 p-3 text-sm text-red-900">{errore}</p>
      )}

      {/* Stats live */}
      {stato !== 'pronto' && (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="border-2 border-asfalto bg-white p-4 text-center">
            <p className="font-mono text-xs uppercase text-asfalto/50">Distanza</p>
            <p className="font-display text-3xl font-bold">{formattaKm(distanzaM)} km</p>
          </div>
          <div className="border-2 border-asfalto bg-white p-4 text-center">
            <p className="font-mono text-xs uppercase text-asfalto/50">Tempo</p>
            <p className="font-display text-3xl font-bold">{formattaDurata(durataSec)}</p>
          </div>
          <div className="col-span-2 border-2 border-asfalto bg-white p-4 text-center sm:col-span-1">
            <p className="font-mono text-xs uppercase text-asfalto/50">Stato</p>
            <p className="font-display text-3xl font-bold uppercase">
              {stato === 'in_corso' && <span className="text-bosco">● In corso</span>}
              {stato === 'in_pausa' && <span className="text-cartello">In pausa</span>}
              {stato === 'concluso' && <span>Concluso</span>}
            </p>
          </div>
        </div>
      )}

      {/* Mappa live */}
      {punti.length > 0 && (
        <div className="mt-6">
          <MappaTraccia punti={punti} inCorso={stato === 'in_corso'} />
        </div>
      )}

      {/* Controlli */}
      <div className="mt-6 flex flex-wrap gap-3">
        {stato === 'pronto' && (
          <button
            type="button"
            onClick={iniziaPercorso}
            className="bg-segnale px-6 py-3 font-mono font-medium uppercase text-asfalto hover:bg-white"
          >
            Inizia percorso
          </button>
        )}
        {stato === 'in_corso' && (
          <>
            <button
              type="button"
              onClick={metiInPausa}
              className="border-2 border-asfalto px-6 py-3 font-mono font-medium uppercase hover:bg-asfalto hover:text-cemento"
            >
              Pausa
            </button>
            <button
              type="button"
              onClick={terminaGiro}
              className="bg-asfalto px-6 py-3 font-mono font-medium uppercase text-cemento hover:bg-cartello"
            >
              Termina giro
            </button>
          </>
        )}
        {stato === 'in_pausa' && (
          <>
            <button
              type="button"
              onClick={riprendiPercorso}
              className="bg-segnale px-6 py-3 font-mono font-medium uppercase text-asfalto hover:bg-white"
            >
              Riprendi
            </button>
            <button
              type="button"
              onClick={terminaGiro}
              className="bg-asfalto px-6 py-3 font-mono font-medium uppercase text-cemento hover:bg-cartello"
            >
              Termina giro
            </button>
          </>
        )}
      </div>

      {/* Riepilogo + card */}
      {stato === 'concluso' && (
        <div className="mt-8 border-2 border-segnale bg-white p-6">
          <h2 className="font-display text-2xl font-bold uppercase tracking-tight">
            Giro registrato
          </h2>
          <p className="mt-1 text-asfalto/70">
            {formattaKm(distanzaM)} km in {formattaDurata(durataSec)}.
          </p>

          {!cardUrl ? (
            <button
              type="button"
              onClick={() => creaCard(punti, distanzaM, durataSec, new Date().toISOString())}
              disabled={generandoCard}
              className="mt-4 bg-segnale px-5 py-2.5 font-mono font-medium uppercase text-asfalto hover:bg-white disabled:opacity-60"
            >
              {generandoCard ? 'Genero la card…' : 'Crea la card da condividere'}
            </button>
          ) : (
            <div className="mt-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={cardUrl} alt="Card del giro" className="w-full max-w-xs border-2 border-asfalto" />
              <div className="mt-3 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={condividiCard}
                  className="bg-segnale px-5 py-2.5 font-mono font-medium uppercase text-asfalto hover:bg-white"
                >
                  Condividi
                </button>
                <button
                  type="button"
                  onClick={scaricaCard}
                  className="border-2 border-asfalto px-5 py-2.5 font-mono font-medium uppercase hover:bg-asfalto hover:text-cemento"
                >
                  Scarica
                </button>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={nuovoGiro}
            className="mt-4 block font-mono text-sm uppercase text-asfalto/60 underline hover:text-asfalto"
          >
            Traccia un altro giro
          </button>
        </div>
      )}

      {/* Storico */}
      {storico.length > 0 && stato === 'pronto' && (
        <div className="mt-10">
          <h2 className="font-display text-2xl font-bold uppercase tracking-tight">I tuoi giri</h2>
          <ul className="mt-3 divide-y-2 divide-asfalto/10 border-2 border-asfalto bg-white">
            {storico.map((g) => (
              <li key={g.id} className="flex items-center justify-between gap-4 p-4">
                <div>
                  <p className="font-medium">{formattaDataBreve(g.data)}</p>
                  <p className="font-mono text-xs text-asfalto/50">
                    {formattaKm(g.km)} km · {formattaDurata(g.durataSec)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => creaCard(g.punti, g.km, g.durataSec, g.data)}
                  className="shrink-0 border-2 border-asfalto px-3 py-1.5 font-mono text-xs font-medium uppercase hover:bg-asfalto hover:text-cemento"
                >
                  Card
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-2 font-mono text-xs text-asfalto/40">
            Salvati solo su questo dispositivo.
          </p>
        </div>
      )}

      <p className="mt-10">
        <Link href="/hub" className="font-mono text-sm uppercase text-asfalto/60 underline hover:text-asfalto">
          ← Torna all&apos;hub
        </Link>
      </p>
    </section>
  );
}
