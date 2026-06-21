'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Logo from '@/components/Logo';
import { useAuth } from '@/components/AuthProvider';
import { getSupabaseBrowser } from '@/lib/supabase-browser';
import { etichettaCategoria } from '@/lib/categorie-moto';
import BadgeUtente from '@/components/BadgeUtente';
import ChecklistHub from '@/components/ChecklistHub';

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
  { href: '/garage', icona: 'garage', titolo: 'Il mio Garage', sotto: 'Avatar 3D e richieste Pro', accento: true },
  { href: '/itinerari', icona: 'strada', titolo: 'Itinerari', sotto: 'Gli itinerari, regione per regione' },
  { href: '/traccia', icona: 'gps', titolo: 'Traccia un giro', sotto: 'Registra percorso e statistiche' },
  { href: '/community', icona: 'foto', titolo: 'Community', sotto: 'Foto, commenti e giri dei biker' },
  { href: '/giri', icona: 'gps', titolo: 'I miei giri', sotto: 'Percorsi salvati e card social' },
  { href: '/community/classifica', icona: 'classifica', titolo: 'Classifica km', sotto: 'I biker con più chilometri' },
  { href: '/account', icona: 'profilo', titolo: 'Il tuo profilo', sotto: 'Foto, username e moto' },
  { href: '/pro', icona: 'pro', titolo: 'MotoGarage Pro', sotto: 'Avatar 3D, GPX e contenuti premium', soloFree: true },
  { href: '/admin', icona: 'admin', titolo: 'Pannello admin', sotto: 'Avatar 3D, utenti e moderazione', soloAdmin: true },
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
    <div className="app-pagina min-h-[100dvh] pb-6">
      <section className="px-4 pt-6 pb-4">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            {profilo?.avatar_url ? (
              <img src={profilo.avatar_url} alt="" className="h-14 w-14 rounded-full border-2 border-brand object-cover" />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-brand bg-black/40">
                <Logo variante="icon" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-brand">Cockpit</p>
            <h1 className="truncate font-display text-2xl font-black uppercase leading-none tracking-tight text-white">
              {profilo?.username ?? 'Motociclista'}
            </h1>
            {(categoria || profilo?.moto) && (
              <p className="mt-0.5 truncate font-mono text-[11px] text-cemento/50">
                {[categoria, profilo?.moto].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
        </div>
      </section>

      <ChecklistHub
        utenteId={user.id}
        profiloOk={Boolean(profilo?.username && profilo?.avatar_url)}
      />

      <section className="px-4 py-4">
        <div className="rounded-app-lg bg-asfalto p-1"><BadgeUtente /></div>
      </section>

      <section className="px-4 py-2">
        <Link
          href="/traccia"
          className="tap flex flex-col items-center justify-center rounded-app-lg border border-brand/40 bg-brand/15 py-10 text-center shadow-[0_0_40px_rgba(209,25,25,0.15)] transition-colors hover:bg-brand/25"
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-brand">Pronto?</span>
          <span className="mt-2 font-display text-4xl font-black uppercase leading-none tracking-tight text-white">
            Traccia un giro
          </span>
          <span className="mt-2 font-mono text-[10px] uppercase text-cemento/50">GPS · card · community</span>
        </Link>
        <Link
          href="/naviga"
          className="tap mt-3 flex items-center justify-between rounded-app border border-white/10 bg-white/[0.04] px-4 py-3.5"
        >
          <span>
            <span className="block font-mono text-[10px] uppercase tracking-wide text-cemento/45">Navigatore</span>
            <span className="block text-sm font-medium text-white">Destinazione + voce + mappa full</span>
          </span>
          <span className="font-mono text-xs font-bold uppercase text-brand">Apri</span>
        </Link>
      </section>

      <section className="px-4 py-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cemento/40">Accesso rapido</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {azioni.filter((a) => !a.accento && a.href !== '/traccia').slice(0, 6).map((azione) => (
            <Link
              key={azione.titolo}
              href={azione.href}
              className="tap rounded-app border border-white/10 bg-white/[0.03] p-3 transition-colors hover:border-brand/30"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-app bg-brand/20 text-brand">
                <IconaHub nome={azione.icona} />
              </span>
              <p className="mt-2 font-display text-sm font-bold uppercase leading-tight text-white">{azione.titolo}</p>
            </Link>
          ))}
        </div>
      </section>

      {avviso && (
        <section className="mx-4 mt-2 rounded-app border border-cartello/40 bg-cartello/10 p-4">
          <p className="font-mono text-[10px] uppercase tracking-wide text-cartello">Strada</p>
          <p className="mt-1 text-sm font-medium text-white">{avviso.titolo}</p>
          {avviso.itinerari && (
            <Link href={`/itinerari/${avviso.itinerari.slug}`} className="mt-2 inline-block font-mono text-[10px] uppercase text-brand underline">
              Vedi itinerario
            </Link>
          )}
        </section>
      )}
    </div>
  );
}
