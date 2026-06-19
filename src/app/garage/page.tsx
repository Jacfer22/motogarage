'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { getSupabaseBrowser } from '@/lib/supabase-browser';
import GenerazioneProgress from '@/components/GenerazioneProgress';
import CreaGemello from '@/components/CreaGemello';
import MotoSVG from '@/components/MotoSVG';

interface Moto {
  id: string;
  marca: string;
  modello: string;
  anno: number | null;
  stato: string;
  glb_url: string | null;
  foto_sx_url: string | null;
  foto_dx_url?: string | null;
  colore_primario: string | null;
  colore_secondario: string | null;
  task_id: string | null;
  created_at?: string;
}

type Vista = 'garage' | 'crea' | 'genera';

function nomeMoto(moto: Moto) {
  return `${moto.marca} ${moto.modello}`.trim();
}

function colorePrimario(moto: Moto) {
  return moto.colore_primario || '#d91414';
}

function coloreSecondario(moto: Moto) {
  return moto.colore_secondario || '#111827';
}

function statoLabel(stato: string) {
  if (stato === 'pronto') return '3D pronto';
  if (stato === 'elaborazione') return 'In creazione';
  if (stato === 'errore') return 'Da riprovare';
  return 'Bozza';
}

export default function PaginaGarage() {
  const { user, profilo, loading } = useAuth();
  const router = useRouter();
  const [moto, setMoto] = useState<Moto[]>([]);
  const [vista, setVista] = useState<Vista>('garage');
  const [motoInElaborazione, setMotoInElaborazione] = useState<{ id: string; marca: string; modello: string; anno?: number } | null>(null);
  const [pctReale, setPctReale] = useState<number | null>(null);
  const [completato, setCompletato] = useState(false);
  const [motoSelezionata, setMotoSelezionata] = useState<string | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push('/accedi');
  }, [loading, user, router]);

  const caricaMoto = useCallback(async () => {
    const sb = getSupabaseBrowser();
    if (!sb || !user) return;

    const { data } = await sb
      .from('moto')
      .select('*')
      .eq('utente_id', user.id)
      .order('created_at', { ascending: false });

    const elenco = (data ?? []) as Moto[];
    setMoto(elenco);
    setMotoSelezionata((attuale) => attuale ?? elenco[0]?.id ?? null);
  }, [user]);

  useEffect(() => {
    caricaMoto();
  }, [caricaMoto]);

  useEffect(() => {
    if (!motoInElaborazione) return;

    pollingRef.current = setInterval(async () => {
      const res = await fetch(`/api/genera-moto?motoId=${motoInElaborazione.id}`);
      const json = await res.json();

      if (typeof json.percentuale === 'number') setPctReale(json.percentuale);

      if (json.stato === 'pronto') {
        setCompletato(true);
        setPctReale(100);
        if (pollingRef.current) clearInterval(pollingRef.current);
        caricaMoto();
      }

      if (json.stato === 'errore') {
        if (pollingRef.current) clearInterval(pollingRef.current);
        caricaMoto();
      }
    }, 8000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [motoInElaborazione, caricaMoto]);

  const motoSelObj = useMemo(() => {
    if (!moto.length) return null;
    return moto.find((m) => m.id === motoSelezionata) ?? moto[0];
  }, [moto, motoSelezionata]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="skeleton h-10 w-60 rounded-app" />
        <div className="skeleton mt-6 h-96 rounded-app-lg" />
      </div>
    );
  }

  if (vista === 'genera' && motoInElaborazione) {
    return (
      <GenerazioneProgress
        marca={motoInElaborazione.marca}
        modello={motoInElaborazione.modello}
        anno={motoInElaborazione.anno}
        percentualeReale={pctReale}
        completato={completato}
        onApriGarage={() => {
          setVista('garage');
          setMotoSelezionata(motoInElaborazione.id);
          setMotoInElaborazione(null);
          setCompletato(false);
          setPctReale(null);
        }}
      />
    );
  }

  if (vista === 'crea') {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-12">
        <button
          type="button"
          onClick={() => setVista('garage')}
          className="tap mb-5 rounded-full border border-asfalto/10 bg-white px-4 py-2 font-mono text-xs uppercase tracking-wide text-asfalto/60 shadow-app-sm hover:border-segnale hover:text-asfalto dark:bg-carbone"
        >
          ← Torna al garage
        </button>
        <CreaGemello
          onAvviato={(id, marca, modello, anno) => {
            setMotoInElaborazione({ id, marca, modello, anno });
            setVista('genera');
          }}
        />
      </div>
    );
  }

  return (
    <main className="min-h-[100dvh] overflow-hidden pb-24 sm:pb-10">
      <section className="relative border-b border-asfalto/10 bg-[radial-gradient(circle_at_top_left,rgba(242,183,5,0.22),transparent_28%),linear-gradient(135deg,#0a0c0f,#171a20_55%,#050506)] text-cemento">
        <div className="absolute inset-x-0 bottom-0 h-12 bg-[linear-gradient(90deg,transparent_0_10%,rgba(255,255,255,0.18)_10%_19%,transparent_19%_32%)] bg-[length:140px_8px] bg-repeat-x opacity-70" />
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-8 sm:flex-row sm:items-end sm:justify-between sm:py-10">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-segnale">{profilo?.username ?? 'Rider'} / MotoGarage</p>
            <h1 className="mt-2 font-display text-5xl font-black uppercase leading-none tracking-tight sm:text-7xl">
              Il mio<br className="sm:hidden" /> Garage
            </h1>
            <p className="mt-3 max-w-xl text-sm text-cemento/70 sm:text-base">
              La casa digitale della tua moto: crea il gemello 3D, personalizzalo e mostrala alla community.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setVista('crea')}
            className="tap inline-flex items-center justify-center rounded-app bg-segnale px-5 py-4 font-mono text-sm font-bold uppercase tracking-wide text-asfalto shadow-segnale hover:bg-white"
          >
            + Gemello digitale
          </button>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-5 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#07080c] shadow-app-lg">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_8%,rgba(242,183,5,0.20),transparent_20%),radial-gradient(circle_at_78%_45%,rgba(220,38,38,0.20),transparent_22%)]" />
          <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white/10 to-transparent" />
          <div className="absolute left-1/2 top-6 z-10 -translate-x-1/2 rounded-full border border-red-500/40 bg-red-500/10 px-5 py-2 text-center font-display text-sm font-black uppercase tracking-[0.35em] text-red-400 shadow-[0_0_32px_rgba(239,68,68,0.45)]">
            MotoGarage
          </div>

          <div className="relative min-h-[460px] px-5 pb-8 pt-24 sm:min-h-[560px] sm:px-10">
            <div className="absolute inset-x-0 bottom-0 h-[58%] origin-bottom bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.01)),repeating-linear-gradient(90deg,rgba(255,255,255,0.08)_0_1px,transparent_1px_72px),repeating-linear-gradient(0deg,rgba(255,255,255,0.08)_0_1px,transparent_1px_56px)] [transform:perspective(650px)_rotateX(58deg)]" />
            <div className="absolute inset-x-10 bottom-14 h-1 rounded-full bg-white/15 blur-sm" />
            <div className="absolute left-7 top-20 hidden h-48 w-20 rounded-full bg-red-500/10 blur-3xl sm:block" />
            <div className="absolute right-8 top-28 hidden h-56 w-24 rounded-full bg-segnale/10 blur-3xl sm:block" />

            {moto.length === 0 ? (
              <div className="relative z-10 flex min-h-[360px] flex-col items-center justify-center text-center">
                <div className="mb-5 grid h-24 w-24 place-items-center rounded-[28px] border border-white/10 bg-white/5 text-5xl shadow-app">
                  🏍️
                </div>
                <h2 className="font-display text-4xl font-black uppercase tracking-tight text-white">Garage vuoto</h2>
                <p className="mt-3 max-w-sm text-sm text-cemento/60">Aggiungi la tua prima moto e trasformala nel tuo gemello digitale.</p>
                <button
                  type="button"
                  onClick={() => setVista('crea')}
                  className="tap mt-6 rounded-app bg-segnale px-6 py-3 font-mono text-sm font-bold uppercase text-asfalto shadow-segnale"
                >
                  Crea il primo gemello
                </button>
              </div>
            ) : (
              <div className="relative z-10 grid min-h-[370px] place-items-center">
                <div className="flex w-full items-end justify-center gap-4 sm:gap-8">
                  {moto.slice(0, 3).map((m, index) => {
                    const selected = motoSelObj?.id === m.id;
                    const size = selected ? 'w-[72%] max-w-[460px]' : 'w-[34%] max-w-[230px] opacity-60 blur-[0.2px]';
                    const orderClass = index === 0 ? 'order-2' : index === 1 ? 'order-1' : 'order-3';
                    const translate = selected ? 'translate-y-0 scale-100' : 'translate-y-8 scale-90';

                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setMotoSelezionata(m.id)}
                        className={`tap ${orderClass} ${size} ${translate} transition-all duration-500 ease-app`}
                        aria-label={`Seleziona ${nomeMoto(m)}`}
                      >
                        <div className={`relative rounded-[26px] border p-4 shadow-[0_28px_80px_rgba(0,0,0,0.45)] ${selected ? 'border-segnale/70 bg-white/10' : 'border-white/10 bg-white/5'}`}>
                          <div className="absolute inset-x-6 -top-5 h-10 rounded-full bg-segnale/20 blur-2xl" />
                          {m.glb_url ? (
                            <div className="grid aspect-[16/9] place-items-center rounded-[20px] bg-black/35 text-7xl">🏍️</div>
                          ) : (
                            <div className="aspect-[16/9] rounded-[20px] bg-black/35 p-4">
                              <MotoSVG tipo="adventure" colorePrimario={colorePrimario(m)} coloreSecondario={coloreSecondario(m)} className="h-full w-full" />
                            </div>
                          )}
                          <div className="mt-3 text-left">
                            <p className="truncate font-display text-xl font-black uppercase tracking-tight text-white">{nomeMoto(m)}</p>
                            <p className="font-mono text-xs uppercase text-cemento/45">{m.anno ?? 'Anno non indicato'} · {statoLabel(m.stato)}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-[24px] border border-asfalto/10 bg-white p-5 shadow-app dark:bg-carbone">
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-segnale">Moto selezionata</p>
            {motoSelObj ? (
              <>
                <h2 className="mt-2 font-display text-3xl font-black uppercase leading-none tracking-tight">{nomeMoto(motoSelObj)}</h2>
                <p className="mt-1 font-mono text-sm text-asfalto/50">{motoSelObj.anno ?? 'Anno non indicato'}</p>
                <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-app bg-asfalto/5 p-3">
                    <p className="font-display text-xl font-black">{moto.length}</p>
                    <p className="font-mono text-[10px] uppercase text-asfalto/45">Moto</p>
                  </div>
                  <div className="rounded-app bg-asfalto/5 p-3">
                    <p className="font-display text-xl font-black">{motoSelObj.glb_url ? '3D' : 'SVG'}</p>
                    <p className="font-mono text-[10px] uppercase text-asfalto/45">Preview</p>
                  </div>
                  <div className="rounded-app bg-asfalto/5 p-3">
                    <p className="font-display text-xl font-black">{motoSelObj.stato === 'pronto' ? 'OK' : '...'}</p>
                    <p className="font-mono text-[10px] uppercase text-asfalto/45">Stato</p>
                  </div>
                </div>

                <div className="mt-5 flex flex-col gap-2">
                  {motoSelObj.stato === 'elaborazione' && (
                    <button
                      type="button"
                      onClick={() => {
                        setMotoInElaborazione({ id: motoSelObj.id, marca: motoSelObj.marca, modello: motoSelObj.modello, anno: motoSelObj.anno ?? undefined });
                        setVista('genera');
                      }}
                      className="tap rounded-app bg-segnale px-4 py-3 font-mono text-xs font-bold uppercase text-asfalto"
                    >
                      Vedi progresso
                    </button>
                  )}
                  {motoSelObj.glb_url && (
                    <a href={motoSelObj.glb_url} download className="tap rounded-app border border-asfalto/10 px-4 py-3 text-center font-mono text-xs font-bold uppercase text-asfalto/70 hover:border-segnale hover:text-asfalto">
                      Scarica GLB
                    </a>
                  )}
                  <button type="button" className="tap rounded-app border border-asfalto/10 px-4 py-3 font-mono text-xs font-bold uppercase text-asfalto/45" disabled>
                    Modifica colori · in arrivo
                  </button>
                </div>
              </>
            ) : (
              <p className="mt-3 text-sm text-asfalto/55">Non hai ancora moto nel garage.</p>
            )}
          </div>

          <div className="rounded-[24px] border border-asfalto/10 bg-asfalto p-5 text-cemento shadow-app dark:bg-black">
            <p className="font-display text-2xl font-black uppercase tracking-tight">Garage videogame</p>
            <p className="mt-2 text-sm text-cemento/60">Questa prima versione usa una scena leggera e pulita. Il vero viewer GLB/Three.js va inserito solo quando il modello AI è pronto, non come canvas nero vuoto.</p>
          </div>
        </aside>
      </section>
    </main>
  );
}
