'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowser } from '@/lib/supabase-browser';
import { useAuth } from '@/components/AuthProvider';
import AdminGarageQueue from '@/components/AdminGarageQueue';

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
  const autorizzato = Boolean(profilo?.is_admin);

  useEffect(() => {
    if (!supabase || !autorizzato) return;

    Promise.all([
      supabase.from('avvisi').select('id, tipo, titolo, data, attivo, fonte, itinerari(slug, titolo)').order('data', { ascending: false }),
      supabase.from('profiles').select('id, username, is_pro, is_admin').order('created_at', { ascending: false }),
      supabase.from('articoli').select('id, titolo, contenuto, stato, created_at, autore:profiles(username)').eq('stato', 'in_revisione').order('created_at', { ascending: true }),
      supabase.from('lista_attesa_pro').select('id, email, piano_interesse, created_at').order('created_at', { ascending: false }),
    ]).then(([avvisiRes, profiliRes, articoliRes, attesaRes]) => {
      const primoErrore = avvisiRes.error || profiliRes.error || articoliRes.error;
      if (primoErrore) setErrore(primoErrore.message);
      if (avvisiRes.data) setAvvisi(avvisiRes.data as unknown as RigaAvviso[]);
      if (profiliRes.data) setProfili(profiliRes.data as RigaProfilo[]);
      if (articoliRes.data) setArticoli(articoliRes.data as unknown as RigaArticolo[]);
      if (attesaRes.data) setListaAttesa(attesaRes.data as RigaListaAttesa[]);
    });
  }, [supabase, autorizzato]);

  async function toggleAvviso(id: string, attivo: boolean) {
    if (!supabase) return;
    const { error } = await supabase.from('avvisi').update({ attivo: !attivo }).eq('id', id);
    if (error) return setErrore(error.message);
    setAvvisi((attuali) => attuali?.map((item) => item.id === id ? { ...item, attivo: !attivo } : item) ?? null);
  }

  async function togglePro(id: string, valore: boolean) {
    if (!supabase) return;
    const { error } = await supabase.from('profiles').update({ is_pro: !valore }).eq('id', id);
    if (error) return setErrore(error.message);
    setProfili((attuali) => attuali?.map((item) => item.id === id ? { ...item, is_pro: !valore } : item) ?? null);
  }

  async function moderaArticolo(id: string, decisione: 'pubblicato' | 'rifiutato') {
    if (!supabase) return;
    const aggiornamento: Record<string, unknown> = { stato: decisione };
    if (decisione === 'pubblicato') aggiornamento.pubblicato_at = new Date().toISOString();
    const { error } = await supabase.from('articoli').update(aggiornamento).eq('id', id);
    if (error) return setErrore(error.message);
    setArticoli((attuali) => attuali?.filter((item) => item.id !== id) ?? null);
  }

  if (nonConfigurato) {
    return <Stato titolo="Admin non disponibile" testo="Il sito non è ancora collegato a Supabase in questo ambiente." />;
  }
  if (loading) return <Stato titolo="Caricamento…" />;
  if (!user || !autorizzato) {
    router.replace('/hub');
    return <Stato titolo="Accesso non autorizzato…" />;
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-14">
      <p className="font-mono text-sm uppercase tracking-widest text-cartello">Admin</p>
      <h1 className="mt-1 font-display text-5xl font-bold uppercase leading-none tracking-tight">Pannello</h1>
      {errore && <p className="mt-4 border-2 border-red-700 bg-red-50 p-3 text-sm text-red-900">{errore}</p>}

      <AdminGarageQueue />

      <div className="mt-10 rounded-app-lg border-2 border-segnale bg-white p-6 dark:bg-carbone">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-2xl font-bold uppercase tracking-tight">Lista d&apos;attesa Pro</h2>
          {listaAttesa && <span className="rounded-full bg-segnale px-3 py-1 font-display text-2xl font-bold text-asfalto">{listaAttesa.length}</span>}
        </div>
        <p className="mt-1 text-sm text-asfalto/60">Utenti interessati al piano Pro.</p>
        {listaAttesa && listaAttesa.length > 0 ? (
          <>
            <div className="mt-3 flex gap-3 font-mono text-xs uppercase text-asfalto/60">
              <span>Annuale: {listaAttesa.filter((item) => item.piano_interesse === 'annuale').length}</span>
              <span>·</span>
              <span>Mensile: {listaAttesa.filter((item) => item.piano_interesse === 'mensile').length}</span>
            </div>
            <ul className="mt-3 max-h-64 space-y-1 overflow-auto">
              {listaAttesa.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 border-b border-asfalto/10 py-1.5 text-sm">
                  <span className="truncate">{item.email}</span>
                  <span className="font-mono text-[11px] uppercase text-asfalto/45">{item.piano_interesse ?? '—'}</span>
                </li>
              ))}
            </ul>
          </>
        ) : <p className="mt-3 font-mono text-sm text-asfalto/50">Ancora nessuna iscrizione.</p>}
      </div>

      <TitoloSezione titolo="Articoli da revisionare" descrizione="Pubblica o rifiuta gli articoli inviati dagli utenti." />
      <div className="mt-4 divide-y-2 divide-asfalto/10 border-2 border-asfalto bg-white dark:bg-carbone">
        {articoli === null ? <Caricamento /> : articoli.length === 0 ? <Vuoto testo="Nessun articolo da revisionare." /> : articoli.map((item) => (
          <div key={item.id} className="p-4">
            <p className="font-mono text-xs uppercase text-asfalto/50">{item.autore?.username ?? 'utente'} · {new Date(item.created_at).toLocaleDateString('it-IT')}</p>
            <p className="mt-1 font-display text-xl font-bold uppercase tracking-tight">{item.titolo}</p>
            <p className="mt-1 line-clamp-3 text-sm text-asfalto/70">{item.contenuto}</p>
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={() => moderaArticolo(item.id, 'pubblicato')} className="border-2 border-asfalto bg-segnale px-3 py-1.5 font-mono text-xs font-medium uppercase text-asfalto">Pubblica</button>
              <button type="button" onClick={() => moderaArticolo(item.id, 'rifiutato')} className="border-2 border-asfalto px-3 py-1.5 font-mono text-xs font-medium uppercase">Rifiuta</button>
            </div>
          </div>
        ))}
      </div>

      <TitoloSezione titolo="Avvisi" descrizione="Attiva o disattiva gli aggiornamenti stradali." />
      <div className="mt-4 divide-y-2 divide-asfalto/10 border-2 border-asfalto bg-white dark:bg-carbone">
        {avvisi === null ? <Caricamento /> : avvisi.length === 0 ? <Vuoto testo="Nessun avviso." /> : avvisi.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-4 p-4">
            <div>
              <p className="font-mono text-xs uppercase text-asfalto/50">{item.itinerari?.titolo ?? '—'} · {item.tipo} · {item.data}</p>
              <p className="font-medium">{item.titolo}</p>
              <p className="font-mono text-xs text-asfalto/40">{item.fonte}</p>
            </div>
            <button type="button" onClick={() => toggleAvviso(item.id, item.attivo)} className={`shrink-0 border-2 border-asfalto px-3 py-1.5 font-mono text-xs font-medium uppercase ${item.attivo ? 'bg-segnale text-asfalto' : 'bg-white text-asfalto/50'}`}>
              {item.attivo ? 'Attivo' : 'Disattivo'}
            </button>
          </div>
        ))}
      </div>

      <TitoloSezione titolo="Utenti" descrizione="Attiva manualmente gli account Pro durante la fase beta." />
      <div className="mt-4 divide-y-2 divide-asfalto/10 border-2 border-asfalto bg-white dark:bg-carbone">
        {profili === null ? <Caricamento /> : profili.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-4 p-4">
            <p className="font-mono text-sm">{item.username ?? item.id.slice(0, 8)}{item.is_admin && <span className="ml-2 text-cartello">· admin</span>}</p>
            <button type="button" onClick={() => togglePro(item.id, item.is_pro)} className={`shrink-0 border-2 border-asfalto px-3 py-1.5 font-mono text-xs font-medium uppercase ${item.is_pro ? 'bg-segnale text-asfalto' : 'bg-white text-asfalto/50'}`}>
              {item.is_pro ? 'Pro' : 'Free'}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

function Stato({ titolo, testo }: { titolo: string; testo?: string }) {
  return <section className="mx-auto max-w-md px-4 py-14"><h1 className="font-display text-4xl font-bold uppercase tracking-tight">{titolo}</h1>{testo && <p className="mt-3 text-asfalto/70">{testo}</p>}</section>;
}

function TitoloSezione({ titolo, descrizione }: { titolo: string; descrizione: string }) {
  return <><h2 className="mt-10 font-display text-2xl font-bold uppercase tracking-tight">{titolo}</h2><p className="mt-1 text-sm text-asfalto/60">{descrizione}</p></>;
}

function Caricamento() {
  return <p className="p-4 font-mono text-sm text-asfalto/50">Caricamento…</p>;
}

function Vuoto({ testo }: { testo: string }) {
  return <p className="p-4 font-mono text-sm text-asfalto/50">{testo}</p>;
}
