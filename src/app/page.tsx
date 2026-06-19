'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseBrowser } from '@/lib/supabase-browser';

type Modalita = 'accedi' | 'registrati';

const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;

export default function PaginaAccedi() {
  const router = useRouter();
  const supabase = getSupabaseBrowser();

  const [modalita, setModalita] = useState<Modalita>('accedi');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errore, setErrore] = useState<string | null>(null);
  const [messaggio, setMessaggio] = useState<string | null>(null);
  const [caricamento, setCaricamento] = useState(false);
  const [giaLoggato, setGiaLoggato] = useState(false);

  useEffect(() => {
    if (window.location.hash === '#registrati') {
      setModalita('registrati');
    }
  }, []);

  // Se già loggato, mostra banner e rimanda alla home dopo 1 secondo
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setGiaLoggato(true);
        setTimeout(() => { window.location.href = '/hub'; }, 800);
      }
    });
  }, [supabase]);

  if (!supabase) {
    return (
      <section className="mx-auto max-w-md px-4 py-14">
        <h1 className="font-display text-4xl font-bold uppercase tracking-tight">
          Accesso non disponibile
        </h1>
        <p className="mt-3 text-asfalto/70">
          Il sito non è ancora collegato a Supabase, quindi login e
          registrazione non funzionano in questo ambiente. Configura le
          variabili <code className="font-mono text-sm">NEXT_PUBLIC_SUPABASE_URL</code> e{' '}
          <code className="font-mono text-sm">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> per
          attivarlo.
        </p>
      </section>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrore(null);
    setMessaggio(null);

    if (modalita === 'registrati' && !USERNAME_REGEX.test(username)) {
      setErrore('Username: 3-20 caratteri, solo lettere minuscole, numeri e underscore.');
      return;
    }

    setCaricamento(true);

    if (modalita === 'accedi') {
      const { error } = await supabase!.auth.signInWithPassword({ email, password });
      setCaricamento(false);
      if (error) {
        setErrore(
          error.message.includes('Invalid login')
            ? 'Email o password non corretti.'
            : error.message.includes('not confirmed')
              ? 'Devi prima confermare l’email: controlla la posta e clicca sul link di conferma.'
              : error.message
        );
        return;
      }
      router.refresh();
      window.location.href = '/hub';
    } else {
      const { error } = await supabase!.auth.signUp({
        email,
        password,
        options: {
          data: { username },
          emailRedirectTo: `${window.location.origin}/accedi`,
        },
      });
      setCaricamento(false);
      if (error) {
        setErrore(
          error.message.includes('already registered')
            ? 'Questa email è già registrata. Prova ad accedere.'
            : error.message
        );
        return;
      }
      setMessaggio(
        `Ti abbiamo inviato un'email a ${email} con un link di conferma. Apri il link, poi torna qui e accedi.`
      );
      setModalita('accedi');
      setPassword('');
    }
  }

  return (
    <section className="mx-auto max-w-md px-4 py-14">
      <p className="font-mono text-sm uppercase tracking-widest text-cartello">
        GiroSecco
      </p>
      <h1 className="mt-1 font-display text-5xl font-bold uppercase leading-none tracking-tight">
        {modalita === 'accedi' ? 'Accedi' : 'Crea il tuo account'}
      </h1>

      {giaLoggato && (
        <div className="mt-6 border-2 border-segnale bg-segnale/10 p-4">
          <p className="font-medium text-asfalto">
            Sei già loggato — ti riportiamo all'hub…{' '}
            <a href="/hub" className="underline">vai subito →</a>
          </p>
        </div>
      )}
      <p className="mt-3 text-asfalto/70">
        {modalita === 'accedi'
          ? 'Per salvare i tuoi giri preferiti e, presto, commentare e caricare foto.'
          : 'Username, email e password. Userai questo account per i contenuti Pro e per partecipare alla community.'}
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        {modalita === 'registrati' && (
          <div>
            <label htmlFor="username" className="font-mono text-xs uppercase text-asfalto/60">
              Username
            </label>
            <input
              id="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              className="mt-1 w-full border-2 border-asfalto bg-white px-3 py-2 font-mono lowercase focus:outline-none"
              placeholder="es. jacopo_rm"
              pattern="[a-z0-9_]{3,20}"
              autoCapitalize="none"
            />
            <p className="mt-1 font-mono text-xs text-asfalto/40">
              3-20 caratteri: lettere minuscole, numeri, underscore.
            </p>
          </div>
        )}

        <div>
          <label htmlFor="email" className="font-mono text-xs uppercase text-asfalto/60">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full border-2 border-asfalto bg-white px-3 py-2 focus:outline-none"
            placeholder="nome@esempio.it"
          />
        </div>
        <div>
          <label htmlFor="password" className="font-mono text-xs uppercase text-asfalto/60">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full border-2 border-asfalto bg-white px-3 py-2 focus:outline-none"
            placeholder="Almeno 6 caratteri"
          />
        </div>

        {errore && (
          <p className="border-2 border-red-700 bg-red-50 p-3 text-sm text-red-900">
            {errore}
          </p>
        )}
        {messaggio && (
          <p className="border-2 border-bosco bg-bosco/10 p-3 text-sm text-bosco">
            {messaggio}
          </p>
        )}

        <button
          type="submit"
          disabled={caricamento}
          className="w-full bg-segnale px-5 py-2.5 font-mono font-medium uppercase text-asfalto hover:bg-white disabled:opacity-60"
        >
          {caricamento
            ? 'Un momento…'
            : modalita === 'accedi'
              ? 'Accedi'
              : 'Crea account'}
        </button>

        {modalita === 'registrati' && (
          <p className="mt-3 text-center font-mono text-[11px] leading-relaxed text-asfalto/45">
            Creando un account accetti i{' '}
            <a href="/termini" className="underline hover:text-asfalto">Termini</a> e la{' '}
            <a href="/privacy" className="underline hover:text-asfalto">Privacy Policy</a>.
          </p>
        )}
      </form>

      <button
        type="button"
        onClick={() => {
          setModalita(modalita === 'accedi' ? 'registrati' : 'accedi');
          setErrore(null);
          setMessaggio(null);
        }}
        className="mt-4 font-mono text-sm uppercase text-asfalto/60 underline hover:text-asfalto"
      >
        {modalita === 'accedi' ? 'Non hai un account? Registrati' : 'Hai già un account? Accedi'}
      </button>

      <p className="mt-8 font-mono text-xs text-asfalto/40">
        <Link href="/" className="underline">
          ← Torna alla home
        </Link>
      </p>
    </section>
  );
}
