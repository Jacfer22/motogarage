'use client';

import Image from 'next/image';
import type { Punto } from '@/lib/geo';
import { cssFiltroFoto, type FiltroFoto } from '@/lib/card-foto-filtri';
import {
  LAYOUT_GRANDE,
  LAYOUT_MINI_FOTO,
  panTracciatoFrac,
} from '@/lib/card-tracciato-layout';
import { tracciatoSvgPath } from '@/lib/card-tracciato-svg';

export interface StatCard {
  label: string;
  valore: string;
  accent?: boolean;
}

export type LayoutCard = 'laterale' | 'basso';
export type SelezioneCard = 'foto' | 'percorso';

interface Props {
  fotoUrl?: string | null;
  fotoZoom?: number;
  fotoOffsetX?: number;
  fotoOffsetY?: number;
  fotoLuminosita?: number;
  fotoContrasto?: number;
  fotoSaturazione?: number;
  filtroFoto?: FiltroFoto;
  luogo: string;
  data?: string;
  mostraData?: boolean;
  stats: StatCard[];
  layout: LayoutCard;
  punti?: Punto[];
  tracciatoGrande?: boolean;
  tracciatoX?: number;
  tracciatoY?: number;
  tracciatoZoom?: number;
  fotoRotazione?: number;
  tracciatoRotazione?: number;
  selezione?: SelezioneCard | null;
  className?: string;
}

function TracciaSvg({
  traccia,
  snello = true,
}: {
  traccia: { d: string; start: [number, number]; end: [number, number] };
  snello?: boolean;
}) {
  const ombra = snello ? 4.5 : 8;
  const linea = snello ? 2.8 : 5.5;
  const r = snello ? 2.2 : 3.5;
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
      <path d={traccia.d} fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth={ombra} strokeLinecap="round" strokeLinejoin="round" />
      <path d={traccia.d} fill="none" stroke="#f2b705" strokeWidth={linea} strokeLinecap="round" strokeLinejoin="round" />
      <path d={traccia.d} fill="none" stroke="rgba(255,255,255,0.32)" strokeWidth={Math.max(0.8, linea * 0.28)} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={traccia.start[0]} cy={traccia.start[1]} r={r} fill="#22c55e" stroke="#fff" strokeWidth="0.9" />
      <circle cx={traccia.end[0]} cy={traccia.end[1]} r={r} fill="#f2b705" />
    </svg>
  );
}

