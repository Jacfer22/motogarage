'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { GarageMoto } from '@/lib/garage';
import { dataMoto, nomeMoto } from '@/lib/garage';
import type { ProfiloGaragePubblico, StatisticheGaragePubblico } from '@/lib/garage-pubblico';
import { formattaKmDisplay } from '@/lib/geo';
import Logo from './Logo';
import IconaBadgeLivello from './icons/IconaBadgeLivello';
import { urlGaragePubblico } from './BloccoGarageBio';

const GarageModelViewer = dynamic(() => import('./GarageModelViewer'), {
  ssr: false,
  loading: () => <div className="garage-pub-skeleton" />,
});

interface Props {
  username: string;
  profilo: ProfiloGaragePubblico;
  moto: GarageMoto[];
  stats: StatisticheGaragePubblico;
  vetrinaAnteprima: string | null;
}

function iniziali(username: string) {
  return username.slice(0, 2).toUpperCase();
}

function dataGiro(iso: string) {
  return new Date(iso).toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function GaragePubblico({ username, profilo, moto, stats, vetrinaAnteprima }: Props) {
  const [selezionataId, setSelezionataId] = useState(moto[0]?.id ?? null);
  const [condiviso, setCondiviso] = useState(false);
  const [viewerPronto, setViewerPronto] = useState(false);

  const selezionata = useMemo(
    () => moto.find((item) => item.id === selezionataId) ?? moto[0] ?? null,
    [moto, selezionataId],
  );

  const link = urlGaragePubblico(username);

  async function condividi() {
    const testo = `Il garage 3D di ${username} su MotoGarage — ${stats.kmTotali > 0 ? `${stats.kmTotali} km · ` : ''}${stats.badge.nome}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${username} · MotoGarage`, text: testo, url: link });
        return;
      }
      await navigator.clipboard.writeText(link);
      setCondiviso(true);
      window.setTimeout(() => setCondiviso(false), 2500);
    } catch {
      /* annullato */
    }
  }

  return (
    <main className="garage-pub">
      <header className="garage-pub-header">
        <div className="garage-pub-identity">
          <div className="garage-pub-avatar" aria-hidden="true">
            {profilo.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profilo.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <span>{iniziali(username)}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-brand">Garage live</p>
            <h1 className="truncate font-display text-2xl font-black uppercase tracking-tight text-white sm:text-3xl">
              {username}
            </h1>
            {(profilo.moto || profilo.bio) && (
              <p className="mt-0.5 truncate text-xs text-cemento/55">
                {[profilo.moto, profilo.bio?.split('\n')[0]].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
          <button type="button" onClick={() => void condividi()} className="garage-pub-share tap" aria-label="Condividi">
            {condiviso ? '✓' : '↗'}
          </button>
        </div>

        <div className="garage-pub-badge-row">
          <IconaBadgeLivello badge={stats.badge} size="compact" />
          <div className="min-w-0 flex-1">
            <p className="font-display text-sm font-black uppercase text-white">{stats.badge.nome}</p>
            {stats.prossimoBadge && (
              <p className="font-mono text-[9px] uppercase text-cemento/45">
                {stats.avanzamentoPerc}% verso {stats.prossimoBadge.nome}
              </p>
            )}
          </div>
          {stats.kmTotali > 0 && (
            <p className="font-display text-2xl font-black text-[#f2b705]">
              {formattaKmDisplay(stats.kmTotali)}
              <span className="ml-0.5 text-sm text-cemento/50">km</span>
            </p>
          )}
        </div>
      </header>

      {moto.length === 0 ? (
        <section className="garage-pub-empty">
          <Logo variante="card" className="mx-auto opacity-90" />
          <h2 className="mt-6 font-display text-3xl font-black uppercase">Garage privato</h2>
          <p className="mt-3 max-w-sm text-sm text-cemento/55">
            {username} non ha ancora un avatar 3D pubblico. Crea il tuo garage e mettilo in bio.
          </p>
          <Link href="/accedi" className="tap btn-primary mt-6 inline-block px-8">
            Crea il tuo garage
          </Link>
        </section>
      ) : (
        <>
          <section className="garage-pub-viewer-wrap">
            {vetrinaAnteprima && !viewerPronto && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={vetrinaAnteprima}
                alt=""
                className="garage-pub-vetrina-poster"
                aria-hidden="true"
              />
            )}
            <div
              className="garage-pub-viewer"
              onPointerDown={() => setViewerPronto(true)}
            >
              <GarageModelViewer
                moto={moto}
                selezionataId={selezionataId}
                onSeleziona={setSelezionataId}
                modalitaHero
              />
            </div>
            <p className="garage-pub-viewer-hint font-mono text-[9px] uppercase tracking-wide text-cemento/35">
              Ruota · zoom · esplora
            </p>
          </section>

          <section className="garage-pub-stats">
            {[
              { l: 'Km totali', v: stats.kmTotali > 0 ? formattaKmDisplay(stats.kmTotali) : '—' },
              { l: 'Giri', v: String(stats.numGiri) },
              { l: 'In community', v: String(stats.numGiriPubblici) },
            ].map((x) => (
              <div key={x.l} className="garage-pub-stat">
                <p className="font-mono text-[8px] uppercase text-cemento/40">{x.l}</p>
                <p className="font-display text-xl font-black text-white">{x.v}</p>
              </div>
            ))}
          </section>

          {stats.ultimoGiro && (
            <section className="garage-pub-ultimo">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-brand">Ultimo giro in community</p>
              <Link href={`/giro/${stats.ultimoGiro.id}`} className="garage-pub-ultimo-card tap group">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-lg font-black uppercase text-white group-hover:text-brand">
                    {stats.ultimoGiro.nome}
                  </p>
                  <p className="mt-0.5 font-mono text-[10px] uppercase text-cemento/45">
                    {dataGiro(stats.ultimoGiro.created_at)} · {stats.ultimoGiro.curve} curve
                  </p>
                </div>
                <p className="font-display text-2xl font-black text-[#f2b705]">
                  {formattaKmDisplay(stats.ultimoGiro.km)} km
                </p>
              </Link>
            </section>
          )}

          {selezionata && (
            <section className="garage-pub-moto-info">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-red-400">In vetrina</p>
              <h2 className="mt-1 font-display text-2xl font-black uppercase leading-none">{nomeMoto(selezionata)}</h2>
              <p className="mt-1 font-mono text-[10px] uppercase text-cemento/40">
                {selezionata.anno ?? 'Anno n/d'} · Avatar del {dataMoto(selezionata.created_at)}
              </p>
              {moto.length > 1 && (
                <div className="garage-pub-moto-pills">
                  {moto.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelezionataId(item.id)}
                      className={`garage-pub-pill tap ${item.id === selezionata.id ? 'garage-pub-pill-active' : ''}`}
                    >
                      {nomeMoto(item)}
                    </button>
                  ))}
                </div>
              )}
            </section>
          )}
        </>
      )}

      <footer className="garage-pub-cta">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cemento/40">Link in bio · si aggiorna ad ogni giro</p>
        <h2 className="mt-2 font-display text-2xl font-black uppercase leading-tight text-white">
          Crea il tuo garage 3D
        </h2>
        <p className="mt-2 text-sm text-cemento/55">
          Km, badge e ultimo giro compaiono qui in automatico. Gratis — metti il link in Instagram o TikTok.
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Link href="/accedi" className="tap btn-primary text-center sm:flex-1">
            Inizia gratis
          </Link>
          <Link href="/" className="tap editor-card-btn-secondary text-center sm:flex-1">
            Scopri MotoGarage
          </Link>
        </div>
        <p className="mt-4 font-mono text-[9px] uppercase tracking-wide text-cemento/30">{link}</p>
      </footer>
    </main>
  );
}
