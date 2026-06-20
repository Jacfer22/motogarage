'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useAuth } from '@/components/AuthProvider';
import RiepilogoGiroConcluso from '@/components/RiepilogoGiroConcluso';
import { useTracciamentoGiro } from '@/hooks/use-tracciamento-giro';

const MappaTraccia = dynamic(() => import('@/components/MappaTraccia'), { ssr: false });

export default function PaginaTraccia() {
  const { user, loading } = useAuth();
  const track = useTracciamentoGiro(user?.id);

  if (loading) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-14">
        <p className="font-mono text-sm uppercase text-asfalto/40">Caricamento…</p>
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

  return (
    <section className="mx-auto max-w-2xl px-4 py-14">
      <p className="font-mono text-sm uppercase tracking-widest text-cartello">MotoGarage</p>
      <h1 className="mt-1 font-display text-5xl font-bold uppercase leading-none tracking-tight">
        Traccia un giro
      </h1>
      <p className="mt-3 text-asfalto/70">
        Premi Inizia e registra il percorso reale via GPS. Alla fine, card e statistiche.
        Vuoi anche indicazioni stradali? Usa il <Link href="/naviga" className="text-brand underline">Navigatore</Link>
        {' '}— il giro parte in automatico.
      </p>

      {track.info && (
        <p className="mt-4 rounded-app border border-cartello/30 bg-cartello/10 p-3 text-sm text-asfalto/80">
          {track.info}
        </p>
      )}
      {track.errore && (
        <p className="mt-4 border-2 border-red-700 bg-red-50 p-3 text-sm text-red-900">{track.errore}</p>
      )}

      {track.stato !== 'concluso' && (
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

      {track.stato !== 'pronto' && track.stato !== 'concluso' && (
        <div className="mt-6 grid grid-cols-3 gap-3">
          <div className="card-app p-4 text-center">
            <p className="font-mono text-[11px] uppercase tracking-wide text-asfalto/50">Distanza</p>
            <p className="mt-1 font-display text-3xl font-bold leading-none">{track.formattaKm(track.distanzaM)}</p>
            <p className="font-mono text-[10px] uppercase text-asfalto/40">km</p>
          </div>
          <div className="card-app p-4 text-center">
            <p className="font-mono text-[11px] uppercase tracking-wide text-asfalto/50">Tempo</p>
            <p className="mt-1 font-display text-3xl font-bold leading-none">{track.formattaDurata(track.durataSec)}</p>
          </div>
          <div className="card-app p-4 text-center">
            <p className="font-mono text-[11px] uppercase tracking-wide text-asfalto/50">Velocità</p>
            <p className="mt-1 font-display text-3xl font-bold leading-none text-segnale-scuro">
              {track.stato === 'in_corso' ? track.velCorrenteKmh : 0}
            </p>
            <p className="font-mono text-[10px] uppercase text-asfalto/40">km/h</p>
          </div>
          <div className="col-span-3 text-center">
            <p className="font-mono text-xs uppercase tracking-wide">
              {track.stato === 'in_corso' && <span className="text-bosco">● In corso</span>}
              {track.stato === 'in_pausa' && <span className="text-cartello">‖ In pausa</span>}
            </p>
          </div>
        </div>
      )}

      {track.punti.length > 0 && track.stato !== 'concluso' && (
        <div className="mt-6">
          <p className="mb-2 font-mono text-[11px] uppercase tracking-wide text-asfalto/55">
            Tracciato GPS in tempo reale
          </p>
          <MappaTraccia punti={track.punti} inCorso={track.stato === 'in_corso'} />
        </div>
      )}

      {track.stato !== 'concluso' && (
        <div className="mt-6 flex flex-wrap gap-3">
          {track.stato === 'pronto' && (
            <button
              type="button"
              onClick={() => track.iniziaPercorso()}
              className="bg-segnale px-6 py-3 font-mono font-medium uppercase text-asfalto hover:bg-white"
            >
              Inizia percorso
            </button>
          )}
          {track.stato === 'in_corso' && (
            <>
              <button
                type="button"
                onClick={track.metiInPausa}
                className="border-2 border-asfalto px-6 py-3 font-mono font-medium uppercase hover:bg-asfalto hover:text-cemento"
              >
                Pausa
              </button>
              <button
                type="button"
                onClick={() => void track.terminaGiro()}
                className="bg-asfalto px-6 py-3 font-mono font-medium uppercase text-cemento hover:bg-cartello"
              >
                Termina giro
              </button>
              <button
                type="button"
                onClick={track.annullaPercorso}
                className="border-2 border-red-600/40 px-6 py-3 font-mono text-xs font-medium uppercase text-red-700 hover:bg-red-50"
              >
                Annulla
              </button>
            </>
          )}
          {track.stato === 'in_pausa' && (
            <>
              <button
                type="button"
                onClick={track.riprendiPercorso}
                className="bg-segnale px-6 py-3 font-mono font-medium uppercase text-asfalto hover:bg-white"
              >
                Riprendi
              </button>
              <button
                type="button"
                onClick={() => void track.terminaGiro()}
                className="bg-asfalto px-6 py-3 font-mono font-medium uppercase text-cemento hover:bg-cartello"
              >
                Termina giro
              </button>
              <button
                type="button"
                onClick={track.annullaPercorso}
                className="border-2 border-red-600/40 px-6 py-3 font-mono text-xs font-medium uppercase text-red-700 hover:bg-red-50"
              >
                Annulla
              </button>
            </>
          )}
        </div>
      )}

      {track.stato === 'concluso' && track.giroConcluso && (
        <RiepilogoGiroConcluso
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
      )}

      {track.stato === 'pronto' && (
        <div className="mt-10 rounded-app-lg border border-asfalto/10 bg-asfalto/[0.03] p-5">
          <h2 className="font-display text-xl font-bold uppercase tracking-tight">I miei giri salvati</h2>
          <p className="mt-2 text-sm text-asfalto/60">
            Tutti i percorsi GPS sono nel cloud. Crea la card quando vuoi da qualsiasi telefono.
          </p>
          <Link
            href="/giri"
            className="tap mt-4 inline-block rounded-app bg-asfalto px-5 py-3 font-mono text-xs font-bold uppercase text-cemento hover:bg-brand hover:text-white"
          >
            Apri I miei giri
          </Link>
        </div>
      )}

      <p className="mt-10 flex flex-wrap gap-4">
        <Link href="/giri" className="font-mono text-sm uppercase text-asfalto/60 underline hover:text-asfalto">
          I miei giri
        </Link>
        <Link href="/hub" className="font-mono text-sm uppercase text-asfalto/60 underline hover:text-asfalto">
          ← Hub
        </Link>
      </p>
    </section>
  );
}
