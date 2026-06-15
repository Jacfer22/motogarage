'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useAuth } from '@/components/AuthProvider';
import { distanzaMetri, formattaDurata, formattaKm, statisticheGiro, Punto } from '@/lib/geo';
import { generaCardGiro } from '@/lib/card-canvas';
import { getSupabaseBrowser } from '@/lib/supabase-browser';

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
  velMediaKmh?: number;
  velMaxKmh?: number;
  dislivelloM?: number;
  curve?: number;
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
  const [velCorrenteKmh, setVelCorrenteKmh] = useState(0);
  const [fotoCard, setFotoCard] = useState<string | null>(null);
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

    puntiRef.current = [];
    setPunti([]);
    setDistanzaM(0);
    setDurataSec(0);
    setVelCorrenteKmh(0);
    setCardUrl(null);
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

  function terminaGiro() {
    if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    aggiornaDurata();
    setStato('concluso');

    if (puntiRef.current.length > 1) {
      const stat = statisticheGiro(puntiRef.current, durataSec, distanzaM);
      const nuovo: GiroSalvato = {
        id: `${Date.now()}`,
        data: new Date().toISOString(),
        km: distanzaM,
        durataSec,
        punti: puntiRef.current,
        velMediaKmh: stat.velMediaKmh,
        velMaxKmh: stat.velMaxKmh,
        dislivelloM: stat.dislivelloPositivoM,
        curve: stat.curve,
      };
      setStorico((prev) => {
        const aggiornato = [nuovo, ...prev];
        salvaStorico(aggiornato);
        return aggiornato;
      });
      // salvataggio nel cloud per chi è loggato (così resta su ogni dispositivo)
      salvaGiroCloud(nuovo, stat);
    }
  }

  async function salvaGiroCloud(
    giro: GiroSalvato,
    stat: ReturnType<typeof statisticheGiro>
  ) {
    const supabase = getSupabaseBrowser();
    if (!supabase || !user) return;
    try {
      await supabase.from('giri').insert({
        utente_id: user.id,
        nome: 'Giro libero',
        km: Number((giro.km / 1000).toFixed(2)),
        durata_sec: Math.round(giro.durataSec),
        vel_media_kmh: stat.velMediaKmh,
        vel_max_kmh: stat.velMaxKmh,
        dislivello_m: stat.dislivelloPositivoM,
        curve: stat.curve,
        tracciato: giro.punti.map((p) => [p.lat, p.lng]),
      });
    } catch {
      // se il salvataggio cloud fallisce, il giro resta comunque in locale
    }
  }

  function nuovoGiro() {
    setStato('pronto');
    setPunti([]);
    setDistanzaM(0);
    setDurataSec(0);
    setVelCorrenteKmh(0);
    setCardUrl(null);
    puntiRef.current = [];
  }

  async function creaCard(
    datiPunti: Punto[],
    km: number,
    durata: number,
    data: string,
    foto?: string | null
  ) {
    setGenerandoCard(true);
    try {
      const stat = statisticheGiro(datiPunti, durata, km);
      const url = await generaCardGiro({
        titolo: 'Giro libero',
        km: formattaKm(km),
        durata: formattaDurata(durata),
        data: formattaDataBreve(data),
        punti: datiPunti,
        fotoDataUrl: foto ?? null,
        dislivelloM: stat.dislivelloPositivoM,
        velMediaKmh: stat.velMediaKmh,
        curve: stat.curve,
      });
      setCardUrl(url);
    } catch {
      setErrore('Non sono riuscito a generare la card. Riprova.');
    } finally {
      setGenerandoCard(false);
    }
  }

  // Legge la foto scelta come data URL (ridimensionata per non pesare troppo)
  async function scegliFotoCard(file: File): Promise<string> {
    const bitmap = await createImageBitmap(file);
    const max = 1280;
    let { width, height } = bitmap;
    if (width > max || height > max) {
      if (width >= height) {
        height = Math.round((height * max) / width);
        width = max;
      } else {
        width = Math.round((width * max) / height);
        height = max;
      }
    }
    const c = document.createElement('canvas');
    c.width = width;
    c.height = height;
    const cx = c.getContext('2d');
    if (cx) cx.drawImage(bitmap, 0, 0, width, height);
    return c.toDataURL('image/jpeg', 0.85);
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
            {user ? '✓ Salvato nei tuoi giri' : 'Accedi per salvare i tuoi giri e ritrovarli ovunque'}
          </p>

          {!cardUrl ? (
            <div className="mt-4 space-y-3">
              <p className="font-mono text-xs uppercase tracking-wide text-asfalto/50">
                Crea la card da condividere nelle storie
              </p>
              <div className="flex flex-wrap gap-3">
                <label className="tap cursor-pointer rounded-app bg-segnale px-5 py-2.5 font-mono text-sm font-medium uppercase text-asfalto hover:bg-white">
                  {generandoCard ? 'Genero…' : '📷 Con una tua foto'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      const foto = await scegliFotoCard(f);
                      await creaCard(punti, distanzaM, durataSec, new Date().toISOString(), foto);
                    }}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => creaCard(punti, distanzaM, durataSec, new Date().toISOString())}
                  disabled={generandoCard}
                  className="tap rounded-app border border-asfalto/20 px-5 py-2.5 font-mono text-sm font-medium uppercase hover:bg-asfalto hover:text-cemento disabled:opacity-60"
                >
                  Solo tracciato
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={cardUrl} alt="Card del giro" className="w-full max-w-xs rounded-app border-2 border-asfalto shadow-app" />
              <div className="mt-3 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={condividiCard}
                  className="tap rounded-app bg-segnale px-5 py-2.5 font-mono font-medium uppercase text-asfalto hover:bg-white"
                >
                  Condividi
                </button>
                <button
                  type="button"
                  onClick={scaricaCard}
                  className="tap rounded-app border-2 border-asfalto px-5 py-2.5 font-mono font-medium uppercase hover:bg-asfalto hover:text-cemento"
                >
                  Scarica
                </button>
                <button
                  type="button"
                  onClick={() => setCardUrl(null)}
                  className="tap rounded-app px-4 py-2.5 font-mono text-sm uppercase text-asfalto/60 hover:text-asfalto"
                >
                  Rifai
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
          <ul className="mt-3 space-y-3">
            {storico.map((g) => (
              <li key={g.id} className="card-app flex items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <p className="font-medium">{formattaDataBreve(g.data)}</p>
                  <p className="mt-0.5 font-mono text-xs text-asfalto/50">
                    {formattaKm(g.km)} km · {formattaDurata(g.durataSec)}
                    {typeof g.velMediaKmh === 'number' && g.velMediaKmh > 0 && (
                      <> · {g.velMediaKmh} km/h media</>
                    )}
                    {typeof g.curve === 'number' && g.curve > 0 && <> · {g.curve} curve</>}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => creaCard(g.punti, g.km, g.durataSec, g.data)}
                  className="tap shrink-0 rounded-app border border-asfalto/15 px-3 py-1.5 font-mono text-xs font-medium uppercase hover:bg-asfalto hover:text-cemento"
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
