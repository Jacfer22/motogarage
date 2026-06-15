'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { getSupabaseBrowser } from '@/lib/supabase-browser';

export default function PaginaNuovoArticolo() {
  const { user, loading, nonConfigurato } = useAuth();
  const supabase = getSupabaseBrowser();

  const [titolo, setTitolo] = useState('');
  const [contenuto, setContenuto] = useState('');
  const [errore, setErrore] = useState<string | null>(null);
  const [inviato, setInviato] = useState(false);
  const [caricamento, setCaricamento] = useState(false);

  async function invia(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase || !user) return;
    setErrore(null);

    if (titolo.trim().length < 5) {
      setErrore('Il titolo deve avere almeno 5 caratteri.');
      return;
    }
    if (contenuto.trim().length < 100) {
      setErrore('Il testo deve avere almeno 100 caratteri: raccontaci qualcosa di vero!');
      return;
    }

    setCaricamento(true);
    const { error } = await supabase.from('articoli').insert({
      autore_id: user.id,
      titolo: titolo.trim(),
      contenuto: contenuto.trim(),
    });
    setCaricamento(false);

    if (error) {
      setErrore(error.message);
      return;
    }
    setInviato(true);
  }

  if (loading) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-14">
        <p className="font-mono text-sm uppercase text-asfalto/40">Caricamento…</p>
      </section>
    );
  }

  if (nonConfigurato) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-14">
        <h1 className="font-display text-4xl font-bold uppercase tracking-tight">
          Non disponibile
        </h1>
        <p className="mt-3 text-asfalto/70">
          Il sito non è ancora collegato a Supabase in questo ambiente.
        </p>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-14">
        <p className="font-mono text-sm uppercase tracking-widest text-cartello">GiroSecco</p>
        <h1 className="mt-1 font-display text-5xl font-bold uppercase leading-none tracking-tight">
          Scrivi un articolo
        </h1>
        <div className="mt-8 border-2 border-asfalto bg-asfalto p-6 text-cemento">
          <p className="text-guardrail">Per scrivere un articolo serve un account gratuito.</p>
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

  if (inviato) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-14">
        <p className="font-mono text-sm uppercase tracking-widest text-cartello">GiroSecco</p>
        <h1 className="mt-1 font-display text-5xl font-bold uppercase leading-none tracking-tight">
          Articolo inviato
        </h1>
        <div className="mt-6 border-2 border-bosco bg-bosco/10 p-6">
          <p className="text-bosco">
            Grazie! Il tuo articolo è in revisione. Se va bene lo pubblichiamo
            sul blog con il tuo username.
          </p>
        </div>
        <Link
          href="/blog"
          className="mt-6 inline-block font-mono text-sm uppercase text-asfalto/60 underline hover:text-asfalto"
        >
          ← Torna al blog
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-2xl px-4 py-14">
      <p className="font-mono text-sm uppercase tracking-widest text-cartello">GiroSecco</p>
      <h1 className="mt-1 font-display text-5xl font-bold uppercase leading-none tracking-tight">
        Scrivi un articolo
      </h1>
      <p className="mt-3 text-asfalto/70">
        Racconta un giro, una strada, un consiglio utile. Lo leggiamo e, se va
        bene, lo pubblichiamo sul blog con il tuo username.
      </p>

      <form onSubmit={invia} className="mt-8 space-y-4">
        <div>
          <label htmlFor="titolo" className="font-mono text-xs uppercase text-asfalto/60">
            Titolo
          </label>
          <input
            id="titolo"
            type="text"
            value={titolo}
            onChange={(e) => setTitolo(e.target.value)}
            className="mt-1 w-full border-2 border-asfalto bg-white px-3 py-2 focus:outline-none"
            placeholder="es. Tre passi della Tuscia che non conosce nessuno"
          />
        </div>
        <div>
          <label htmlFor="contenuto" className="font-mono text-xs uppercase text-asfalto/60">
            Testo
          </label>
          <textarea
            id="contenuto"
            value={contenuto}
            onChange={(e) => setContenuto(e.target.value)}
            rows={12}
            className="mt-1 w-full border-2 border-asfalto bg-white px-3 py-2 leading-relaxed focus:outline-none"
            placeholder="Racconta il giro: dove sei partito, le strade, le soste, cosa ricordi..."
          />
          <p className="mt-1 font-mono text-xs text-asfalto/40">{contenuto.length} caratteri</p>
        </div>

        {errore && (
          <p className="border-2 border-red-700 bg-red-50 p-3 text-sm text-red-900">{errore}</p>
        )}

        <button
          type="submit"
          disabled={caricamento}
          className="w-full bg-segnale px-5 py-2.5 font-mono font-medium uppercase text-asfalto hover:bg-white disabled:opacity-60"
        >
          {caricamento ? 'Invio…' : 'Invia per la revisione'}
        </button>
      </form>

      <Link
        href="/blog"
        className="mt-6 inline-block font-mono text-sm uppercase text-asfalto/60 underline hover:text-asfalto"
      >
        ← Torna al blog
      </Link>
    </section>
  );
}
