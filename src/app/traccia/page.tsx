'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import WizardGiroConcluso from '@/components/WizardGiroConcluso';
import OverlayTracciaGiro from '@/components/OverlayTracciaGiro';
import { useTracciamentoGiro } from '@/hooks/use-tracciamento-giro';

const MappaTraccia = dynamic(() => import('@/components/MappaTraccia'), { ssr: false });

export default function PaginaTraccia() {
  const { user, loading } = useAuth();
  const track = useTracciamentoGiro(user?.id);

  const tracciaAttiva = track.stato === 'in_corso' || track.stato === 'in_pausa';

  useEffect(() => {
    if (tracciaAttiva) {
      document.body.classList.add('nav-fullscreen-active');
    } else {
      document.body.classList.remove('nav-fullscreen-active');
    }
    return () => document.body.classList.remove('nav-fullscreen-active');
  }, [tracciaAttiva]);

  if (loading) {
    return (
      <section className="app-pagina mx-auto max-w-2xl px-4 py-14">
        <p className="font-mono text-sm uppercase text-cemento/40">Caricamento…</p>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-14">
        <p className="font-mono text-sm uppercase tracking-widest text-cartello">MotoGarage</p>
        <h1 className="mt-1 font-display text-5xl font-bold uppercase leading-none tracking-tight">
          Traccia un giro
        </h1>
        <div className="mt-8 border-2 border-asfalto bg-asfalto p-6 text-cemento">
          <p className="text-guardrail">
            Registra il tuo percorso via GPS e genera la card da condividere.
            Serve un account gratuito.
          </p>
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

  if (track.stato === 'concluso' && track.giroConcluso) {
    return (
      <div className="app-pagina px-4 py-4">
        <WizardGiroConcluso
          giroConcluso={track.giroConcluso}
          distanzaM={track.distanzaM}
          durataSec={track.durataSec}
          punti={track.punti}
          luogoCard={track.luogoCard}
          onLuogoCardChange={track.setLuogoCard}
          salvataggioCloud={track.salvataggioCloud}
          loggato={!!user}
          onNomeChange={track.aggiornaNomeGiro}
          onPubblicoChange={track.giroConcluso.cloudId ? track.impostaGiroPubblico : undefined}
          onElimina={track.eliminaGiroConcluso}
          onNuovoGiro={track.nuovoGiro}
          info={track.info}
        />
      </div>
    );
  }

  if (tracciaAttiva) {
    return (
      <div className="nav-fullscreen">
        <MappaTraccia punti={track.punti} inCorso={track.stato === 'in_corso'} fullscreen />
        <OverlayTracciaGiro
          stato={track.stato as 'in_corso' | 'in_pausa'}
          velocitaKmh={track.velCorrenteKmh}
          kmGiro={track.formattaKm(track.distanzaM)}
          durataGiro={track.formattaDurata(track.durataSec)}
          onPausa={track.metiInPausa}
          onRiprendi={track.riprendiPercorso}
          onTermina={() => void track.terminaGiro()}
          onAnnulla={track.annullaPercorso}
        />
      </div>
    );
  }

  return (
    <section className="app-pagina pagina-immersiva mx-auto max-w-2xl px-4 py-4 md:py-10">
      <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-brand">Tracciamento GPS</p>
      <h1 className="mt-1 font-display text-3xl font-black uppercase leading-none tracking-tight text-white md:text-5xl">
        Traccia un giro
      </h1>
      <p className="mt-3 text-sm text-cemento/55">
        Registra il percorso reale. Alla fine, wizard card e condivisione.
        Con destinazione? <Link href="/naviga" className="text-brand underline">Navigatore full-screen</Link>.
      </p>

      {track.info && (
        <p className="mt-4 rounded-app border border-cartello/30 bg-cartello/10 p-3 text-sm text-cemento/85">
          {track.info}
        </p>
      )}
      {track.errore && (
        <p className="mt-4 rounded-app border border-red-500/30 bg-red-950/50 p-3 text-sm text-red-300">{track.errore}</p>
      )}

      {track.stato === 'pronto' && (
        <div className="mt-6">
          <Link
            href="/naviga"
            className="flex items-center justify-between gap-3 rounded-app-lg border-2 border-brand/30 bg-asfalto px-4 py-3 text-white transition-colors hover:border-brand/50"
          >
            <span>
              <span className="block font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-brand">
                Navigatore GPS
              </span>
              <span className="mt-0.5 block text-sm text-cemento/75">
                Destinazione + tracciamento automatico del giro
              </span>
            </span>
            <span className="font-mono text-xs font-bold uppercase text-brand">Apri →</span>
          </Link>
        </div>
      )}

      {track.punti.length > 0 && (
        <div className="mt-6">
          <p className="mb-2 font-mono text-[11px] uppercase tracking-wide text-cemento/55">
            Tracciato GPS in tempo reale
          </p>
          <MappaTraccia punti={track.punti} inCorso={false} />
        </div>
      )}

      {track.stato === 'pronto' && (
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => track.iniziaPercorso()}
            className="tap min-h-[48px] bg-brand px-6 py-3 font-mono font-medium uppercase text-white hover:bg-brand/90"
          >
            Inizia percorso
          </button>
        </div>
      )}

      {track.stato === 'pronto' && (
        <div className="mt-10 rounded-app-lg border border-white/10 bg-white/[0.03] p-5">
          <h2 className="font-display text-xl font-bold uppercase tracking-tight text-white">I miei giri salvati</h2>
          <p className="mt-2 text-sm text-cemento/55">
            Tutti i percorsi GPS sono nel cloud. Crea la card quando vuoi da qualsiasi telefono.
          </p>
          <Link
            href="/giri"
            className="tap mt-4 inline-block rounded-app bg-brand px-5 py-3 font-mono text-xs font-bold uppercase text-white hover:bg-brand/90"
          >
            Apri I miei giri
          </Link>
        </div>
      )}

      <p className="mt-10 flex flex-wrap gap-4">
        <Link href="/giri" className="font-mono text-sm uppercase text-cemento/50 underline hover:text-brand">
          I miei giri
        </Link>
        <Link href="/hub" className="font-mono text-sm uppercase text-cemento/50 underline hover:text-brand">
          ← Hub
        </Link>
      </p>
    </section>
  );
}
