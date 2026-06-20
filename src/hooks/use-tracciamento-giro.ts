'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { distanzaMetri, formattaDurata, formattaKm, statisticheGiro, type Punto } from '@/lib/geo';
import { getSupabaseBrowser } from '@/lib/supabase-browser';
import {
  aggiornaGiroCloud,
  eliminaGiroUtente,
  giroDaSessione,
  salvaGiroCloud,
  salvaGiroLocale,
  type GiroUtente,
} from '@/lib/giri-store';

const SOGLIA_MOVIMENTO_M = 8;
const ACCURATEZZA_MAX_M = 35;
const SOGLIA_FERMO_RAGGIO_M = 50;
const TIMEOUT_FERMO_MS = 60 * 60 * 1000;
const BUFFER_PRIMA_FERMO_MS = 30_000;

export type StatoTraccia = 'pronto' | 'in_corso' | 'in_pausa' | 'concluso';

function distanzaDaPunti(punti: Punto[]): number {
  let tot = 0;
  for (let i = 1; i < punti.length; i++) tot += distanzaMetri(punti[i - 1], punti[i]);
  return tot;
}

export function useTracciamentoGiro(userId: string | undefined) {
  const [stato, setStato] = useState<StatoTraccia>('pronto');
  const [punti, setPunti] = useState<Punto[]>([]);
  const [distanzaM, setDistanzaM] = useState(0);
  const [durataSec, setDurataSec] = useState(0);
  const [velCorrenteKmh, setVelCorrenteKmh] = useState(0);
  const [luogoCard, setLuogoCard] = useState('');
  const [giroConcluso, setGiroConcluso] = useState<GiroUtente | null>(null);
  const [salvataggioCloud, setSalvataggioCloud] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [posizioneLive, setPosizioneLive] = useState<Punto | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const inizioRef = useRef<number | null>(null);
  const pausaAccumulataRef = useRef(0);
  const pausaInizioRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const puntiRef = useRef<Punto[]>([]);
  const distanzaRef = useRef(0);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const fermoAnchorRef = useRef<Punto | null>(null);
  const fermoInizioRef = useRef<number | null>(null);
  const terminaInCorsoRef = useRef(false);
  const statoRef = useRef<StatoTraccia>('pronto');

  useEffect(() => {
    statoRef.current = stato;
  }, [stato]);

  async function attivaWakeLock() {
    if (!('wakeLock' in navigator)) return;
    try {
      wakeLockRef.current = await (
        navigator as unknown as { wakeLock: { request: (t: string) => Promise<WakeLockSentinel> } }
      ).wakeLock.request('screen');
    } catch {
      // non critico
    }
  }

  function rilasciaWakeLock() {
    wakeLockRef.current?.release().catch(() => {});
    wakeLockRef.current = null;
  }

  function attivaAudioSilenzioso() {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      gain.gain.value = 0;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      audioCtxRef.current = ctx;
    } catch {
      // non critico
    }
  }

  function rilasciaAudioSilenzioso() {
    try {
      audioCtxRef.current?.close();
    } catch {
      // ignora
    }
    audioCtxRef.current = null;
  }

  function fermaGps() {
    if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    watchIdRef.current = null;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    rilasciaWakeLock();
    rilasciaAudioSilenzioso();
  }

  function aggiornaDurata() {
    if (inizioRef.current === null) return;
    const trascorso = (Date.now() - inizioRef.current - pausaAccumulataRef.current) / 1000;
    setDurataSec(trascorso);
  }

  const salvaGiroFinale = useCallback(
    async (puntiFinali: Punto[], distanzaFinale: number, durataFinale: number, titolo: string) => {
      if (puntiFinali.length <= 1) {
        setErrore('Percorso troppo corto per salvare il giro.');
        setStato('pronto');
        return;
      }

      const stat = statisticheGiro(puntiFinali, durataFinale, distanzaFinale);
      let giro = giroDaSessione(puntiFinali, distanzaFinale, durataFinale, stat, titolo);
      setGiroConcluso(giro);
      setPunti(puntiFinali);
      setDistanzaM(distanzaFinale);
      setDurataSec(durataFinale);
      setStato('concluso');

      const supabase = getSupabaseBrowser();
      if (supabase && userId) {
        setSalvataggioCloud(true);
        try {
          giro = await salvaGiroCloud(supabase, userId, giro, titolo);
          setGiroConcluso(giro);
        } catch {
          salvaGiroLocale({
            id: giro.id,
            data: giro.data,
            km: giro.km,
            durataSec: giro.durataSec,
            punti: giro.punti,
            velMediaKmh: giro.velMediaKmh,
            velMaxKmh: giro.velMaxKmh,
            dislivelloM: giro.dislivelloM,
            curve: giro.curve,
          });
          setErrore('Giro salvato solo in locale. Riprova quando hai connessione.');
        } finally {
          setSalvataggioCloud(false);
        }
      } else {
        salvaGiroLocale({
          id: giro.id,
          data: giro.data,
          km: giro.km,
          durataSec: giro.durataSec,
          punti: giro.punti,
          velMediaKmh: giro.velMediaKmh,
          velMaxKmh: giro.velMaxKmh,
          dislivelloM: giro.dislivelloM,
          curve: giro.curve,
        });
      }
    },
    [userId],
  );

  const terminaGiro = useCallback(
    async (opts?: { auto?: boolean; fermoDa?: number }) => {
      if (terminaInCorsoRef.current) return;
      terminaInCorsoRef.current = true;
      fermaGps();
      aggiornaDurata();

      let puntiFinali = [...puntiRef.current];
      let taglioTs: number | null = null;

      if (opts?.auto && opts.fermoDa) {
        taglioTs = opts.fermoDa - BUFFER_PRIMA_FERMO_MS;
        puntiFinali = puntiFinali.filter((p) => !p.t || p.t <= taglioTs!);
        setInfo('Giro interrotto automaticamente: fermo da oltre 1 ora nello stesso punto.');
      }

      const distanzaFinale = distanzaDaPunti(puntiFinali);
      const durataFinale =
        taglioTs && inizioRef.current
          ? Math.max(0, (taglioTs - inizioRef.current - pausaAccumulataRef.current) / 1000)
          : inizioRef.current
            ? (Date.now() - inizioRef.current - pausaAccumulataRef.current) / 1000
            : durataSec;

      const titolo = luogoCard.trim() || 'Giro libero';
      await salvaGiroFinale(puntiFinali, distanzaFinale, durataFinale, titolo);
      terminaInCorsoRef.current = false;
    },
    [durataSec, luogoCard, salvaGiroFinale],
  );

  function verificaFermo(lat: number, lng: number) {
    if (statoRef.current !== 'in_corso') return;
    const ora = Date.now();
    const pos = { lat, lng };

    if (!fermoAnchorRef.current) {
      fermoAnchorRef.current = pos;
      fermoInizioRef.current = ora;
      return;
    }

    const distanzaDalAncora = distanzaMetri(fermoAnchorRef.current, pos);
    if (distanzaDalAncora > SOGLIA_FERMO_RAGGIO_M) {
      fermoAnchorRef.current = pos;
      fermoInizioRef.current = ora;
      return;
    }

    if (fermoInizioRef.current && ora - fermoInizioRef.current >= TIMEOUT_FERMO_MS) {
      void terminaGiro({ auto: true, fermoDa: fermoInizioRef.current });
    }
  }

  function aggiungiPunto(
    lat: number,
    lng: number,
    accuratezza: number,
    alt?: number | null,
    vel?: number | null,
  ) {
    setPosizioneLive({ lat, lng });
    verificaFermo(lat, lng);

    if (accuratezza > ACCURATEZZA_MAX_M) return;

    const nuovo: Punto = { lat, lng, alt: alt ?? null, vel: vel ?? null, t: Date.now() };
    const precedente = puntiRef.current[puntiRef.current.length - 1];

    if (typeof vel === 'number' && vel >= 0) {
      setVelCorrenteKmh(Math.round(vel * 3.6));
    } else if (precedente?.t) {
      const dt = (Date.now() - precedente.t) / 1000;
      if (dt > 0) setVelCorrenteKmh(Math.round((distanzaMetri(precedente, nuovo) / dt) * 3.6));
    }

    if (precedente) {
      const d = distanzaMetri(precedente, nuovo);
      if (d < SOGLIA_MOVIMENTO_M) return;
      distanzaRef.current += d;
      setDistanzaM(distanzaRef.current);
    }

    puntiRef.current = [...puntiRef.current, nuovo];
    setPunti(puntiRef.current);
  }

  function avviaWatch() {
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        aggiungiPunto(
          pos.coords.latitude,
          pos.coords.longitude,
          pos.coords.accuracy ?? 999,
          pos.coords.altitude,
          pos.coords.speed,
        );
      },
      (err) => {
        setErrore(
          err.code === err.PERMISSION_DENIED
            ? 'Permesso posizione negato. Attivalo nelle impostazioni del browser.'
            : 'Non riesco a leggere la posizione GPS.',
        );
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 },
    );
    timerRef.current = setInterval(aggiornaDurata, 1000);
  }

  const iniziaPercorso = useCallback((titoloIniziale?: string) => {
    setErrore(null);
    setInfo(null);
    if (!('geolocation' in navigator)) {
      setErrore('Il tuo browser non supporta la geolocalizzazione.');
      return false;
    }

    attivaWakeLock();
    attivaAudioSilenzioso();
    puntiRef.current = [];
    distanzaRef.current = 0;
    fermoAnchorRef.current = null;
    fermoInizioRef.current = null;
    setPunti([]);
    setDistanzaM(0);
    setDurataSec(0);
    setVelCorrenteKmh(0);
    setGiroConcluso(null);
    if (titoloIniziale) setLuogoCard(titoloIniziale);
    inizioRef.current = Date.now();
    pausaAccumulataRef.current = 0;
    pausaInizioRef.current = null;

    avviaWatch();
    setStato('in_corso');
    return true;
  }, []);

  const metiInPausa = useCallback(() => {
    pausaInizioRef.current = Date.now();
    if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    watchIdRef.current = null;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setStato('in_pausa');
  }, []);

  const riprendiPercorso = useCallback(() => {
    if (pausaInizioRef.current !== null) {
      pausaAccumulataRef.current += Date.now() - pausaInizioRef.current;
      pausaInizioRef.current = null;
    }
    avviaWatch();
    setStato('in_corso');
  }, []);

  const annullaPercorso = useCallback(() => {
    if (!window.confirm('Annullare il giro in corso? Non verrà salvato.')) return;
    fermaGps();
    puntiRef.current = [];
    distanzaRef.current = 0;
    fermoAnchorRef.current = null;
    fermoInizioRef.current = null;
    inizioRef.current = null;
    setStato('pronto');
    setPunti([]);
    setDistanzaM(0);
    setDurataSec(0);
    setVelCorrenteKmh(0);
    setGiroConcluso(null);
    setInfo(null);
  }, []);

  const nuovoGiro = useCallback(() => {
    fermaGps();
    puntiRef.current = [];
    distanzaRef.current = 0;
    fermoAnchorRef.current = null;
    fermoInizioRef.current = null;
    inizioRef.current = null;
    setStato('pronto');
    setPunti([]);
    setDistanzaM(0);
    setDurataSec(0);
    setVelCorrenteKmh(0);
    setGiroConcluso(null);
    setLuogoCard('');
    setInfo(null);
    setErrore(null);
  }, []);

  async function impostaGiroPubblico(pubblico: boolean) {
    if (!giroConcluso?.cloudId) return;
    const supabase = getSupabaseBrowser();
    if (!supabase) return;
    try {
      await aggiornaGiroCloud(supabase, giroConcluso.cloudId, { pubblico });
      setGiroConcluso({ ...giroConcluso, pubblico });
    } catch {
      setErrore('Non riesco ad aggiornare la visibilità del giro.');
    }
  }

  async function aggiornaNomeGiro(nome: string) {
    if (!giroConcluso?.cloudId) {
      setGiroConcluso((g) => (g ? { ...g, nome } : g));
      return;
    }
    const supabase = getSupabaseBrowser();
    if (!supabase) return;
    try {
      await aggiornaGiroCloud(supabase, giroConcluso.cloudId, { nome });
      setGiroConcluso({ ...giroConcluso, nome });
      setLuogoCard(nome === 'Giro libero' ? '' : nome);
    } catch {
      setErrore('Non riesco a rinominare il giro.');
    }
  }

  async function eliminaGiroConcluso() {
    if (!giroConcluso) return;
    if (!window.confirm('Eliminare questo giro salvato?')) return;
    const supabase = getSupabaseBrowser();
    setSalvataggioCloud(true);
    try {
      await eliminaGiroUtente(supabase, giroConcluso);
      nuovoGiro();
    } catch {
      setErrore('Non riesco a eliminare il giro.');
    } finally {
      setSalvataggioCloud(false);
    }
  }

  /** Posizione GPS per mappa quando il giro non è attivo */
  useEffect(() => {
    if (stato === 'in_corso' || stato === 'in_pausa' || stato === 'concluso') return;
    if (!('geolocation' in navigator)) return;
    const id = navigator.geolocation.watchPosition(
      (pos) => setPosizioneLive({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [stato]);

  useEffect(() => {
    return () => fermaGps();
  }, []);

  return {
    stato,
    punti,
    distanzaM,
    durataSec,
    velCorrenteKmh,
    luogoCard,
    setLuogoCard,
    giroConcluso,
    salvataggioCloud,
    errore,
    info,
    posizioneLive,
    iniziaPercorso,
    metiInPausa,
    riprendiPercorso,
    terminaGiro,
    annullaPercorso,
    nuovoGiro,
    impostaGiroPubblico,
    aggiornaNomeGiro,
    eliminaGiroConcluso,
    formattaKm,
    formattaDurata,
  };
}
