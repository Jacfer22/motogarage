'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase-browser';
import { useAuth } from './AuthProvider';

interface Risultato {
  id: string;
  username: string;
  avatar_url: string | null;
  moto: string | null;
  is_pro: boolean;
}

function iniziali(username: string) {
  return username.slice(0, 2).toUpperCase();
}

export default function CercaUtenti() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [risultati, setRisultati] = useState<Risultato[] | null>(null);
  const [errore, setErrore] = useState('');
  const [cerca, setCerca] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);

    const q = query.trim();
    if (q.length < 2) {
      setRisultati(null);
      setErrore('');
      return;
    }

    if (!user) {
      setRisultati([]);
      setErrore('Accedi per cercare utenti per username o email.');
      return;
    }

    timer.current = setTimeout(async () => {
      setCerca(true);
      setErrore('');
      try {
        const supabase = getSupabaseBrowser();
        if (!supabase) throw new Error('Supabase non configurato.');
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) throw new Error('Sessione scaduta. Accedi di nuovo.');

        const risposta = await fetch(`/api/utenti/cerca?q=${encodeURIComponent(q)}`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const json = await risposta.json() as { risultati?: Risultato[]; errore?: string };
        if (!risposta.ok) throw new Error(json.errore ?? 'Ricerca non riuscita.');
        setRisultati(json.risultati ?? []);
      } catch (error) {
        setRisultati([]);
        setErrore(error instanceof Error ? error.message : 'Ricerca non riuscita.');
      } finally {
        setCerca(false);
      }
    }, 320);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [query, user]);

  return (
    <section className="rounded-app-lg border border-asfalto/12 bg-white/60 p-4 shadow-app dark:bg-carbone/80">
      <label htmlFor="cerca-utenti" className="font-mono text-[11px] uppercase tracking-[0.2em] text-asfalto/65 dark:text-cemento/70">
        Cerca rider
      </label>
      <div className="relative mt-2">
        <input
          id="cerca-utenti"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Username o email…"
          autoComplete="off"
          spellCheck={false}
          className="input-app w-full pr-10"
        />
        {cerca && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px] uppercase text-asfalto/60 dark:text-cemento/65">
            …
          </span>
        )}
      </div>
      {!user && (
        <p className="mt-2 text-xs text-asfalto/65 dark:text-cemento/70">
          <Link href="/accedi" className="text-brand hover:underline">Accedi</Link>
          {' '}per cercare per username o email.
        </p>
      )}

      {errore && query.trim().length >= 2 && (
        <p className="mt-3 text-sm text-red-700 dark:text-red-300">{errore}</p>
      )}

      {risultati && risultati.length > 0 && (
        <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto">
          {risultati.map((item) => (
            <li key={item.id}>
              <Link
                href={`/profilo/${item.username}`}
                className="flex items-center gap-3 rounded-app border border-asfalto/10 bg-white/80 p-3 transition-colors hover:border-brand/35 dark:bg-black/25"
              >
                {item.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-asfalto font-display text-sm font-bold text-cemento">
                    {iniziali(item.username)}
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display text-lg font-bold uppercase">{item.username}</span>
                  {item.moto && <span className="block truncate font-mono text-[10px] uppercase text-asfalto/65 dark:text-cemento/70">{item.moto}</span>}
                </span>
                {item.is_pro && (
                  <span className="shrink-0 rounded-full bg-brand px-2 py-0.5 font-mono text-[9px] font-bold uppercase text-white">Pro</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {risultati && risultati.length === 0 && query.trim().length >= 2 && !cerca && !errore && (
        <p className="mt-3 font-mono text-xs uppercase text-asfalto/65 dark:text-cemento/70">Nessun utente trovato.</p>
      )}
    </section>
  );
}
