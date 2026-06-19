'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowser } from '@/lib/supabase-browser';
import { useAuth } from '@/components/AuthProvider';

interface RigaAvviso {
  id: string;
  tipo: string;
  titolo: string;
  data: string;
  attivo: boolean;
  fonte: string;
  itinerari: { slug: string; titolo: string } | null;
}

interface RigaProfilo {
  id: string;
  username: string | null;
  is_pro: boolean;
  is_admin: boolean;
}

interface RigaArticolo {
  id: string;
  titolo: string;
  contenuto: string;
  stato: 'in_revisione' | 'pubblicato' | 'rifiutato';
  created_at: string;
  autore: { username: string | null } | null;
}

interface RigaListaAttesa {
  id: string;
  email: string;
  piano_interesse: string | null;
  created_at: string;
}

export default function PaginaAdmin() {
  const { user, profilo, loading, nonConfigurato } = useAuth();
  const router = useRouter();
  const supabase = getSupabaseBrowser();

  const [avvisi, setAvvisi] = useState<RigaAvviso[] | null>(null);
  const [profili, setProfili] = useState<RigaProfilo[] | null>(null);
  const [articoli, setArticoli] = useState<RigaArticolo[] | null>(null);
  const [listaAttesa, setListaAttesa] = useState<RigaListaAttesa[] | null>(null);
  const [errore, setErrore] = useState<string | null>(null);

  const autorizzato = !!profilo?.is_admin;

  useEffect(() => {
    if (!supabase || !autorizzato) return;

    supabase
      .from('avvisi')
      .select('id, tipo, titolo, data, attivo, fonte, itinerari(slug, titolo)')
      .order('data', { ascending: false })
      .then(({ data, error }) => {
        if (error) setErrore(error.message);
        else setAvvisi(data as unknown as RigaAvviso[]);
      });

    supabase
      .from('profiles')
      .select('id, username, is_pro, is_admin')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) setErrore(error.message);
        else setProfili(data as RigaProfilo[]);
      });

    supabase
      .from('articoli')
      .select('id, titolo, contenuto, stato, created_at, autore:profiles(username)')
      .eq('stato', 'in_revisione')
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (error) setErrore(error.message);
        else setArticoli(data as unknown as RigaArticolo[]);
      });

    supabase
      .from('lista_attesa_pro')
      .select('id, email, piano_interesse, created_at')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setListaAttesa(data as RigaListaAttesa[]);
      });
  }, [supabase, autorizzato]);

  async function toggleAvviso(id: string, attivo: boolean) {
    if (!supabase) return;
    const { error } = await supabase.from('avvisi').update({ attivo: !attivo }).eq('id', id);
    if (error) {
      setErrore(error.message);
      return;
    }
    setAvvisi((prev) =>
      prev ? prev.map((a) => (a.id === id ? { ...a, attivo: !attivo } : a)) : prev
    );
  }

  async function toggleProfilo(id: string, campo: 'is_pro' | 'is_admin', valore: boolean) {
    if (!supabase) return;
    const { error } = await supabase
      .from('profiles')
      .update({ [campo]: !valore })
      .eq('id', id);
    if (error) {
      setErrore(error.message);
      return;
    }
    setProfili((prev) =>
      prev ? prev.map((p) => (p.id === id ? { ...p, [campo]: !valore } : p)) : prev
    );
  }

  async function moderaArticolo(id: string, decisione: 'pubblicato' | 'rifiutato') {
    if (!supabase) return;
    const aggiornamento: Record<string, unknown> = { stato: decisione };
    if (decisione === 'pubblicato') aggiornamento.pubblicato_at = new Date().toISOString();

    const { error } = await supabase.from('articoli').update(aggiornamento).eq('id', id);
    if (error) {
      setErrore(error.message);
      return;
    }
    setArticoli((prev) => (prev ? prev.filter((a) => a.id !== id) : prev));
  }

  if (nonConfigurato) {
    return (
      <section className="mx-auto max-w-md px-4 py-14">
        <h1 className="font-display text-4xl font-bold uppercase tracking-tight">
          Admin non disponibile
        </h1>
        <p className="mt-3 text-asfalto/70">
          Il sito non è ancora collegato a Supabase in questo ambiente.
        </p>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="mx-auto max-w-md px-4 py-14">
        <p className="font-mono text-sm uppercase text-asfalto/50">Caricamento…</p>
      </section>
    );
  }

  if (!user || !autorizzato) {
    // redirect immediato — nessuna parte del pannello admin è visibile
    if (!loading) router.replace('/hub');
    return (
      <section className="mx-auto max-w-md px-4 py-14">
        <p className="font-mono text-sm uppercase text-asfalto/50">Accesso non autorizzato…</p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-4xl px-4 py-14">
      <p className="font-mono text-sm uppercase tracking-widest text-cartello">Admin</p>
      <h1 className="mt-1 font-display text-5xl font-bold uppercase leading-none tracking-tight">
        Pannello
      </h1>

      {errore && (
        <p className="mt-4 border-2 border-red-700 bg-red-50 p-3 text-sm text-red-900">
          {errore}
        </p>
      )}

      {/* Lista d'attesa Pro */}
      <div className="mt-10 rounded-app-lg border-2 border-segnale bg-white p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-2xl font-bold uppercase tracking-tight">
            Lista d&apos;attesa Pro
          </h2>
          {listaAttesa && (
            <span className="rounded-full bg-segnale px-3 py-1 font-display text-2xl font-bold text-asfalto">
              {listaAttesa.length}
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-asfalto/60">
          Chi ha lasciato l&apos;email in attesa del Pro. Questi numeri ti dicono se
          conviene aprire la P.IVA e attivare i pagamenti.
        </p>
        {listaAttesa && listaAttesa.length > 0 && (
          <>
            <div className="mt-3 flex gap-3 font-mono text-xs uppercase text-asfalto/60">
              <span>Annuale: {listaAttesa.filter((r) => r.piano_interesse === 'annuale').length}</span>
              <span>·</span>
              <span>Mensile: {listaAttesa.filter((r) => r.piano_interesse === 'mensile').length}</span>
            </div>
            <ul className="mt-3 max-h-64 space-y-1 overflow-auto">
              {listaAttesa.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 border-b border-asfalto/10 py-1.5 text-sm">
                  <span className="truncate">{r.email}</span>
                  <span className="shrink-0 font-mono text-[11px] uppercase text-asfalto/45">
                    {r.piano_interesse ?? '—'}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-2 font-mono text-[11px] text-asfalto/40">
              Suggerimento: esporta queste email quando attivi il Pro per avvisare i primi interessati.
            </p>
          </>
        )}
        {listaAttesa && listaAttesa.length === 0 && (
          <p className="mt-3 font-mono text-sm text-asfalto/50">
            Ancora nessuna iscrizione. Promuovi il sito e guarda crescere la lista.
          </p>
        )}
      </div>

      <h2 className="mt-10 font-display text-2xl font-bold uppercase tracking-tight">
        Articoli da revisionare
      </h2>
      <p className="mt-1 text-sm text-asfalto/60">
        Pubblica o rifiuta gli articoli inviati dagli utenti per il blog.
      </p>
      <div className="mt-4 divide-y-2 divide-asfalto/10 border-2 border-asfalto bg-white">
        {articoli === null ? (
          <p className="p-4 font-mono text-sm text-asfalto/50">Caricamento…</p>
        ) : articoli.length === 0 ? (
          <p className="p-4 font-mono text-sm text-asfalto/50">Nessun articolo da revisionare.</p>
        ) : (
          articoli.map((a) => (
            <div key={a.id} className="p-4">
              <p className="font-mono text-xs uppercase text-asfalto/50">
                {a.autore?.username ?? 'utente'} ·{' '}
                {new Date(a.created_at).toLocaleDateString('it-IT')}
              </p>
              <p className="mt-1 font-display text-xl font-bold uppercase tracking-tight">
                {a.titolo}
              </p>
              <p className="mt-1 line-clamp-3 text-sm text-asfalto/70">{a.contenuto}</p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => moderaArticolo(a.id, 'pubblicato')}
                  className="border-2 border-asfalto bg-segnale px-3 py-1.5 font-mono text-xs font-medium uppercase text-asfalto hover:bg-white"
                >
                  Pubblica
                </button>
                <button
                  type="button"
                  onClick={() => moderaArticolo(a.id, 'rifiutato')}
                  className="border-2 border-asfalto px-3 py-1.5 font-mono text-xs font-medium uppercase hover:bg-asfalto hover:text-cemento"
                >
                  Rifiuta
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <h2 className="mt-10 font-display text-2xl font-bold uppercase tracking-tight">
        Avvisi
      </h2>
      <p className="mt-1 text-sm text-asfalto/60">
        Attiva o disattiva un avviso. Un avviso disattivato non appare più sul sito,
        resta salvato per riattivarlo.
      </p>
      <div className="mt-4 divide-y-2 divide-asfalto/10 border-2 border-asfalto bg-white">
        {avvisi === null ? (
          <p className="p-4 font-mono text-sm text-asfalto/50">Caricamento…</p>
        ) : avvisi.length === 0 ? (
          <p className="p-4 font-mono text-sm text-asfalto/50">Nessun avviso.</p>
        ) : (
          avvisi.map((a) => (
            <div key={a.id} className="flex items-center justify-between gap-4 p-4">
              <div>
                <p className="font-mono text-xs uppercase text-asfalto/50">
                  {a.itinerari?.titolo ?? '—'} · {a.tipo} · {a.data}
                </p>
                <p className="font-medium">{a.titolo}</p>
                <p className="font-mono text-xs text-asfalto/40">{a.fonte}</p>
              </div>
              <button
                type="button"
                onClick={() => toggleAvviso(a.id, a.attivo)}
                className={`shrink-0 border-2 border-asfalto px-3 py-1.5 font-mono text-xs font-medium uppercase ${
                  a.attivo ? 'bg-segnale text-asfalto' : 'bg-white text-asfalto/50'
                }`}
              >
                {a.attivo ? 'Attivo' : 'Disattivo'}
              </button>
            </div>
          ))
        )}
      </div>

      <h2 className="mt-10 font-display text-2xl font-bold uppercase tracking-tight">
        Utenti
      </h2>
      <p className="mt-1 text-sm text-asfalto/60">
        Rendi Pro un account manualmente (prima di collegare i pagamenti).
      </p>
      <div className="mt-4 divide-y-2 divide-asfalto/10 border-2 border-asfalto bg-white">
        {profili === null ? (
          <p className="p-4 font-mono text-sm text-asfalto/50">Caricamento…</p>
        ) : (
          profili.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-4 p-4">
              <p className="font-mono text-sm">
                {p.username ?? p.id.slice(0, 8)}
                {p.is_admin && <span className="ml-2 text-cartello">· admin</span>}
              </p>
              <button
                type="button"
                onClick={() => toggleProfilo(p.id, 'is_pro', p.is_pro)}
                className={`shrink-0 border-2 border-asfalto px-3 py-1.5 font-mono text-xs font-medium uppercase ${
                  p.is_pro ? 'bg-segnale text-asfalto' : 'bg-white text-asfalto/50'
                }`}
              >
                {p.is_pro ? 'Pro' : 'Free'}
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
