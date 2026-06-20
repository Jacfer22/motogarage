'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { getSupabaseBrowser } from '@/lib/supabase-browser';

const VANTAGGI = [
  'Gemello digitale 3D della tua moto da 1–2 foto',
  'Garage pubblico visitabile e modello PLY scaricabile',
  'Tracce GPX di tutti gli itinerari',
  'Varianti panoramiche e pacchetti weekend',
  'Nuovi itinerari e funzioni in anteprima',
];

export default function PaginaPro() {
  const { user, profilo } = useAuth();
  const [email, setEmail] = useState('');
  const [piano, setPiano] = useState<'mensile' | 'annuale'>('annuale');
  const [stato, setStato] = useState<'idle' | 'invio' | 'fatto' | 'errore'>('idle');
  const [errore, setErrore] = useState<string | null>(null);
  const giaPro = Boolean(profilo?.is_pro || profilo?.is_admin);

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
        setStato('fatto');
        return;
      }
      const { error } = await supabase.from('lista_attesa_pro').insert({
        email: emailPulita,
        piano_interesse: piano,
        utente_id: user?.id ?? null,
      });
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
    <section className="mx-auto max-w-4xl px-4 py-14">
      <p className="font-mono text-sm uppercase tracking-[0.2em] text-red-600">MotoGarage Pro</p>
      <h1 className="mt-2 font-display text-5xl font-bold uppercase leading-none tracking-tight sm:text-7xl">
        La tua moto ha finalmente una casa digitale.
      </h1>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <ul className="card-app space-y-3 p-6">
          {VANTAGGI.map((voce) => (
            <li key={voce} className="flex gap-3">
              <span className="font-mono font-bold text-red-600">✓</span>
              <span>{voce}</span>
            </li>
          ))}
        </ul>
        <div className="overflow-hidden rounded-app-lg bg-[#08090d] text-cemento shadow-app">
          <img src="/og-motogarage.png" alt="" className="aspect-video w-full object-cover object-[50%_68%]" />
          <div className="p-5">
            <p className="font-mono text-xs uppercase tracking-wide text-red-400">Gemello digitale incluso</p>
            <p className="mt-2 text-sm text-cemento/60">Il team MotoGarage genera e controlla il modello prima di pubblicarlo nel tuo garage.</p>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-4 sm:flex-row">
        <div className="flex-1 rounded-app border-2 border-red-600 bg-asfalto p-6 text-cemento">
          <div className="flex items-center justify-between">
            <p className="font-mono text-sm uppercase text-red-400">Annuale</p>
            <span className="rounded-full bg-red-600 px-2 py-0.5 font-mono text-[10px] uppercase text-white">Risparmi</span>
          </div>
          <p className="mt-1 font-display text-5xl font-bold">29€</p>
          <p className="font-mono text-xs text-guardrail">all&apos;anno · 2,42€/mese</p>
        </div>
        <div className="flex-1 rounded-app border-2 border-asfalto bg-white p-6 dark:bg-carbone">
          <p className="font-mono text-sm uppercase text-cartello">Mensile</p>
          <p className="mt-1 font-display text-5xl font-bold">3,99€</p>
          <p className="font-mono text-xs text-asfalto/65 dark:text-cemento/70">al mese</p>
        </div>
      </div>

      {giaPro ? (
        <div className="mt-8 rounded-app border-2 border-emerald-500 bg-emerald-500/10 p-6 text-center">
          <p className="font-display text-2xl font-bold uppercase tracking-tight">Il tuo account Pro è attivo ✓</p>
          <Link href="/garage" className="mt-3 inline-block rounded-app bg-red-600 px-5 py-2.5 font-mono text-sm uppercase text-white">
            Crea il gemello digitale
          </Link>
        </div>
      ) : (
        <div className="mt-8 rounded-app-lg border-2 border-asfalto bg-cemento p-6">
          {stato === 'fatto' ? (
            <div className="text-center">
              <p className="font-display text-2xl font-bold uppercase tracking-tight text-bosco">Ci sei! Ti avvisiamo noi 🏍️</p>
              <p className="mt-2 text-asfalto/75 dark:text-cemento/80">Sei in lista. Ti scriveremo quando apriremo ufficialmente MotoGarage Pro.</p>
            </div>
          ) : (
            <>
              <p className="font-display text-2xl font-bold uppercase tracking-tight">Pro · beta privata</p>
              <p className="mt-1 text-sm text-asfalto/75 dark:text-cemento/80">Durante la beta gli account Pro vengono attivati manualmente. Lascia la tua email per partecipare.</p>
              <div className="mt-4 flex gap-2">
                {(['annuale', 'mensile'] as const).map((item) => (
                  <button key={item} type="button" onClick={() => setPiano(item)} className={`flex-1 rounded-app border-2 px-3 py-2 font-mono text-xs font-medium uppercase ${piano === item ? 'border-red-600 bg-red-600/10' : 'border-asfalto/15 text-asfalto/70 dark:text-cemento/75'}`}>
                    {item}
                  </button>
                ))}
              </div>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder={user?.email || 'la-tua@email.it'} className="input-app flex-1 text-sm" />
                <button type="button" onClick={iscriviti} disabled={stato === 'invio'} className="rounded-app bg-red-600 px-6 py-3 font-mono text-sm font-medium uppercase text-white disabled:opacity-60">
                  {stato === 'invio' ? 'Invio…' : 'Candidati'}
                </button>
              </div>
              {errore && <p className="mt-2 rounded-app border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">{errore}</p>}
            </>
          )}
        </div>
      )}
    </section>
  );
}
