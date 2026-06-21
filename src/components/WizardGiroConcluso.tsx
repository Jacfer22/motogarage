'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formattaDurata, formattaKm, statisticheGiro } from '@/lib/geo';
import type { GiroUtente } from '@/lib/giri-store';
import EditorCardGiro from '@/components/EditorCardGiro';
import { usePwaInstall } from '@/hooks/use-pwa-install';

interface Props {
  giroConcluso: GiroUtente;
  distanzaM: number;
  durataSec: number;
  punti: { lat: number; lng: number }[];
  luogoCard: string;
  onLuogoCardChange: (v: string) => void;
  salvataggioCloud: boolean;
  loggato: boolean;
  onNomeChange: (nome: string) => void;
  onPubblicoChange?: (pubblico: boolean) => void;
  onElimina: () => void;
  onNuovoGiro: () => void;
  info?: string | null;
}

type Step = 'stats' | 'card' | 'fine';

export default function WizardGiroConcluso(props: Props) {
  const [step, setStep] = useState<Step>('stats');
  const { disponibile: pwaDisponibile, installata: pwaInstallata, installa: installaPwa } = usePwaInstall();
  const stat = statisticheGiro(props.punti, props.durataSec, props.distanzaM);

  return (
    <div className="wizard-giro animate-fade-in">
      <div className="mb-6 flex gap-2">
        {(['stats', 'card', 'fine'] as Step[]).map((s, i) => (
          <span
            key={s}
            className={`h-1 flex-1 rounded-full ${step === s || (['stats', 'card', 'fine'].indexOf(step) > i) ? 'bg-brand' : 'bg-white/10'}`}
          />
        ))}
      </div>

      {step === 'stats' && (
        <section className="text-center text-cemento">
          {props.info && (
            <p className="mb-4 rounded-app border border-cartello/30 bg-cartello/10 px-3 py-2 text-sm text-cemento/85">
              {props.info}
            </p>
          )}
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-brand">Giro concluso</p>
          <h2 className="mt-2 font-display text-4xl font-black uppercase leading-none tracking-tight text-white sm:text-5xl">
            {formattaKm(props.distanzaM)} km
          </h2>
          <p className="mt-2 font-mono text-sm uppercase tracking-wide text-cemento/50">
            {formattaDurata(props.durataSec)} in sella
          </p>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { l: 'Vel. media', v: `${stat.velMediaKmh}`, u: 'km/h' },
              { l: 'Curve', v: `${stat.curve}`, u: '' },
              { l: 'Dislivello', v: `${stat.dislivelloPositivoM}`, u: 'm' },
              { l: 'Vel. max', v: `${stat.velMaxKmh}`, u: 'km/h' },
            ].map((x) => (
              <div key={x.l} className="rounded-app border border-white/10 bg-white/[0.04] p-3">
                <p className="font-mono text-[9px] uppercase text-cemento/45">{x.l}</p>
                <p className="mt-1 font-display text-2xl font-black text-white">{x.v}</p>
                {x.u && <p className="font-mono text-[9px] uppercase text-cemento/40">{x.u}</p>}
              </div>
            ))}
          </div>

          <p className="mt-6 font-mono text-[10px] uppercase tracking-wide text-cemento/40">
            {props.salvataggioCloud
              ? 'Salvataggio nel cloud…'
              : props.giroConcluso.cloudId
                ? 'Salvato nel cloud'
                : props.loggato
                  ? 'Salvato in locale'
                  : 'Accedi per il cloud'}
          </p>

          <button type="button" onClick={() => setStep('card')} className="tap btn-primary mt-8 w-full sm:w-auto sm:px-12">
            Crea la card
          </button>
        </section>
      )}

      {step === 'card' && (
        <section>
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-brand">Step 2 · Card social</p>
          <div className="mt-2">
            <label className="editor-card-label" htmlFor="nome-wizard">Nome giro</label>
            <input
              id="nome-wizard"
              type="text"
              value={props.luogoCard}
              onChange={(e) => props.onLuogoCardChange(e.target.value)}
              placeholder="Es. Passo dello Stelvio"
              maxLength={40}
              className="editor-card-input mt-2"
            />
          </div>
          <div className="mt-4">
            <EditorCardGiro
              giro={props.giroConcluso}
              onNomeChange={props.onNomeChange}
              onPubblicoChange={props.onPubblicoChange}
            />
          </div>
          <button type="button" onClick={() => setStep('fine')} className="tap btn-primary mt-6 w-full">
            Continua
          </button>
        </section>
      )}

      {step === 'fine' && (
        <section className="text-center text-cemento">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-brand">Fatto</p>
          <h2 className="mt-2 font-display text-3xl font-black uppercase tracking-tight text-white">
            Pronto da condividere
          </h2>
          <p className="mt-3 text-sm text-cemento/55">
            La card è pronta. Condividila su Instagram o salvala in I miei giri.
          </p>
          {pwaDisponibile && !pwaInstallata && (
            <div className="mt-6 rounded-app border border-brand/30 bg-brand/10 p-4">
              <p className="font-mono text-[10px] font-bold uppercase tracking-wide text-brand">App sul telefono</p>
              <p className="mt-2 text-sm text-cemento/70">
                Installa MotoGarage sulla Home per GPS e navigatore come un&apos;app nativa.
              </p>
              <button type="button" onClick={() => void installaPwa()} className="tap btn-primary mt-4 w-full sm:w-auto sm:px-10">
                Installa app
              </button>
            </div>
          )}
          {pwaInstallata && (
            <p className="mt-6 font-mono text-[10px] uppercase tracking-wide text-cemento/40">
              MotoGarage è già installato sul tuo dispositivo
            </p>
          )}
          <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link href="/giri" className="tap btn-primary text-center">
              I miei giri
            </Link>
            <Link href="/hub" className="tap editor-card-btn-secondary text-center">
              Torna all&apos;hub
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button type="button" onClick={props.onNuovoGiro} className="font-mono text-[10px] uppercase text-cemento/50 underline">
              Nuovo giro
            </button>
            <button type="button" onClick={props.onElimina} className="font-mono text-[10px] uppercase text-red-400/80 underline">
              Elimina giro
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
