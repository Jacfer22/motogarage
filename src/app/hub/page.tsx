'use client';

import Link from 'next/link';
import Logo from '@/components/Logo';
import { useAuth } from '@/components/AuthProvider';
import { etichettaCategoria } from '@/lib/categorie-moto';
import BadgeUtente from '@/components/BadgeUtente';
import ChecklistHub from '@/components/ChecklistHub';
import AppPageShell from '@/components/AppPageShell';
import AuthWall, { AuthWallLoading } from '@/components/AuthWall';
import { getSupabaseBrowser } from '@/lib/supabase-browser';
import { useEffect, useState } from 'react';

interface AvvisoHub {
  id: string;
  titolo: string;
  descrizione: string;
  fonte: string;
  itinerari: { slug: string; titolo: string } | null;
}

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
    case 'foto':
      return <svg {...props}><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="8.5" cy="10" r="1.5" /><path d="m21 16-4.5-4.5L7 21" /></svg>;
    case 'profilo':
      return <svg {...props}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.5-6 8-6s8 2 8 6" /></svg>;
    default:
      return null;
  }
}

export default function PaginaHub() {
  const { user, profilo, loading } = useAuth();
  const [avviso, setAvviso] = useState<AvvisoHub | null>(null);

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

  if (loading) {
    return (
      <AppPageShell width="full" className="min-h-[60vh]">
        <AuthWallLoading />
      </AppPageShell>
    );
  }

  if (!user) {
    return (
      <AppPageShell width="full">
        <AuthWall
          titolo="Il tuo cockpit"
          descrizione="Accedi per aprire l'hub personale: garage, giri, traccia e community."
        />
      </AppPageShell>
    );
  }

  const categoria = etichettaCategoria(profilo?.categoria_moto ?? null);

  return (
    <AppPageShell width="full" className="!pb-6">
      <section className="pb-4">
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

      <section className="py-4">
        <div className="rounded-app-lg bg-asfalto p-1"><BadgeUtente /></div>
      </section>

      <section className="py-2">
        <Link
          href="/garage"
          className="tap flex items-center gap-4 rounded-app-lg border border-brand/35 bg-brand/10 p-5 transition-colors hover:bg-brand/15"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-app bg-brand/25 text-brand">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <path d="M8 21V10c0-1 .5-2 2-2h4c1.5 0 2 1 2 2v11" />
            </svg>
          </span>
          <span className="min-w-0">
            <span className="block font-mono text-[10px] uppercase tracking-[0.2em] text-brand">Il tuo spazio</span>
            <span className="block font-display text-xl font-black uppercase leading-tight text-white">Il mio Garage</span>
            <span className="mt-0.5 block text-sm text-cemento/55">Avatar 3D e officina virtuale</span>
          </span>
          <span className="shrink-0 font-mono text-xs font-bold uppercase text-brand">Entra →</span>
        </Link>

        <Link
          href="/traccia"
          className="tap mt-3 flex flex-col items-center justify-center rounded-app-lg border border-brand/25 bg-white/[0.03] py-8 text-center transition-colors hover:border-brand/40 hover:bg-brand/[0.06]"
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-brand">Pronto?</span>
          <span className="mt-2 font-display text-3xl font-black uppercase leading-none tracking-tight text-white">
            Traccia un giro
          </span>
          <span className="mt-2 font-mono text-[10px] uppercase text-cemento/50">GPS · card · community</span>
        </Link>
      </section>

      <section className="py-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cemento/40">Accesso rapido</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Link
            href="/itinerari"
            className="tap rounded-app border border-white/10 bg-white/[0.03] p-3 transition-colors hover:border-brand/30"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-app bg-white/10 text-cemento">
              <IconaHub nome="strada" />
            </span>
            <p className="mt-2 font-display text-sm font-bold uppercase leading-tight text-white">Itinerari</p>
            <p className="mt-0.5 text-[11px] text-cemento/45">Regione per regione</p>
          </Link>
          <Link
            href="/community"
            className="tap rounded-app border border-white/10 bg-white/[0.03] p-3 transition-colors hover:border-brand/30"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-app bg-white/10 text-cemento">
              <IconaHub nome="foto" />
            </span>
            <p className="mt-2 font-display text-sm font-bold uppercase leading-tight text-white">Community</p>
            <p className="mt-0.5 text-[11px] text-cemento/45">Foto e giri pubblici</p>
          </Link>
          <Link
            href="/giri"
            className="tap rounded-app border border-white/10 bg-white/[0.03] p-3 transition-colors hover:border-brand/30"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-app bg-brand/20 text-brand">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M4 6h16M4 12h10M4 18h6" />
              </svg>
            </span>
            <p className="mt-2 font-display text-sm font-bold uppercase leading-tight text-white">I miei giri</p>
            <p className="mt-0.5 text-[11px] text-cemento/45">Percorsi salvati</p>
          </Link>
          <Link
            href="/account"
            className="tap rounded-app border border-white/10 bg-white/[0.03] p-3 transition-colors hover:border-brand/30"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-app bg-white/10 text-cemento">
              <IconaHub nome="profilo" />
            </span>
            <p className="mt-2 font-display text-sm font-bold uppercase leading-tight text-white">Profilo</p>
            <p className="mt-0.5 text-[11px] text-cemento/45">Username e moto</p>
          </Link>
        </div>
      </section>

      {avviso && (
        <section className="mt-2 rounded-app border border-cartello/40 bg-cartello/10 p-4">
          <p className="font-mono text-[10px] uppercase tracking-wide text-cartello">Strada</p>
          <p className="mt-1 text-sm font-medium text-white">{avviso.titolo}</p>
          {avviso.itinerari && (
            <Link href={`/itinerari/${avviso.itinerari.slug}`} className="mt-2 inline-block font-mono text-[10px] uppercase text-brand underline">
              Vedi itinerario
            </Link>
          )}
        </section>
      )}
    </AppPageShell>
  );
}
