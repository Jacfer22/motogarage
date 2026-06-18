'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { getSupabaseBrowser } from '@/lib/supabase-browser';

export default function PaginaPro() {
  const { user, profilo } = useAuth();
  const [email, setEmail] = useState('');
  const [piano, setPiano] = useState<'mensile' | 'annuale'>('annuale');
  const [stato, setStato] = useState<'idle' | 'invio' | 'fatto' | 'errore'>('idle');
  const [errore, setErrore] = useState<string | null>(null);

  const giaPro = !!profilo?.is_pro;

  async function iscriviti() {
    setErrore(null);
    const emailPulita = (email || user?.email || '').trim().toLowerCase();
    if (!emailPulita || !emailPulita.includes('@')) {
      setErrore('Inserisci un indirizzo email valido.');
      return;
    }

    setStato('invio');
    try {
      const supabase = getSupabaseBrowser();
      if (!supabase) {
        // nessun database in locale: simulo successo
        setStato('fatto');
        return;
      }
      const { error } = await supabase.from('lista_attesa_pro').insert({
        email: emailPulita,
        piano_interesse: piano,
        utente_id: user?.id ?? null,
      });
      // 23505 = email gia' presente: per l'utente e' comunque un successo
      if (error && error.code !== '23505') {
        setErrore('Non sono riuscito a registrare la tua email. Riprova.');
        setStato('errore');
        return;
      }
      setStato('fatto');
    } catch {
      setErrore('Qualcosa è andato storto. Riprova.');
      setStato('errore');
    }
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-14">
      <p className="font-mono text-sm uppercase tracking-[0.2em] text-cartello">GiroSecco Pro</p>
      <h1 className="mt-2 font-display text-5xl font-bold uppercase leading-none tracking-tight sm:text-7xl">
        Il giro completo,
        <br />
        <span className="text-bosco">senza pensieri.</span>
      </h1>

      <ul className="card-app mt-8 space-y-3 p-6">
        {[
          'Tracce GPX di tutti gli itinerari, pronte per il navigatore',
          'Varianti del percorso: versione corta, versione panoramica',
          'Pacchetto weekend: orari, soste, dove dormire',
          'Nuovi itinerari ogni mese, provati su strada',
        ].map((voce) => (
          <li key={voce} className="flex gap-3">
            <span className="font-mono font-medium text-bosco">✓</span>
            <span>{voce}</span>
          </li>
        ))}
      </ul>

      {/* Anteprima prezzi (non ancora attivabili) */}
      <div className="mt-8 flex flex-col gap-4 sm:flex-row">
        <div className="flex-1 rounded-app border-2 border-segnale bg-asfalto p-6 text-cemento">
          <div className="flex items-center justify-between">
            <p className="font-mono text-sm uppercase text-segnale">Annuale</p>
            <span className="rounded-full bg-segnale px-2 py-0.5 font-mono text-[10px] font-medium uppercase text-asfalto">
              Risparmi
            </span>
          </div>
          <p className="mt-1 font-display text-5xl font-bold">29€</p>
          <p className="font-mono text-xs text-guardrail">all&apos;anno · 2,42€/mese</p>
        </div>
        <div className="flex-1 rounded-app border-2 border-asfalto bg-white p-6">
          <p className="font-mono text-sm uppercase text-cartello">Mensile</p>
          <p className="mt-1 font-display text-5xl font-bold">3,99€</p>
          <p className="font-mono text-xs text-asfalto/50">al mese</p>
        </div>
      </div>

      {giaPro ? (
        <div className="mt-8 rounded-app border-2 border-segnale bg-segnale/10 p-6 text-center">
          <p className="font-display text-2xl font-bold uppercase tracking-tight">Sei già Pro ✓</p>
          <Link href="/hub" className="tap mt-3 inline-block rounded-app bg-asfalto px-5 py-2.5 font-mono text-sm uppercase text-cemento">
            Vai al tuo hub
          </Link>
        </div>
      ) : (
        <div className="mt-8 rounded-app-lg border-2 border-asfalto bg-cemento p-6">
          {stato === 'fatto' ? (
            <div className="text-center">
              <p className="font-display text-2xl font-bold uppercase tracking-tight text-bosco">
                Ci sei! Ti avvisiamo noi 🏍️
              </p>
              <p className="mt-2 text-asfalto/70">
                Sei in lista. Appena il Pro sarà attivo ti scriviamo all&apos;email che
                ci hai lasciato — sarai tra i primi a provarlo.
              </p>
            </div>
          ) : (
            <>
              <p className="font-display text-2xl font-bold uppercase tracking-tight">
                Pro · in arrivo
              </p>
              <p className="mt-1 text-sm text-asfalto/70">
                Itinerari premium con GPX, varianti panoramiche e pacchetti
                weekend. Lascia l&apos;email e non perderti il lancio: i primi
                iscritti avranno un occhio di riguardo.
              </p>

              {/* Scelta piano d'interesse */}
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => setPiano('annuale')}
                  className={`tap flex-1 rounded-app border-2 px-3 py-2 font-mono text-xs font-medium uppercase ${
                    piano === 'annuale' ? 'border-segnale bg-segnale/10' : 'border-asfalto/15 text-asfalto/60'
                  }`}
                >
                  Mi interessa l&apos;annuale
                </button>
                <button
                  type="button"
                  onClick={() => setPiano('mensile')}
                  className={`tap flex-1 rounded-app border-2 px-3 py-2 font-mono text-xs font-medium uppercase ${
                    piano === 'mensile' ? 'border-segnale bg-segnale/10' : 'border-asfalto/15 text-asfalto/60'
                  }`}
                >
                  Mi interessa il mensile
                </button>
              </div>

              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={user?.email || 'la-tua@email.it'}
                  className="flex-1 rounded-app border border-asfalto/20 px-4 py-3 text-sm focus:border-segnale focus:outline-none"
                />
                <button
                  type="button"
                  onClick={iscriviti}
                  disabled={stato === 'invio'}
                  className="tap rounded-app bg-segnale px-6 py-3 font-mono text-sm font-medium uppercase text-asfalto hover:bg-asfalto hover:text-cemento disabled:opacity-60"
                >
                  {stato === 'invio' ? 'Invio…' : 'Avvisami'}
                </button>
              </div>
              {errore && <p className="mt-2 text-sm text-cartello">{errore}</p>}
              <p className="mt-3 font-mono text-[11px] text-asfalto/45">
                Useremo la tua email solo per avvisarti del lancio del Pro. Niente spam.
              </p>
            </>
          )}
        </div>
      )}

      <div className="mt-6 text-center">
        <Link
          href="/itinerari"
          className="tap inline-block font-mono text-sm uppercase tracking-wide text-asfalto/60 hover:text-asfalto"
        >
          Intanto esplora gli itinerari →
        </Link>
      </div>
    </section>
  );
}
