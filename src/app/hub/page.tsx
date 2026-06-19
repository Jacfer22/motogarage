'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
  ancora?: boolean;
  icona: string;
  titolo: string;
  sotto: string;
  accento?: boolean;
  soloFree?: boolean;
  soloAdmin?: boolean;
}

const AZIONI: AzioneHub[] = [
  {
    href: '/itinerari',
    ancora: false,
    icona: 'strada',
    titolo: 'Itinerari',
    sotto: 'Gli itinerari, regione per regione',
    accento: true,
  },
  {
    href: '/traccia',
    icona: 'gps',
    titolo: 'Traccia un giro',
    sotto: 'Registra il percorso e le statistiche',
  },
  {
    href: '/garage',
    icona: 'garage',
    titolo: 'Il mio garage',
    sotto: 'La tua moto, i tuoi giri, il tuo profilo',
  },
  {
    href: '/community',
    icona: 'foto',
    titolo: 'Community',
    sotto: 'Foto, commenti e giri dei biker',
  },
  {
    href: '/foto',
    icona: 'foto',
    titolo: 'Foto dei Bikers',
    sotto: 'Le foto della community, e le tue',
  },
  {
    href: '/blog',
    icona: 'blog',
    titolo: 'Blog',
    sotto: 'Strade e storie da chi guida',
  },
  {
    href: '/account',
    icona: 'profilo',
    titolo: 'Il tuo profilo',
    sotto: 'Foto, username, tipo di moto',
  },
  {
    href: '/pro',
    icona: 'pro',
    titolo: 'Piano Pro',
    sotto: 'GPX, varianti e pacchetti weekend',
    soloFree: true,
  },
  {
    href: '/admin',
    icona: 'admin',
    titolo: 'Pannello admin',
    sotto: 'Avvisi, utenti Pro, articoli del blog',
    soloAdmin: true,
  },
];

