'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Logo from '@/components/Logo';
import { useAuth } from '@/components/AuthProvider';
import { getSupabaseBrowser } from '@/lib/supabase-browser';
import { etichettaCategoria } from '@/lib/categorie-moto';
import BadgeUtente from '@/components/BadgeUtente';

interface AvvisoHub {
  id: string;
  titolo: string;
  descrizione: string;
  fonte: string;
  itinerari: { slug: string; titolo: string } | null;
}

interface AzioneHub {
  href: string;
  icona: string;
  titolo: string;
  sotto: string;
  accento?: boolean;
  soloFree?: boolean;
  soloAdmin?: boolean;
}

const AZIONI: AzioneHub[] = [
  { href: '/garage', icona: 'garage', titolo: 'Il mio Garage', sotto: 'Gemelli digitali e richieste Pro', accento: true },
  { href: '/itinerari', icona: 'strada', titolo: 'Itinerari', sotto: 'Gli itinerari, regione per regione' },
  { href: '/traccia', icona: 'gps', titolo: 'Traccia un giro', sotto: 'Registra percorso e statistiche' },
  { href: '/community', icona: 'foto', titolo: 'Community', sotto: 'Foto, commenti e giri dei biker' },
  { href: '/giri', icona: 'gps', titolo: 'I miei giri', sotto: 'Percorsi salvati e card social' },
  { href: '/community/classifica', icona: 'classifica', titolo: 'Classifica km', sotto: 'I biker con più chilometri' },
  { href: '/account', icona: 'profilo', titolo: 'Il tuo profilo', sotto: 'Foto, username e moto' },
  { href: '/pro', icona: 'pro', titolo: 'MotoGarage Pro', sotto: 'Gemello digitale, GPX e contenuti premium', soloFree: true },
  { href: '/admin', icona: 'admin', titolo: 'Pannello admin', sotto: 'Gemelli, utenti e moderazione', soloAdmin: true },
];

function IconaHub({ nome }: { nome: string }) {
  const props = {
    width: 26,
    height: 26,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };
  switch (nome) {
    case 'strada':
      return <svg {...props}><path d="M4 22 9 2" /><path d="M20 22 15 2" /><path d="M12 6v2M12 12v2M12 18v2" /></svg>;
    case 'gps':
      return <svg {...props}><circle cx="12" cy="10" r="3" /><path d="M12 2a8 8 0 0 0-8 8c0 5.5 8 12 8 12s8-6.5 8-12a8 8 0 0 0-8-8z" /></svg>;
    case 'foto':
      return <svg {...props}><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="8.5" cy="10" r="1.5" /><path d="m21 16-4.5-4.5L7 21" /></svg>;
    case 'classifica':
      return <svg {...props}><path d="M8 21h8" /><path d="M12 17V7" /><path d="M7 7h10L12 3z" /></svg>;
    case 'profilo':
      return <svg {...props}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.5-6 8-6s8 2 8 6" /></svg>;
    case 'pro':
      return <svg {...props}><path d="m12 2 3 6 6 .9-4.5 4.2 1 6.4L12 16.8 6.5 19.5l1-6.4L3 8.9 9 8z" /></svg>;
    case 'admin':
      return <svg {...props}><path d="M12 2 4 6v6c0 4.5 3.5 8 8 10 4.5-2 8-5.5 8-10V6z" /><path d="m9 12 2 2 4-4" /></svg>;
    case 'garage':
      return <svg {...props}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><path d="M8 21V10c0-1 .5-2 2-2h4c1.5 0 2 1 2 2v11" /><circle cx="12" cy="15" r="1.5" /></svg>;
    default:
      return null;
  }
}

