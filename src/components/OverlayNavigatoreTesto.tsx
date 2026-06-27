'use client';

import {
  distanzaNavGrande,
  formattaDistanzaNav,
  manovraBreve,
  type PassoNavigazione,
} from '@/lib/navigazione-osrm';
import type { ModalitaNav } from '@/lib/nav-modalita';

interface Props {
  passo: PassoNavigazione;
  distanzaMano: number | null;
  distanzaRimanente: number | null;
  voceAttiva: boolean;
  modalita: ModalitaNav;
  onToggleVoce: () => void;
  onCambiaModalita: (m: ModalitaNav) => void;
  onChiudi: () => void;
  onTerminaGiro?: () => void;
  inGiro: boolean;
}

export default function OverlayNavigatoreTesto({
  passo,
  distanzaMano,
  distanzaRimanente,
  voceAttiva,
  modalita,
  onToggleVoce,
  onCambiaModalita,
  onChiudi,
  onTerminaGiro,
  inGiro,
}: Props) {
  const arrivato = passo.istruzione === 'Sei arrivato a destinazione';
  const manovra = manovraBreve(passo);
  const via = passo.nomeVia?.trim() || null;

  return (
    <div className="nav-testo-overlay pointer-events-none absolute inset-0 z-[500] flex flex-col bg-black">
      <div className="pointer-events-auto nav-testo-bar safe-top flex items-center justify-between gap-2 px-3 pt-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-brand/80">Solo scritte · sicurezza</p>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => onCambiaModalita('mappa')}
            className={`tap nav-overlay-btn ${modalita === 'mappa' ? 'nav-overlay-btn-attivo' : ''}`}
          >
            Mappa
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

      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        {!arrivato && distanzaMano !== null && (
          <p className="nav-testo-distanza font-display font-black leading-none text-brand" aria-live="polite">
            {distanzaNavGrande(distanzaMano)}
          </p>
        )}
        <p className={`nav-testo-manovra mt-4 font-display font-black uppercase leading-tight tracking-tight text-white ${arrivato ? 'nav-testo-arrivo' : ''}`}>
          {manovra}
        </p>
        {via && !arrivato && (
          <p className="nav-testo-via mt-3 font-display font-bold uppercase leading-snug tracking-tight text-cemento/75">
            {via}
          </p>
        )}
        {distanzaRimanente !== null && !arrivato && (
          <p className="mt-8 font-mono text-sm uppercase tracking-wide text-cemento/40">
            {formattaDistanzaNav(distanzaRimanente)} alla destinazione
          </p>
        )}
      </div>

      <div className="pointer-events-auto flex items-center justify-center gap-2 px-3 pb-4 safe-bottom">
        {inGiro && onTerminaGiro && (
          <button type="button" onClick={onTerminaGiro} className="tap nav-overlay-btn nav-overlay-btn-termina">
            Termina giro
          </button>
        )}
      </div>
    </div>
  );
}
