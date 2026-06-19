'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useAuth } from '@/components/AuthProvider';
import { distanzaMetri, formattaDurata, formattaKm, statisticheGiro, Punto } from '@/lib/geo';
import { getSupabaseBrowser } from '@/lib/supabase-browser';
import {
  giroDaSessione,
  salvaGiroCloud,
  salvaGiroLocale,
  aggiornaGiroCloud,
  eliminaGiroUtente,
  type GiroUtente,
} from '@/lib/giri-store';
import EditorCardGiro from '@/components/EditorCardGiro';
import PannelloNavigazione from '@/components/PannelloNavigazione';
import type { DestinazioneNav, RottaCalcolata } from '@/lib/navigazione-osrm';

const MappaTraccia = dynamic(() => import('@/components/MappaTraccia'), { ssr: false });

const SOGLIA_MOVIMENTO_M = 8;
const ACCURATEZZA_MAX_M = 35;

type Stato = 'pronto' | 'in_corso' | 'in_pausa' | 'concluso';

export default function PaginaTraccia() {
  const { user, loading } = useAuth();

  const [stato, setStato] = useState<Stato>('pronto');
  const [punti, setPunti] = useState<Punto[]>([]);
  const [distanzaM, setDistanzaM] = useState(0);
  const [durataSec, setDurataSec] = useState(0);
  const [velCorrenteKmh, setVelCorrenteKmh] = useState(0);
  const [luogoCard, setLuogoCard] = useState('');
  const [giroConcluso, setGiroConcluso] = useState<GiroUtente | null>(null);
  const [salvataggioCloud, setSalvataggioCloud] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);
  const [percorsoNav, setPercorsoNav] = useState<RottaCalcolata['percorso']>([]);
  const [destinazioneNav, setDestinazioneNav] = useState<DestinazioneNav | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const inizioRef = useRef<number | null>(null);
  const pausaAccumulataRef = useRef(0);
  const pausaInizioRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const puntiRef = useRef<Punto[]>([]);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Tiene lo schermo acceso durante la traccia (evita che il GPS si fermi)
  async function attivaWakeLock() {
    if (!('wakeLock' in navigator)) return;
    try {
      wakeLockRef.current = await (navigator as unknown as { wakeLock: { request: (t: string) => Promise<WakeLockSentinel> } }).wakeLock.request('screen');
    } catch { /* non supportato: non critico */ }
  }
  function rilasciaWakeLock() {
    wakeLockRef.current?.release().catch(() => {});
    wakeLockRef.current = null;
  }

  // Audio silenzioso: tiene il browser "vivo" su Android quando lo schermo
  // va in background. Un oscillatore a volume 0 attiva la sessione audio
  // del browser — Android Chrome non sospende le tab con audio attivo,
  // quindi il GPS continua a ricevere punti anche a schermo spento.
  // Su iOS non ha effetto (Apple blocca comunque il background), ma non fa danni.
  function attivaAudioSilenzioso() {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      gain.gain.value = 0; // volume zero: completamente silenzioso
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      audioCtxRef.current = ctx;
    } catch { /* browser non supporta Web Audio: non critico */ }
  }
  function rilasciaAudioSilenzioso() {
    try {
      audioCtxRef.current?.close();
    } catch { /* ignora */ }
    audioCtxRef.current = null;
  }

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
      rilasciaWakeLock();
      rilasciaAudioSilenzioso();
    };
  }, []);

  function aggiornaDurata() {
    if (inizioRef.current === null) return;
    const adesso = Date.now();
    const trascorso = (adesso - inizioRef.current - pausaAccumulataRef.current) / 1000;
    setDurataSec(trascorso);
  }

  function aggiungiPunto(
    lat: number,
    lng: number,
    accuratezza: number,
    alt?: number | null,
    vel?: number | null
  ) {
    if (accuratezza > ACCURATEZZA_MAX_M) return;

    const nuovo: Punto = { lat, lng, alt: alt ?? null, vel: vel ?? null, t: Date.now() };
    const precedente = puntiRef.current[puntiRef.current.length - 1];

    // velocità live: dal GPS se disponibile, altrimenti stimata dall'ultimo segmento
    if (typeof vel === 'number' && vel >= 0) {
      setVelCorrenteKmh(Math.round(vel * 3.6));
    } else if (precedente && precedente.t) {
      const dt = (Date.now() - precedente.t) / 1000;
      if (dt > 0) setVelCorrenteKmh(Math.round((distanzaMetri(precedente, nuovo) / dt) * 3.6));
    }

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

    attivaWakeLock(); // schermo sempre acceso durante la traccia
    attivaAudioSilenzioso(); // GPS attivo in background su Android
    puntiRef.current = [];
    setPunti([]);
    setDistanzaM(0);
    setDurataSec(0);
    setVelCorrenteKmh(0);
    setGiroConcluso(null);
    inizioRef.current = Date.now();
    pausaAccumulataRef.current = 0;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        aggiungiPunto(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy ?? 999, pos.coords.altitude, pos.coords.speed);
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
        aggiungiPunto(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy ?? 999, pos.coords.altitude, pos.coords.speed);
      },
      () => {
        setErrore('Non riesco a leggere la posizione GPS. Controlla di avere il GPS attivo.');
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 }
    );
    timerRef.current = setInterval(aggiornaDurata, 1000);
    setStato('in_corso');
  }

  async function terminaGiro() {
    fermaGps();
    aggiornaDurata();
    setStato('concluso');

    if (puntiRef.current.length <= 1) return;

    const durataFinale = inizioRef.current
      ? (Date.now() - inizioRef.current - pausaAccumulataRef.current) / 1000
      : durataSec;
    setDurataSec(durataFinale);

    const stat = statisticheGiro(puntiRef.current, durataFinale, distanzaM);
    const titolo = luogoCard.trim() || 'Giro libero';
    let giro = giroDaSessione(puntiRef.current, distanzaM, durataFinale, stat, titolo);
    setGiroConcluso(giro);

    const supabase = getSupabaseBrowser();
    if (supabase && user) {
      setSalvataggioCloud(true);
      try {
        giro = await salvaGiroCloud(supabase, user.id, giro, titolo);
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
        setErrore('Giro salvato solo in locale. Riprova quando hai connessione, oppure apri I miei giri più tardi.');
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
  }

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
      setGiroConcluso((g) => g ? { ...g, nome } : g);
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

  function fermaGps() {
    if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    watchIdRef.current = null;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    rilasciaWakeLock();
    rilasciaAudioSilenzioso();
  }

  function annullaPercorso() {
    if (!window.confirm('Annullare il giro in corso? Non verrà salvato.')) return;
    fermaGps();
    nuovoGiro();
  }

  async function eliminaGiroConcluso() {
    if (!giroConcluso) return;
    if (!window.confirm('Eliminare questo giro salvato? Sparirà anche da I miei giri.')) return;
    const supabase = getSupabaseBrowser();
    setSalvataggioCloud(true);
    try {
      await eliminaGiroUtente(supabase, giroConcluso);
      nuovoGiro();
    } catch {
      setErrore('Non riesco a eliminare il giro. Riprova da I miei giri.');
    } finally {
      setSalvataggioCloud(false);
    }
  }

  function nuovoGiro() {
    fermaGps();
    setStato('pronto');
    setPunti([]);
    setDistanzaM(0);
    setDurataSec(0);
    setVelCorrenteKmh(0);
    setGiroConcluso(null);
    setLuogoCard('');
    setPercorsoNav([]);
    setDestinazioneNav(null);
    inizioRef.current = null;
    pausaAccumulataRef.current = 0;
    pausaInizioRef.current = null;
    puntiRef.current = [];
  }

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
        <p className="font-mono text-sm uppercase tracking-widest text-cartello">MotoGarage</p>
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
      <p className="font-mono text-sm uppercase tracking-widest text-cartello">MotoGarage</p>
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

      {stato !== 'concluso' && (
        <div className="mt-6">
          <PannelloNavigazione
            posizione={punti.length > 0 ? punti[punti.length - 1] : null}
            attiva={stato === 'in_corso' || stato === 'in_pausa'}
            onDestinazioneChange={setDestinazioneNav}
            onRottaChange={(r) => setPercorsoNav(r?.percorso ?? [])}
            onPassoChange={() => {}}
          />
        </div>
      )}

      {/* Stats live */}
      {stato !== 'pronto' && (
        <div className="mt-6 grid grid-cols-3 gap-3">
          <div className="card-app p-4 text-center">
            <p className="font-mono text-[11px] uppercase tracking-wide text-asfalto/50">Distanza</p>
            <p className="mt-1 font-display text-3xl font-bold leading-none">{formattaKm(distanzaM)}</p>
            <p className="font-mono text-[10px] uppercase text-asfalto/40">km</p>
          </div>
          <div className="card-app p-4 text-center">
            <p className="font-mono text-[11px] uppercase tracking-wide text-asfalto/50">Tempo</p>
            <p className="mt-1 font-display text-3xl font-bold leading-none">{formattaDurata(durataSec)}</p>
            <p className="font-mono text-[10px] uppercase text-asfalto/40">&nbsp;</p>
          </div>
          <div className="card-app p-4 text-center">
            <p className="font-mono text-[11px] uppercase tracking-wide text-asfalto/50">Velocità</p>
            <p className="mt-1 font-display text-3xl font-bold leading-none text-segnale-scuro">
              {stato === 'in_corso' ? velCorrenteKmh : 0}
            </p>
            <p className="font-mono text-[10px] uppercase text-asfalto/40">km/h</p>
          </div>
          <div className="col-span-3 text-center">
            <p className="font-mono text-xs uppercase tracking-wide">
              {stato === 'in_corso' && <span className="text-bosco">● In corso</span>}
              {stato === 'in_pausa' && <span className="text-cartello">‖ In pausa</span>}
              {stato === 'concluso' && <span className="text-asfalto/60">Concluso</span>}
            </p>
          </div>
        </div>
      )}

      {/* Mappa: percorso nav + tracciato GPS */}
      {(punti.length > 0 || percorsoNav.length > 0) && (
        <div className="mt-6">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-wide text-asfalto/45">
            {percorsoNav.length > 0 && punti.length > 0
              ? 'Blu = percorso stradale · Giallo = il tuo giro GPS'
              : percorsoNav.length > 0
                ? 'Percorso stradale verso destinazione'
                : 'Tracciato GPS in tempo reale'}
          </p>
          <MappaTraccia
            punti={punti}
            inCorso={stato === 'in_corso'}
            percorsoNav={percorsoNav}
            destinazione={destinazioneNav}
          />
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
            <button
              type="button"
              onClick={annullaPercorso}
              className="border-2 border-red-600/40 px-6 py-3 font-mono text-xs font-medium uppercase text-red-700 hover:bg-red-50"
            >
              Annulla
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
            <button
              type="button"
              onClick={annullaPercorso}
              className="border-2 border-red-600/40 px-6 py-3 font-mono text-xs font-medium uppercase text-red-700 hover:bg-red-50"
            >
              Annulla
            </button>
          </>
        )}
      </div>

      {/* Riepilogo + card */}
      {stato === 'concluso' && giroConcluso && (
        <div className="mt-8 rounded-app-lg border border-segnale bg-white p-6 shadow-app animate-scale-in">
          <h2 className="font-display text-2xl font-bold uppercase tracking-tight">
            Giro registrato
          </h2>
          <p className="mt-1 text-asfalto/70">
            {formattaKm(distanzaM)} km in {formattaDurata(durataSec)}.
          </p>

          {(() => {
            const s = statisticheGiro(punti, durataSec, distanzaM);
            const stats = [
              { l: 'Vel. media', v: `${s.velMediaKmh}`, u: 'km/h' },
              { l: 'Vel. max', v: `${s.velMaxKmh}`, u: 'km/h' },
              { l: 'Curve', v: `${s.curve}`, u: '' },
              { l: 'Dislivello', v: `${s.dislivelloPositivoM}`, u: 'm' },
            ];
            return (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {stats.map((x) => (
                  <div key={x.l} className="rounded-app bg-cemento p-3 text-center">
                    <p className="font-mono text-[10px] uppercase tracking-wide text-asfalto/50">{x.l}</p>
                    <p className="mt-0.5 font-display text-2xl font-bold leading-none">{x.v}</p>
                    {x.u && <p className="font-mono text-[10px] uppercase text-asfalto/40">{x.u}</p>}
                  </div>
                ))}
              </div>
            );
          })()}

          <p className="mt-4 font-mono text-xs uppercase tracking-wide text-asfalto/50">
            {salvataggioCloud
              ? 'Salvataggio nel cloud…'
              : giroConcluso.cloudId
                ? '✓ Salvato nel cloud — visibile da ogni dispositivo'
                : user
                  ? 'Salvato in locale — sincronizza da I miei giri'
                  : 'Accedi per salvare nel cloud'}
          </p>

          <div className="mt-4">
            <p className="mb-1.5 font-mono text-[11px] uppercase tracking-wide text-asfalto/40">Nome giro (opzionale)</p>
            <input
              type="text"
              value={luogoCard}
              onChange={(e) => setLuogoCard(e.target.value)}
              placeholder="Es. Lago di Bracciano"
              maxLength={40}
              className="input-app w-full"
            />
          </div>

          <div className="mt-4">
            <EditorCardGiro
              giro={giroConcluso}
              onNomeChange={aggiornaNomeGiro}
              onPubblicoChange={giroConcluso.cloudId ? impostaGiroPubblico : undefined}
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/giri"
              className="rounded-app border border-asfalto/15 px-4 py-2.5 font-mono text-xs font-bold uppercase hover:border-brand hover:text-brand"
            >
              I miei giri
            </Link>
            <button
              type="button"
              onClick={eliminaGiroConcluso}
              disabled={salvataggioCloud}
              className="rounded-app border border-red-500/35 bg-red-500/10 px-4 py-2.5 font-mono text-xs font-bold uppercase text-red-600 hover:bg-red-500/15 disabled:opacity-40"
            >
              Elimina giro
            </button>
            <button
              type="button"
              onClick={nuovoGiro}
              className="font-mono text-xs uppercase text-asfalto/60 underline hover:text-asfalto"
            >
              Traccia un altro giro
            </button>
          </div>
        </div>
      )}

      {stato === 'pronto' && user && (
        <div className="mt-10 rounded-app-lg border border-asfalto/10 bg-asfalto/[0.03] p-5">
          <h2 className="font-display text-xl font-bold uppercase tracking-tight">I miei giri salvati</h2>
          <p className="mt-2 text-sm text-asfalto/60">
            Tutti i percorsi GPS sono nel cloud. Puoi tornare quando vuoi e creare la card da qualsiasi telefono.
          </p>
          <Link href="/giri" className="tap mt-4 inline-block rounded-app bg-asfalto px-5 py-3 font-mono text-xs font-bold uppercase text-cemento hover:bg-brand hover:text-white">
            Apri I miei giri
          </Link>
        </div>
      )}

      <p className="mt-10 flex flex-wrap gap-4">
        <Link href="/giri" className="font-mono text-sm uppercase text-asfalto/60 underline hover:text-asfalto">
          I miei giri
        </Link>
        <Link href="/hub" className="font-mono text-sm uppercase text-asfalto/60 underline hover:text-asfalto">
          ← Hub
        </Link>
      </p>
    </section>
  );
}
