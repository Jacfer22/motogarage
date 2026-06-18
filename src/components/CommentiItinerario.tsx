'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { getSupabaseBrowser } from '@/lib/supabase-browser';
import { useAuth } from './AuthProvider';

interface Commento {
  id: string;
  testo: string;
  created_at: string;
  autore_id: string;
  autore: { username: string | null } | null;
}

function quando(iso: string): string {
  return new Date(iso).toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function CommentiItinerario({ itinerarioId }: { itinerarioId: string }) {
  const { user, profilo, nonConfigurato } = useAuth();
  const [commenti, setCommenti] = useState<Commento[]>([]);
  const [caricato, setCaricato] = useState(false);
  const [testo, setTesto] = useState('');
  const [invio, setInvio] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);

  const loggato = nonConfigurato || !!user;

  const carica = useCallback(async () => {
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setCaricato(true);
      return;
    }
    const { data } = await supabase
      .from('commenti')
      .select('id, testo, created_at, autore_id, autore:profiles(username)')
      .eq('itinerario_id', itinerarioId)
      .order('created_at', { ascending: false });
    setCommenti((data ?? []) as unknown as Commento[]);
    setCaricato(true);
  }, [itinerarioId]);

  useEffect(() => {
    carica();
  }, [carica]);

  async function invia() {
    const supabase = getSupabaseBrowser();
    if (!supabase || !user) return;
    const t = testo.trim();
    if (t.length < 2) return;

    setInvio(true);
    setErrore(null);
    try {
      const { error } = await supabase.from('commenti').insert({
        itinerario_id: itinerarioId,
        autore_id: user.id,
        testo: t,
      });
      if (error) {
        setErrore('Non sono riuscito a pubblicare il commento. Riprova.');
      } else {
        setTesto('');
        await carica();
      }
    } finally {
      setInvio(false);
    }
  }

  async function elimina(id: string) {
    const supabase = getSupabaseBrowser();
    if (!supabase) return;
    await supabase.from('commenti').delete().eq('id', id);
    await carica();
  }

  return (
    <section className="mt-12">
      <h2 className="font-display text-sm font-bold uppercase tracking-[0.2em] text-cartello">
        Community
      </h2>
      <p className="mt-1 font-display text-3xl font-bold uppercase tracking-tight">
        Commenti
      </p>

      {/* Form per i registrati, banner per gli ospiti */}
      {loggato ? (
        <div className="mt-5">
          <textarea
            value={testo}
            onChange={(e) => setTesto(e.target.value)}
            placeholder="Hai fatto questo giro? Com'era la strada, il traffico, i panorami?"
            rows={3}
            maxLength={500}
            className="w-full rounded-app border border-asfalto/15 px-4 py-3 text-sm focus:border-segnale focus:outline-none"
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="font-mono text-[11px] text-asfalto/40">{testo.length}/500</span>
            <button
              type="button"
              onClick={invia}
              disabled={invio || testo.trim().length < 2}
              className="tap rounded-app bg-segnale px-5 py-2 font-mono text-sm font-medium uppercase text-asfalto hover:bg-asfalto hover:text-cemento disabled:opacity-50"
            >
              {invio ? 'Pubblico…' : 'Commenta'}
            </button>
          </div>
          {errore && <p className="mt-2 text-sm text-cartello">{errore}</p>}
        </div>
      ) : (
        <div className="mt-5 rounded-app-lg border-2 border-segnale bg-segnale/10 p-5 text-center">
          <p className="font-display text-xl font-bold uppercase tracking-tight">
            Unisciti alla community
          </p>
          <p className="mx-auto mt-1 max-w-md text-sm text-asfalto/70">
            Iscriviti gratis per commentare, caricare le tue foto e salvare i tuoi
            giri. Ci vuole un minuto.
          </p>
          <Link
            href="/accedi#registrati"
            className="tap mt-3 inline-block rounded-app bg-segnale px-6 py-2.5 font-mono text-sm font-medium uppercase text-asfalto hover:bg-asfalto hover:text-cemento"
          >
            Iscriviti gratis
          </Link>
        </div>
      )}

      {/* Lista commenti */}
      <div className="mt-6 space-y-3">
        {!caricato ? (
          <div className="skeleton h-16 rounded-app" />
        ) : commenti.length === 0 ? (
          <p className="font-mono text-sm text-asfalto/50">
            Ancora nessun commento. {loggato ? 'Scrivi il primo!' : ''}
          </p>
        ) : (
          commenti.map((c) => (
            <div key={c.id} className="card-app p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-mono text-xs uppercase tracking-wide text-asfalto/60">
                  {c.autore?.username ?? 'biker'} · {quando(c.created_at)}
                </p>
                {(user?.id === c.autore_id || profilo?.is_admin) && (
                  <button
                    type="button"
                    onClick={() => elimina(c.id)}
                    className="font-mono text-[11px] uppercase text-asfalto/40 hover:text-cartello"
                  >
                    Elimina
                  </button>
                )}
              </div>
              <p className="mt-1.5 whitespace-pre-line text-sm text-asfalto/85">{c.testo}</p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