export default function PaginaHub() {
  const { user, profilo, loading } = useAuth();
  const [avviso, setAvviso] = useState<AvvisoHub | null>(null);

  useEffect(() => {
    if (!loading && !user) window.location.href = '/accedi';
  }, [loading, user]);

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    if (!supabase) return;
    supabase
      .from('avvisi')
      .select('id, titolo, descrizione, fonte, itinerari(slug, titolo)')
      .eq('attivo', true)
      .order('data', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setAvviso(data as unknown as AvvisoHub);
      });
  }, []);

  if (loading || !user) {
    return <div className="flex min-h-[60vh] items-center justify-center"><div className="mezzeria w-32" /></div>;
  }

  const isPro = Boolean(profilo?.is_pro || profilo?.is_admin);
  const isAdmin = Boolean(profilo?.is_admin);
  const categoria = etichettaCategoria(profilo?.categoria_moto ?? null);
  const azioni = AZIONI.filter((azione) => {
    if (azione.soloAdmin && !isAdmin) return false;
    if (azione.soloFree && isPro) return false;
    return true;
  });

  return (
    <div className="min-h-[80vh]">
      <section className="bg-asfalto text-cemento">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            <div className="relative shrink-0">
              {profilo?.avatar_url ? (
                <img src={profilo.avatar_url} alt="" className="h-20 w-20 border-2 border-red-600 object-cover sm:h-24 sm:w-24" />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center border-2 border-red-600 bg-asfalto sm:h-24 sm:w-24">
                  <Logo variante="icon" />
                </div>
              )}
              {(isAdmin || isPro) && (
                <span className={`absolute -bottom-2 -right-2 px-2 py-0.5 font-mono text-[10px] uppercase ${isAdmin ? 'bg-cartello text-cemento' : 'bg-red-600 text-white'}`}>
                  {isAdmin ? 'admin' : 'pro'}
                </span>
              )}
            </div>
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-guardrail">Bentornato</p>
              <h1 className="font-display text-4xl font-bold uppercase leading-none tracking-tight sm:text-5xl">
                {profilo?.username ?? 'Motociclista'}
              </h1>
              {(categoria || profilo?.moto) && (
                <p className="mt-1 font-mono text-sm text-guardrail">{[categoria, profilo?.moto].filter(Boolean).join(' · ')}</p>
              )}
            </div>
          </div>

          <div className="rounded-app border border-white/10 bg-white/[0.04] p-4 sm:text-right">
            <p className="font-mono text-xs uppercase tracking-wide text-guardrail">Stato account</p>
            <p className={`mt-1 font-display text-xl font-bold uppercase ${isAdmin ? 'text-cartello' : isPro ? 'text-red-400' : 'text-cemento'}`}>
              {isAdmin ? 'Admin · tutto sbloccato' : isPro ? 'Pro attivo' : 'Account free'}
            </p>
            {!isPro && (
              <Link href="/pro" className="mt-2 inline-block rounded-app bg-red-600 px-3 py-1.5 font-mono text-xs font-medium uppercase text-white">
                Scopri Pro →
              </Link>
            )}
          </div>
        </div>
        <div className="strada-viva strada-viva-animata" aria-hidden="true" />
      </section>

      <section className="mx-auto -mt-8 max-w-6xl px-4">
        <div className="rounded-app-lg bg-asfalto p-1"><BadgeUtente /></div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-asfalto/40">Cosa vuoi fare?</p>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {azioni.map((azione) => (
            <Link
              key={azione.titolo}
              href={azione.href}
              className={`card-app group flex flex-col p-5 ${azione.accento ? 'border-red-600 bg-asfalto text-cemento' : ''}`}
            >
              <span className={`flex h-11 w-11 items-center justify-center rounded-app ${azione.accento ? 'bg-red-600 text-white' : 'bg-asfalto/[0.04] text-asfalto group-hover:bg-red-600 group-hover:text-white'}`}>
                <IconaHub nome={azione.icona} />
              </span>
              <h2 className="mt-4 font-display text-2xl font-bold uppercase leading-tight tracking-tight sm:text-3xl">{azione.titolo}</h2>
              <p className={`mt-1 text-sm ${azione.accento ? 'text-guardrail' : 'text-asfalto/60'}`}>{azione.sotto}</p>
              <span className={`mt-4 font-mono text-xs uppercase ${azione.accento ? 'text-red-400' : 'text-asfalto/50'}`}>Vai →</span>
            </Link>
          ))}
        </div>
      </section>

      {avviso && (
        <section className="mx-auto max-w-6xl px-4 pb-10">
          <div className="border-2 border-cartello bg-cartello/10 p-5">
            <p className="font-mono text-xs uppercase tracking-wide text-cartello">Condizioni strada</p>
            <p className="mt-1 font-medium">{avviso.titolo}</p>
            <p className="mt-1 text-sm text-asfalto/70">{avviso.descrizione}</p>
            {avviso.itinerari && (
              <Link href={`/itinerari/${avviso.itinerari.slug}`} className="mt-3 inline-block font-mono text-xs uppercase underline">
                Vedi {avviso.itinerari.titolo} →
              </Link>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