export default function AnteprimaCardLive({
  fotoUrl,
  fotoZoom = 1,
  fotoOffsetX = 0.5,
  fotoOffsetY = 0.5,
  fotoLuminosita = 1,
  fotoContrasto = 1,
  fotoSaturazione = 1,
  filtroFoto = 'none',
  luogo,
  data,
  mostraData = false,
  stats,
  layout,
  punti = [],
  tracciatoGrande = false,
  tracciatoX = 0.35,
  tracciatoY = 0.22,
  tracciatoZoom = 1,
  fotoRotazione = 0,
  tracciatoRotazione = 0,
  selezione = null,
  className = '',
}: Props) {
  const traccia = punti.length >= 2 ? tracciatoSvgPath(punti) : null;
  const panMiniX = panTracciatoFrac(tracciatoX, LAYOUT_MINI_FOTO.panSensPx);
  const panMiniY = panTracciatoFrac(tracciatoY, LAYOUT_MINI_FOTO.panSensPx);
  const panGrandeX = panTracciatoFrac(tracciatoX, LAYOUT_GRANDE.panSensPx);
  const panGrandeY = panTracciatoFrac(tracciatoY, LAYOUT_GRANDE.panSensPx);
  const filtroCss = cssFiltroFoto(fotoLuminosita, fotoContrasto, fotoSaturazione, filtroFoto);
  const panFotoX = (fotoOffsetX - 0.5) * 100;
  const panFotoY = (fotoOffsetY - 0.5) * 100;

  return (
    <div className={`relative aspect-[9/16] overflow-hidden bg-asfalto ${className}`}>
      {fotoUrl ? (
        <div
          className={`absolute inset-0 overflow-hidden ${selezione === 'foto' ? 'ring-2 ring-inset ring-brand/70' : ''}`}
        >
          <div
            className="absolute inset-0 h-full w-full"
            style={{
              transform: `translate(${panFotoX}%, ${panFotoY}%) scale(${fotoZoom}) rotate(${fotoRotazione}deg)`,
              transformOrigin: 'center center',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={fotoUrl}
              alt=""
              draggable={false}
              className="pointer-events-none h-full w-full select-none object-cover"
              style={{ filter: filtroCss, transition: 'filter 0.15s ease' }}
            />
          </div>
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-b from-notte-calda via-asfalto to-notte" />
      )}

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(8,9,11,0.55) 0%, rgba(8,9,11,0.05) 38%, rgba(8,9,11,0.15) 62%, rgba(8,9,11,0.88) 100%)',
        }}
      />

      <div className="absolute left-3 top-3 z-10 flex items-center gap-1.5 drop-shadow-[0_2px_10px_rgba(0,0,0,0.7)]">
        <Image src="/logo-motogarage.png" alt="" width={26} height={26} className="h-6 w-auto object-contain" />
        <span className="font-display text-[9px] font-bold uppercase tracking-wide text-white">Moto Garage</span>
      </div>

      {traccia && tracciatoGrande && (
        <div
          className={`absolute z-10 drop-shadow-[0_4px_16px_rgba(0,0,0,0.4)] ${selezione === 'percorso' ? 'rounded-lg ring-2 ring-brand/80' : ''}`}
          style={{
            left: `${(LAYOUT_GRANDE.leftPct + panGrandeX) * 100}%`,
            top: `${(LAYOUT_GRANDE.topPct + panGrandeY) * 100}%`,
            width: `${LAYOUT_GRANDE.widthPct * 100}%`,
            height: `${LAYOUT_GRANDE.heightPct * 100}%`,
            transform: `scale(${tracciatoZoom}) rotate(${tracciatoRotazione}deg)`,
            transformOrigin: 'center center',
          }}
        >
          <TracciaSvg traccia={traccia} snello={false} />
        </div>
      )}

      {traccia && !tracciatoGrande && (
        <div
          className={`absolute z-10 min-w-[68px] drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)] ${selezione === 'percorso' ? 'rounded-md ring-2 ring-brand/80' : ''}`}
          style={{
            left: `${(LAYOUT_MINI_FOTO.leftPct + panMiniX) * 100}%`,
            top: `${(LAYOUT_MINI_FOTO.topPct + panMiniY) * 100}%`,
            width: `${LAYOUT_MINI_FOTO.widthPct * 100}%`,
            height: `${LAYOUT_MINI_FOTO.heightPct * 100}%`,
            transform: `scale(${tracciatoZoom}) rotate(${tracciatoRotazione}deg)`,
            transformOrigin: 'center center',
          }}
        >
          <TracciaSvg traccia={traccia} snello />
        </div>
      )}

      {layout === 'laterale' ? (
        <div className="absolute right-3 top-[18%] z-10 max-w-[48%] space-y-3 text-right drop-shadow-[0_2px_10px_rgba(0,0,0,0.75)]">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="font-mono text-[8px] font-medium uppercase tracking-wide text-white/55">{s.label}</p>
              <p className={`font-display text-2xl font-bold leading-none ${s.accent ? 'text-segnale' : 'text-white'}`}>
                {s.valore}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="absolute inset-x-0 bottom-0 z-10 px-4 pb-3 pt-10">
          {mostraData && data && layout === 'basso' && (
            <p className="mb-1 font-hand text-xs text-white/45 drop-shadow-sm">{data}</p>
          )}
          <p className="font-display text-lg font-black uppercase leading-tight tracking-tight text-white drop-shadow-md">
            {luogo}
          </p>
          <div className="my-2.5 h-px bg-white/15" />
          <div className="grid grid-cols-2 gap-x-3 gap-y-2">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="font-mono text-[7px] font-medium uppercase tracking-wide text-white/50">{s.label}</p>
                <p className={`font-display text-xl font-bold leading-none ${s.accent ? 'text-segnale' : 'text-white'}`}>
                  {s.valore}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {layout === 'laterale' && mostraData && data && (
        <p className="absolute bottom-[4.25rem] left-4 z-10 font-hand text-xs text-white/45 drop-shadow-sm">{data}</p>
      )}

      {layout === 'laterale' && luogo && (
        <p className="absolute bottom-12 left-4 right-4 z-10 font-display text-base font-black uppercase leading-tight tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
          {luogo}
        </p>
      )}

      <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1 opacity-90 drop-shadow-md">
        <Image src="/logo-motogarage.png" alt="" width={16} height={16} className="h-4 w-auto" />
        <span className="font-display text-[7px] font-bold uppercase text-white">Moto Garage</span>
      </div>
    </div>
  );
}
