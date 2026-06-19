'use client';

import { useCallback, useEffect, useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase-browser';

interface Richiesta {
  id: string;
  marca: string;
  modello: string;
  anno: number | null;
  stato: string;
  created_at: string;
  foto_principale_url: string | null;
  foto_secondaria_url: string | null;
  proprietario: { username: string | null } | null;
}

export default function AdminGarageQueue() {
  const [richieste, setRichieste] = useState<Richiesta[] | null>(null);
  const [file, setFile] = useState<Record<string, File | null>>({});
  const [caricando, setCaricando] = useState<string | null>(null);
  const [errore, setErrore] = useState<string | null>(null);

  const token = useCallback(async () => {
    const supabase = getSupabaseBrowser();
    const { data } = await supabase?.auth.getSession() ?? { data: { session: null } };
    return data.session?.access_token ?? null;
  }, []);

  const carica = useCallback(async () => {
    const accessToken = await token();
    if (!accessToken) return;
    const risposta = await fetch('/api/admin/garage', {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    });
    const risultato = await risposta.json();
    if (!risposta.ok) {
      setErrore(risultato.errore ?? 'Non riesco a caricare la coda.');
      return;
    }
    setRichieste(risultato.richieste);
  }, [token]);

  useEffect(() => {
    carica();
  }, [carica]);

  async function pubblica(motoId: string) {
    const modello = file[motoId];
    if (!modello) return;
    const accessToken = await token();
    if (!accessToken) return;
    setCaricando(motoId);
    setErrore(null);
    const form = new FormData();
    form.append('motoId', motoId);
    form.append('file', modello);
    const risposta = await fetch('/api/admin/garage', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: form,
    });
    const risultato = await risposta.json();
    if (!risposta.ok) {
      setErrore(risultato.errore ?? 'Upload non riuscito.');
      setCaricando(null);
      return;
    }
    setRichieste((attuali) => attuali?.filter((item) => item.id !== motoId) ?? []);
    setCaricando(null);
  }

  return (
    <section className="mt-10 rounded-app-lg border-2 border-red-600 bg-white p-6 dark:bg-carbone">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-red-600">Garage Pro</p>
          <h2 className="mt-1 font-display text-3xl font-bold uppercase tracking-tight">Gemelli da generare</h2>
        </div>
        {richieste && <span className="rounded-full bg-red-600 px-3 py-1 font-display text-2xl font-bold text-white">{richieste.length}</span>}
      </div>
      <p className="mt-2 text-sm text-asfalto/60 dark:text-cemento/60">
        Scarica la foto, genera il Gaussian Splat con TriplaneGaussian e carica qui il file PLY.
      </p>
      {errore && <p className="mt-4 rounded-app bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300">{errore}</p>}

      <div className="mt-5 space-y-4">
        {richieste === null ? (
          <p className="font-mono text-sm text-asfalto/50">Caricamento…</p>
        ) : richieste.length === 0 ? (
          <p className="rounded-app bg-emerald-500/10 p-4 font-mono text-sm text-emerald-700 dark:text-emerald-300">Nessuna richiesta in coda.</p>
        ) : richieste.map((item) => (
          <article key={item.id} className="rounded-app border border-asfalto/15 p-4 dark:border-white/10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wide text-asfalto/45 dark:text-cemento/45">
                  {item.proprietario?.username ?? item.id.slice(0, 8)} · {new Date(item.created_at).toLocaleDateString('it-IT')}
                </p>
                <h3 className="mt-1 font-display text-2xl font-black uppercase">{item.marca} {item.modello}</h3>
                <p className="font-mono text-xs uppercase text-asfalto/45 dark:text-cemento/45">{item.anno ?? 'Anno n/d'} · {item.stato}</p>
              </div>
              <div className="flex gap-2">
                {item.foto_principale_url && <a href={item.foto_principale_url} download className="rounded-app border border-asfalto/15 px-3 py-2 font-mono text-[10px] font-bold uppercase dark:border-white/15">Foto 1</a>}
                {item.foto_secondaria_url && <a href={item.foto_secondaria_url} download className="rounded-app border border-asfalto/15 px-3 py-2 font-mono text-[10px] font-bold uppercase dark:border-white/15">Foto 2</a>}
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <label className="flex-1 cursor-pointer rounded-app border-2 border-dashed border-asfalto/15 px-4 py-3 font-mono text-xs uppercase dark:border-white/15">
                {file[item.id]?.name ?? 'Seleziona PLY / SPLAT / KSPLAT / GLB'}
                <input
                  type="file"
                  accept=".ply,.splat,.ksplat,.glb"
                  className="hidden"
                  onChange={(event) => setFile((attuali) => ({ ...attuali, [item.id]: event.target.files?.[0] ?? null }))}
                />
              </label>
              <button type="button" disabled={!file[item.id] || caricando === item.id} onClick={() => pubblica(item.id)} className="rounded-app bg-red-600 px-5 py-3 font-mono text-xs font-bold uppercase text-white disabled:opacity-40">
                {caricando === item.id ? 'Pubblicazione…' : 'Pubblica nel garage'}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
