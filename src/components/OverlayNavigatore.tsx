'use client';

import { formattaDistanzaNav } from '@/lib/navigazione-osrm';
import type { PassoNavigazione } from '@/lib/navigazione-osrm';

interface Props {
  passo: PassoNavigazione;
  distanzaMano: number | null;
  distanzaRimanente: number | null;
  velocitaKmh: number;
  kmGiro: string;
  durataGiro: string;
  voceAttiva: boolean;
  onToggleVoce: () => void;
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
  kmGiro,
  durataGiro,
  voceAttiva,
  onToggleVoce,
  onChiudi,
  onRicentra,
  onTerminaGiro,
  inGiro,
  segui,
}: Props) {
  const arrivato = passo.istruzione === 'Sei arrivato a destinazione';

  return (
    <div className="nav-overlay pointer-events-none absolute inset-0 z-[500] flex flex-col">
      {/* Manovra in alto */}
      <div className="pointer-events-auto nav-overlay-top safe-top">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-brand/90">Prossima manovra</p>
            <p className="mt-1 font-display text-xl font-black uppercase leading-tight tracking-tight text-white sm:text-2xl">
              {passo.istruzione}
            </p>
            {!arrivato && distanzaMano !== null && (
              <p className="mt-1 font-display text-4xl font-black leading-none text-brand">
                {formattaDistanzaNav(distanzaMano)}
              </p>
            )}
            {distanzaRimanente !== null && !arrivato && (
              <p className="mt-1 font-mono text-[10px] uppercase tracking-wide text-cemento/50">
                {formattaDistanzaNav(distanzaRimanente)} alla destinazione
              </p>
            )}
          </div>
          <div className="flex shrink-0 flex-col gap-1.5">
            <button
              type="button"
              onClick={onToggleVoce}
              className={`tap nav-overlay-btn ${voceAttiva ? 'nav-overlay-btn-attivo' : ''}`}
              aria-pressed={voceAttiva}
            >
              Voce {voceAttiva ? 'on' : 'off'}
            </button>
            <button type="button" onClick={onChiudi} className="tap nav-overlay-btn">
              Chiudi
            </button>
          </div>
        </div>
      </div>

      {/* Stats a sinistra */}
      <div className="pointer-events-none absolute left-3 top-1/2 z-[501] flex -translate-y-1/2 flex-col gap-2 safe-left">
        <StatBox label="Velocità" valore={String(Math.round(velocitaKmh))} unita="km/h" grande />
        {inGiro && (
          <>
            <StatBox label="Giro" valore={kmGiro} unita="km" />
            <StatBox label="Tempo" valore={durataGiro} unita="" />
          </>
        )}
      </div>

      {/* Controlli basso */}
      <div className="pointer-events-auto mt-auto flex items-end justify-between gap-2 px-3 pb-3 safe-bottom">
        {!segui && (
          <span className="rounded-app bg-black/75 px-2 py-1 font-mono text-[9px] font-bold uppercase text-white backdrop-blur">
            Mappa libera
          </span>
        )}
        <div className="ml-auto flex gap-2">
          {inGiro && onTerminaGiro && (
            <button type="button" onClick={onTerminaGiro} className="tap nav-overlay-btn nav-overlay-btn-termina">
              Termina giro
            </button>
          )}
          <button
            type="button"
            onClick={onRicentra}
            className={`tap flex h-12 w-12 items-center justify-center rounded-full border-2 shadow-lg transition-colors ${
              segui ? 'border-white/30 bg-asfalto/90 text-white' : 'border-brand bg-brand text-white'
            }`}
            aria-label="Ricentra"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function StatBox({
  label,
  valore,
  unita,
  grande,
}: {
  label: string;
  valore: string;
  unita: string;
  grande?: boolean;
}) {
  return (
    <div className="nav-stat-box rounded-app border border-white/10 bg-black/55 px-3 py-2 backdrop-blur-md">
      <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-cemento/45">{label}</p>
      <p className={`font-display font-black leading-none text-white ${grande ? 'text-3xl' : 'text-xl'}`}>
        {valore}
        {unita && <span className="ml-0.5 font-mono text-[9px] font-bold text-cemento/55">{unita}</span>}
      </p>
    </div>
  );
}