// Icone SVG inline per le card dell'hub.
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
    case 'blog':
      return <svg {...props}><path d="M4 4h16v16H4z" /><path d="M8 9h8M8 13h6" /></svg>;
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
    if (!loading && !user) {
      window.location.href = '/accedi';
    }
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
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="mezzeria w-32" />
      </div>
    );
  }

  const isPro = !!profilo?.is_pro || !!profilo?.is_admin;
  const isAdmin = !!profilo?.is_admin;
  const categoria = etichettaCategoria(profilo?.categoria_moto ?? null);

  const azioni = AZIONI.filter((a) => {
    if (a.soloAdmin && !isAdmin) return false;
    if (a.soloFree && isPro) return false;
    return true;
  });

  return (
    <div className="min-h-[80vh]">
      {/* Banner benvenuto */}
      <section className="bg-asfalto text-cemento">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between">
          {/* Avatar + info */}
          <div className="flex items-center gap-5">
            <div className="relative shrink-0">
              {profilo?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profilo.avatar_url}
                  alt=""
                  className="h-20 w-20 border-2 border-segnale object-cover sm:h-24 sm:w-24"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center border-2 border-segnale bg-asfalto sm:h-24 sm:w-24">
                  <Image src="/icon-bike.png" alt="" width={52} height={52} className="opacity-80" />
                </div>
              )}
              {isAdmin && (
                <span className="absolute -bottom-2 -right-2 bg-cartello px-1.5 py-0.5 font-mono text-[10px] uppercase text-cemento">
                  admin
                </span>
              )}
              {!isAdmin && isPro && (
                <span className="absolute -bottom-2 -right-2 bg-segnale px-1.5 py-0.5 font-mono text-[10px] uppercase text-asfalto">
                  pro
                </span>
              )}
            </div>
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-guardrail">
                Bentornato
              </p>
              <h1 className="font-display text-4xl font-bold uppercase leading-none tracking-tight sm:text-5xl">
                {profilo?.username ?? 'Motociclista'}
              </h1>
              {(categoria || profilo?.moto) && (
                <p className="mt-1 font-mono text-sm text-guardrail">
                  {[categoria, profilo?.moto].filter(Boolean).join(' · ')}
                </p>
              )}
              {!profilo?.username && (
                <Link
                  href="/account"
                  className="mt-2 inline-block font-mono text-xs uppercase text-segnale underline"
                >
                  Scegli un username →
                </Link>
              )}
            </div>
          </div>

          {/* Stato abbonamento */}
          <div className="shrink-0 rounded-app border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm sm:text-right">
            <p className="font-mono text-xs uppercase tracking-wide text-guardrail">Stato account</p>
            {isAdmin ? (
              <p className="mt-1 font-display text-xl font-bold uppercase text-cartello">
                Admin · tutto sbloccato
              </p>
            ) : isPro ? (
              <>
                <p className="mt-1 font-display text-xl font-bold uppercase text-segnale">
                  Pro attivo
                </p>
                <button
                  type="button"
                  onClick={async () => {
                    const supabase = getSupabaseBrowser();
                    const sess = await supabase?.auth.getSession();
                    const accessToken = sess?.data?.session?.access_token;
                    if (!accessToken) return;
                    const res = await fetch('/api/stripe/portale', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ accessToken }),
                    });
                    const json = await res.json();
                    if (json.url) window.location.href = json.url;
                  }}
                  className="tap mt-2 inline-block font-mono text-xs uppercase tracking-wide text-guardrail underline hover:text-cemento"
                >
                  Gestisci abbonamento
                </button>
              </>
            ) : (
              <>
                <p className="mt-1 font-display text-xl font-bold uppercase text-cemento">
                  Account free
                </p>
                <Link
                  href="/pro"
                  className="tap mt-2 inline-block rounded-app bg-segnale px-3 py-1.5 font-mono text-xs font-medium uppercase text-asfalto hover:bg-white"
                >
                  Passa a Pro →
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="mezzeria mezzeria-animata" aria-hidden="true" />
      </section>

      {/* Livello / badge km */}
      <section className="mx-auto -mt-8 max-w-6xl px-4">
        <div className="rounded-app-lg bg-asfalto p-1">
          <BadgeUtente />
        </div>
      </section>

      {/* Griglia azioni */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-asfalto/40">
          Cosa vuoi fare?
        </p>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {azioni.map((a) => {
            const accento = a.accento === true;
            const cls = accento
              ? 'card-app tap group flex flex-col p-5 bg-asfalto text-cemento border-asfalto'
              : 'card-app tap group flex flex-col p-5';

            const contenuto = (
              <>
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-app ${
                    accento ? 'bg-segnale text-asfalto' : 'bg-asfalto/[0.04] text-asfalto group-hover:bg-segnale group-hover:text-asfalto'
                  } transition-colors`}
                >
                  <IconaHub nome={a.icona} />
                </span>
                <h2 className="mt-4 font-display text-2xl font-bold uppercase leading-tight tracking-tight sm:text-3xl">
                  {a.titolo}
                </h2>
                <p className={`mt-1 text-sm ${accento ? 'text-guardrail' : 'text-asfalto/60'}`}>
                  {a.sotto}
                </p>
                <span
                  className={`mt-4 inline-flex items-center gap-1 font-mono text-xs uppercase tracking-wide ${
                    accento ? 'text-segnale' : 'text-asfalto/50 group-hover:text-asfalto'
                  } transition-colors`}
                >
                  Vai
                  <span className="transition-transform group-hover:translate-x-0.5">→</span>
                </span>
              </>
            );

            return a.ancora ? (
              <a key={a.titolo} href={a.href} className={cls}>
                {contenuto}
              </a>
            ) : (
              <Link key={a.titolo} href={a.href} className={cls}>
                {contenuto}
              </Link>
            );
          })}
        </div>
      </section>

      {/* Condizioni strada: avviso attivo dal database */}
      {avviso && (
        <section className="mx-auto max-w-6xl px-4 pb-10">
          <div className="border-2 border-cartello bg-cartello/10 p-5">
            <p className="font-mono text-xs uppercase tracking-wide text-cartello">
              Condizioni strada
            </p>
            <p className="mt-1 font-medium">{avviso.titolo}</p>
            <p className="mt-1 text-sm text-asfalto/70">{avviso.descrizione}</p>
            {avviso.itinerari && (
              <Link
                href={`/itinerari/${avviso.itinerari.slug}`}
                className="mt-3 inline-block font-mono text-xs uppercase underline hover:text-cartello"
              >
                Vedi {avviso.itinerari.titolo} →
              </Link>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
