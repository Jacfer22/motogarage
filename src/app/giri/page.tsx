'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useAuth } from '@/components/AuthProvider';
import { getSupabaseBrowser } from '@/lib/supabase-browser';
import { formattaDurata, formattaKm } from '@/lib/geo';
import {
  aggiornaGiroCloud,
  caricaGiriUtente,
  eliminaGiroUtente,
  type GiroUtente,
} from '@/lib/giri-store';
import EditorCardGiro from '@/components/EditorCardGiro';

const MappaTraccia = dynamic(() => import('@/components/MappaTraccia'), { ssr: false });

function formattaDataBreve(iso: string): string {
  return new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function PaginaMieiGiri() {
  const { user, loading } = useAuth();
  const [giri, setGiri] = useState<GiroUtente[] | null>(null);
  const [selezionatoId, setSelezionatoId] = useState<string | null>(null);
  const [errore, setErrore] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const ricarica = useCallback(async () => {
    const supabase = getSupabaseBrowser();
    if (!supabase || !user) return;
    setErrore(null);
    try {
      const elenco = await caricaGiriUtente(supabase, user.id);
      setGiri(elenco);
      setSelezionatoId((attuale) => attuale ?? elenco[0]?.id ?? null);
    } catch (error) {
      setErrore(error instanceof Error ? error.message : 'Caricamento giri fallito.');
      setGiri([]);
    }
  }, [user]);

  useEffect(() => {
    if (!loading && user) ricarica();
  }, [loading, user, ricarica]);

  const selezionato = giri?.find((g) => g.id === selezionatoId) ?? null;

  async function cambiaNome(nome: string) {
    if (!selezionato?.cloudId) return;
    const supabase = getSupabaseBrowser();
    if (!supabase) return;
    setSalvando(true);
    try {
      await aggiornaGiroCloud(supabase, selezionato.cloudId, { nome });
      setGiri((elenco) => elenco?.map((g) => g.id === selezionato.id ? { ...g, nome } : g) ?? null);
    } catch (error) {
      setErrore(error instanceof Error ? error.message : 'Aggiornamento non riuscito.');
    } finally {
      setSalvando(false);
    }
  }

  async function cambiaPubblico(pubblico: boolean) {
    if (!selezionato?.cloudId) return;
    const supabase = getSupabaseBrowser();
    if (!supabase) return;
    setSalvando(true);
    try {
      await aggiornaGiroCloud(supabase, selezionato.cloudId, { pubblico });
      setGiri((elenco) => elenco?.map((g) => g.id === selezionato.id ? { ...g, pubblico } : g) ?? null);
    } catch (error) {
      setErrore(error instanceof Error ? error.message : 'Aggiornamento non riuscito.');
    } finally {
      setSalvando(false);
    }
  }

  async function eliminaGiro(giro: GiroUtente) {
    const msg = giro.km < 50
      ? 'Eliminare questo giro? Sembra avviato per errore — nessun problema.'
      : `Eliminare il giro del ${formattaDataBreve(giro.data)} (${formattaKm(giro.km)} km)? Non si può annullare.`;
    if (!window.confirm(msg)) return;

    const supabase = getSupabaseBrowser();
    setSalvando(true);
    setErrore(null);
    try {
      await eliminaGiroUtente(supabase, giro);
      setGiri((elenco) => {
        const nuovo = elenco?.filter((g) => g.id !== giro.id) ?? [];
        setSelezionatoId((attuale) => (attuale === giro.id ? nuovo[0]?.id ?? null : attuale));
        return nuovo;
      });
    } catch (error) {
      setErrore(error instanceof Error ? error.message : 'Eliminazione non riuscita.');
    } finally {
      setSalvando(false);
    }
  }

  if (loading) {
    return <section className="mx-auto max-w-2xl px-4 py-14"><p className="font-mono text-sm uppercase text-asfalto/40">Caricamento…</p></section>;
  }

  if (!user) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-14">
        <h1 className="font-display text-5xl font-bold uppercase leading-none tracking-tight">I miei giri</h1>
        <p className="mt-4 text-asfalto/70">Accedi per vedere i giri salvati nel cloud e creare le card da qualsiasi dispositivo.</p>
        <Link href="/accedi" className="mt-6 inline-block rounded-app bg-brand px-5 py-3 font-mono text-xs font-bold uppercase text-white">Accedi</Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-2xl px-4 py-14">
      <p className="font-mono text-sm uppercase tracking-widest text-cartello">MotoGarage</p>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-5xl font-bold uppercase leading-none tracking-tight">I miei giri</h1>
        <Link href="/traccia" className="rounded-app bg-segnale px-4 py-2.5 font-mono text-xs font-bold uppercase text-asfalto hover:bg-white">
          + Traccia giro
        </Link>
      </div>
      <p className="mt-3 text-asfalto/70">
        Tutti i percorsi GPS salvati nel tuo account. Apri da qualsiasi telefono e crea la card quando vuoi.
      </p>

      {errore && <p className="mt-4 rounded-app border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">{errore}</p>}

      {giri === null ? (
        <div className="mt-8 space-y-2">
          {[0, 1, 2].map((i) => <div key={i} className="skeleton h-16 rounded-app" />)}
        </div>
      ) : giri.length === 0 ? (
        <div className="mt-8 rounded-app-lg border border-dashed border-asfalto/25 p-8 text-center">
          <p className="font-display text-2xl font-bold uppercase text-asfalto/40">Nessun giro ancora</p>
          <p className="mt-2 text-sm text-asfalto/60">Traccia il primo percorso con GPS: comparirà qui automaticamente.</p>
          <Link href="/traccia" className="tap mt-4 inline-block rounded-app bg-brand px-5 py-3 font-mono text-xs font-bold uppercase text-white">Traccia un giro</Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <ul className="space-y-2">
            {giri.map((giro) => (
              <li key={giro.id}>
                <div className={`card-app flex items-stretch gap-2 p-0 overflow-hidden ${selezionatoId === giro.id ? 'ring-2 ring-brand' : ''}`}>
                  <button
                    type="button"
                    onClick={() => setSelezionatoId(giro.id)}
                    className="min-w-0 flex-1 p-4 text-left"
                  >
                    <p className="font-display text-lg font-bold uppercase leading-tight">{giro.nome}</p>
                    <p className="mt-0.5 font-mono text-[11px] uppercase text-asfalto/50">
                      {formattaDataBreve(giro.data)} · {formattaKm(giro.km)} km · {formattaDurata(giro.durataSec)}
                    </p>
                    <p className="mt-1 font-mono text-[10px] uppercase text-asfalto/40">
                      {giro.pubblico ? 'In community' : 'Privato'}
                      {giro.soloLocale ? ' · Solo locale (in sync…)' : ' · Nel cloud'}
                    </p>
                  </button>
                  <button
                    type="button"
                    title="Elimina giro"
                    disabled={salvando}
                    onClick={() => eliminaGiro(giro)}
                    className="shrink-0 border-l border-asfalto/10 px-3 font-mono text-lg text-red-500/80 hover:bg-red-500/10 disabled:opacity-40"
                  >
                    ×
                  </button>
                </div>
              </li>
            ))}
          </ul>

          {selezionato && (
            <div className="space-y-4">
              {selezionato.punti.length > 1 && (
                <div className="overflow-hidden rounded-app-lg border border-asfalto/12">
                  <MappaTraccia punti={selezionato.punti} inCorso={false} />
                </div>
              )}
              <EditorCardGiro
                giro={selezionato}
                onNomeChange={cambiaNome}
                onPubblicoChange={selezionato.cloudId ? cambiaPubblico : undefined}
              />
              <button
                type="button"
                disabled={salvando}
                onClick={() => eliminaGiro(selezionato)}
                className="w-full rounded-app border border-red-500/35 bg-red-500/10 px-4 py-3 font-mono text-xs font-bold uppercase text-red-600 hover:bg-red-500/15 disabled:opacity-40"
              >
                Elimina questo giro
              </button>
            </div>
          )}
        </div>
      )}

      <p className="mt-10">
        <Link href="/hub" className="font-mono text-sm uppercase text-asfalto/60 underline hover:text-asfalto">← Torna all&apos;hub</Link>
      </p>
    </section>
  );
}
