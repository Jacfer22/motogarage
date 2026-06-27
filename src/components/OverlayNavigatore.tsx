'use client';

import {
  formattaDistanzaNav,
  type PassoNavigazione,
} from '@/lib/navigazione-osrm';
import type { ModalitaNav } from '@/lib/nav-modalita';

interface Props {
  passo: PassoNavigazione;
  distanzaMano: number | null;
  distanzaRimanente: number | null;
  velocitaKmh: number;
  voceAttiva: boolean;
  modalita: ModalitaNav;
  onToggleVoce: () => void;
  onCambiaModalita: (m: ModalitaNav) => void;
  onChiudi: () => void;
  onRicentra: () => void;
  onTerminaGiro?: () => void;
  inGiro: boolean;
  segui: boolean;
}

export default function OverlayNavigatore({
  passo,
  distanzaMano,
  distanzaRimanente,
  velocitaKmh,
  voceAttiva,
  modalita,
  onToggleVoce,
  onCambiaModalita,
  onChiudi,
  onRicentra,
  onTerminaGiro,
  inGiro,
  segui,
}: Props) {
  const arrivato = passo.istruzione === 'Sei arrivato a destinazione';

  return (
    <div className="nav-overlay pointer-events-none absolute inset-0 z-[500] flex flex-col">
      <div className="pointer-events-auto nav-overlay-top nav-overlay-top-sicuro safe-top">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            {!arrivato && distanzaMano !== null && (
              <p className="nav-mappa-distanza font-display font-black leading-none text-brand" aria-live="polite">
                {formattaDistanzaNav(distanzaMano)}
              </p>
            )}
            <p className={`nav-mappa-istruzione font-display font-black uppercase leading-tight tracking-tight text-white ${arrivato ? 'mt-0' : 'mt-2'}`}>
              {passo.istruzione}
            </p>
            {distanzaRimanente !== null && !arrivato && (
              <p className="mt-2 font-mono text-xs uppercase tracking-wide text-cemento/55">
                {formattaDistanzaNav(distanzaRimanente)} alla destinazione
              </p>
            )}
          </div>
          <div className="flex shrink-0 flex-col gap-1.5">
            <button
              type="button"
              onClick={() => onCambiaModalita('testo')}
              className={`tap nav-overlay-btn ${modalita === 'testo' ? 'nav-overlay-btn-attivo' : ''}`}
            >
              Solo scritte
            </button>
            <button
              type="button"
              onClick={onToggleVoce}
              className={`tap nav-overlay-btn ${voceAttiva ? 'nav-overlay-btn-attivo' : ''}`}
              aria-pressed={voceAttiva}
            >
              Voce
            </button>
            <button type="button" onClick={onChiudi} className="tap nav-overlay-btn">
              Chiudi
            </button>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute left-3 bottom-28 z-[501] safe-left">
        <div className="nav-stat-box nav-stat-box-grande rounded-app border border-white/10 bg-black/70 px-4 py-2.5 backdrop-blur-md">
          <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-cemento/45">Velocità</p>
          <p className="font-display text-4xl font-black leading-none text-white">
            {Math.round(velocitaKmh)}
            <span className="ml-1 font-mono text-xs font-bold text-cemento/55">km/h</span>
          </p>
        </div>
      </div>

      <div className="pointer-events-auto mt-auto flex items-end justify-between gap-2 px-3 pb-3 safe-bottom">
        {!segui && (
          <span className="rounded-app bg-black/80 px-3 py-1.5 font-mono text-[10px] font-bold uppercase text-white backdrop-blur">
            Mappa libera
          </span>
        )}
        <div className="ml-auto flex gap-2">
          {inGiro && onTerminaGiro && (
            <button type="button" onClick={onTerminaGiro} className="tap nav-overlay-btn nav-overlay-btn-termina">
              Termina
            </button>
          )}
          <button
            type="button"
            onClick={onRicentra}
            className={`tap flex h-14 w-14 items-center justify-center rounded-full border-2 shadow-lg transition-colors ${
              segui ? 'border-white/30 bg-asfalto/90 text-white' : 'border-brand bg-brand text-white'
            }`}
            aria-label="Ricentra"
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
