'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useAuth } from '@/components/AuthProvider';
import { getSupabaseBrowser } from '@/lib/supabase-browser';
import { formattaDurata, formattaKmDisplay } from '@/lib/geo';
import {
  aggiornaGiroCloud,
  caricaGiriUtente,
  eliminaGiroUtente,
  type GiroUtente,
} from '@/lib/giri-store';
import EditorCardGiro from '@/components/EditorCardGiro';
import { BRAND_DOMAIN } from '@/lib/brand-display';
import { useFeedback } from '@/components/FeedbackProvider';
import AppPageShell from '@/components/AppPageShell';
import AuthWall, { AuthWallLoading } from '@/components/AuthWall';
import { Button, ButtonLink } from '@/components/Button';
import { scaricaGpx } from '@/lib/gpx-export';

const MappaTraccia = dynamic(() => import('@/components/MappaTraccia'), { ssr: false });

function formattaDataBreve(iso: string): string {
  return new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function PaginaMieiGiri() {
  const { user, loading } = useAuth();
  const { conferma, toast } = useFeedback();
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
    const msg = giro.km < 0.05
      ? 'Eliminare questo giro? Sembra avviato per errore.'
      : `Eliminare il giro del ${formattaDataBreve(giro.data)} (${formattaKmDisplay(giro.km)} km)? Non si può annullare.`;
    const ok = await conferma({
      titolo: 'Elimina giro',
      messaggio: msg,
      conferma: 'Elimina',
      pericolo: true,
    });
    if (!ok) return;

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
      toast('Giro eliminato');
    } catch (error) {
      setErrore(error instanceof Error ? error.message : 'Eliminazione non riuscita.');
    } finally {
      setSalvando(false);
    }
  }

  if (loading) {
    return (
      <AppPageShell>
        <AuthWallLoading />
      </AppPageShell>
    );
  }

  if (!user) {
    return (
      <AppPageShell>
        <h1 className="font-display text-4xl font-bold uppercase leading-none tracking-tight text-white">I miei giri</h1>
        <div className="mt-6">
          <AuthWall
            titolo="I tuoi percorsi salvati"
            descrizione="Accedi per vedere i giri salvati nel cloud e creare le card da qualsiasi dispositivo."
            invitaRegistrazione={false}
          />
        </div>
      </AppPageShell>
    );
  }

  return (
    <AppPageShell>
      <p className="font-mono text-sm uppercase tracking-widest text-cartello">MotoGarage</p>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-4xl font-bold uppercase leading-none tracking-tight text-white md:text-5xl">I miei giri</h1>
        <ButtonLink href="/traccia" className="!min-h-[44px]">
          + Traccia giro
        </ButtonLink>
      </div>
      <p className="mt-3 text-cemento/65">
        Tutti i percorsi GPS salvati nel tuo account. Apri da qualsiasi telefono e crea la card quando vuoi.
      </p>

      {errore && <p className="mt-4 rounded-app border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{errore}</p>}

      {giri === null ? (
        <div className="mt-8 space-y-2">
          {[0, 1, 2].map((i) => <div key={i} className="skeleton h-16 rounded-app" />)}
        </div>
      ) : giri.length === 0 ? (
        <div className="mt-8 rounded-app-lg border border-dashed border-white/15 p-8 text-center">
          <p className="font-display text-2xl font-bold uppercase text-cemento/40">Nessun giro ancora</p>
          <p className="mt-2 text-sm text-cemento/55">Traccia il primo percorso con GPS: comparirà qui automaticamente.</p>
          <ButtonLink href="/traccia" className="mt-4">
            Traccia un giro
          </ButtonLink>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <ul className="space-y-2">
            {giri.map((giro) => (
              <li key={giro.id}>
                <div className={`card-app flex items-stretch gap-2 overflow-hidden p-0 ${selezionatoId === giro.id ? 'ring-2 ring-brand' : ''}`}>
                  <button
                    type="button"
                    onClick={() => setSelezionatoId(giro.id)}
                    className="min-w-0 flex-1 p-4 text-left"
                  >
                    <p className="font-display text-lg font-bold uppercase leading-tight text-white">{giro.nome}</p>
                    <p className="mt-0.5 font-mono text-[11px] uppercase text-cemento/50">
                      {formattaDataBreve(giro.data)} · {formattaKmDisplay(giro.km)} km · {formattaDurata(giro.durataSec)}
                    </p>
                    <p className="mt-1 font-mono text-[10px] uppercase text-cemento/40">
                      {giro.pubblico ? 'In community' : 'Privato'}
                      {giro.soloLocale ? ' · Solo locale (in sync…)' : ' · Nel cloud'}
                    </p>
                  </button>
                  <button
                    type="button"
                    title="Elimina giro"
                    disabled={salvando}
                    onClick={() => eliminaGiro(giro)}
                    className="shrink-0 border-l border-white/10 px-3 font-mono text-lg text-red-400/80 hover:bg-red-500/10 disabled:opacity-40"
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
                <div className="overflow-hidden rounded-app-lg border border-white/10">
                  <MappaTraccia punti={selezionato.punti} inCorso={false} />
                </div>
              )}
              <EditorCardGiro
                giro={selezionato}
                onNomeChange={cambiaNome}
                onPubblicoChange={selezionato.cloudId ? cambiaPubblico : undefined}
              />
              {selezionato.punti.length > 1 && (
                <Button variant="secondary" fullWidth onClick={() => scaricaGpx(selezionato.punti, selezionato.nome)}>
                  Scarica GPX
                </Button>
              )}
              {selezionato.pubblico && selezionato.cloudId && (
                <p className="text-center font-mono text-[10px] uppercase text-cemento/50">
                  Condiviso in community:{' '}
                  <Link href={`/giro/${selezionato.cloudId}`} className="text-brand underline">
                    {BRAND_DOMAIN}/giro/{selezionato.cloudId.slice(0, 8)}…
                  </Link>
                </p>
              )}
              <Button
                variant="danger"
                fullWidth
                disabled={salvando}
                onClick={() => eliminaGiro(selezionato)}
              >
                Elimina questo giro
              </Button>
            </div>
          )}
        </div>
      )}

      <p className="mt-10">
        <Link href="/hub" className="font-mono text-sm uppercase text-cemento/50 underline hover:text-brand">
          ← Torna all&apos;hub
        </Link>
      </p>
    </AppPageShell>
  );
}
