'use client';

import Image from 'next/image';
import type { Punto } from '@/lib/geo';
import { cssFiltroFoto, type FiltroFoto } from '@/lib/card-foto-filtri';
import { tracciatoSvgPath } from '@/lib/card-tracciato-svg';

export interface StatCard {
  label: string;
  valore: string;
  accent?: boolean;
}

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
  layout: 'strava' | 'story';
  punti?: Punto[];
  mostraTracciato?: boolean;
  tracciatoGrande?: boolean;
  tracciatoX?: number;
  tracciatoY?: number;
  className?: string;
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
  mostraData = true,
  stats,
  layout,
  punti = [],
  mostraTracciato = false,
  tracciatoGrande = false,
  tracciatoX = 0.5,
  tracciatoY = 0.5,
  className = '',
}: Props) {
  const traccia = mostraTracciato ? tracciatoSvgPath(punti) : null;
  const panX = (fotoOffsetX - 0.5) * 24;
  const panY = (fotoOffsetY - 0.5) * 24;
  const trPanX = (tracciatoX - 0.5) * 28;
  const trPanY = (tracciatoY - 0.5) * 28;

  const filtroCss = cssFiltroFoto(fotoLuminosita, fotoContrasto, fotoSaturazione, filtroFoto);

  return (
    <div className={`relative aspect-[4/5] overflow-hidden bg-[#15181a] ${className}`}>
      {fotoUrl ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={fotoUrl}
          alt=""
          draggable={false}
          className="pointer-events-none absolute left-1/2 top-1/2 max-w-none select-none"
          style={{
            filter: filtroCss,
            minWidth: `${fotoZoom * 100}%`,
            minHeight: `${fotoZoom * 100}%`,
            width: 'auto',
            height: 'auto',
            transform: `translate(calc(-50% + ${panX}%), calc(-50% + ${panY}%))`,
            transition: 'filter 0.15s ease',
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a2228] via-[#15181a] to-[#0e1012]" />
      )}

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(8,9,11,0.55) 0%, rgba(8,9,11,0.05) 38%, rgba(8,9,11,0.15) 62%, rgba(8,9,11,0.88) 100%)',
        }}
      />

      {/* Logo */}
      <div className="absolute left-3 top-3 z-10 flex items-center gap-1.5 drop-shadow-[0_2px_10px_rgba(0,0,0,0.7)]">
        <Image src="/logo-motogarage.png" alt="" width={26} height={26} className="h-6 w-auto object-contain" />
        <span className="font-display text-[9px] font-bold uppercase tracking-wide text-white">Moto Garage</span>
      </div>

      {/* Data — badge top right */}
      {mostraData && data && (
        <div className="absolute right-3 top-3 z-10 rounded-xl border border-segnale/40 bg-black/75 px-2.5 py-1.5 backdrop-blur-sm">
          <p className="font-mono text-[7px] font-bold uppercase tracking-wider text-segnale/90">Giro del</p>
          <p className="font-hand text-sm leading-tight text-segnale">{data}</p>
        </div>
      )}

      {/* Tracciato — grande al centro (solo GPS) o mini stile Strava */}
      {traccia && tracciatoGrande && (
        <div
          className="absolute inset-x-[12%] top-[14%] bottom-[32%] z-10 drop-shadow-[0_4px_20px_rgba(0,0,0,0.45)]"
          style={{ transform: `translate(${(tracciatoX - 0.5) * 40}px, ${(tracciatoY - 0.5) * 40}px)` }}
        >
          <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
            <path d={traccia.d} fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
            <path d={traccia.d} fill="none" stroke="#f2b705" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx={traccia.start[0]} cy={traccia.start[1]} r="4" fill="#22c55e" stroke="#fff" strokeWidth="1.5" />
            <circle cx={traccia.end[0]} cy={traccia.end[1]} r="4" fill="#f2b705" />
          </svg>
        </div>
      )}
      {traccia && !tracciatoGrande && (
        <div
          className="absolute z-10 h-[22%] w-[28%] min-w-[72px] drop-shadow-[0_2px_12px_rgba(0,0,0,0.55)]"
          style={{
            left: `calc(8% + ${trPanX}px)`,
            top: `calc(14% + ${trPanY}px)`,
          }}
        >
          <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
            <path d={traccia.d} fill="none" stroke="rgba(0,0,0,0.45)" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
            <path d={traccia.d} fill="none" stroke="#f2b705" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx={traccia.start[0]} cy={traccia.start[1]} r="3.5" fill="#22c55e" stroke="#fff" strokeWidth="1.2" />
            <circle cx={traccia.end[0]} cy={traccia.end[1]} r="3.5" fill="#f2b705" />
          </svg>
        </div>
      )}

      {/* Stats — Strava: destra / Story: basso */}
      {layout === 'strava' ? (
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

      {/* Luogo in layout Strava */}
      {layout === 'strava' && luogo && (
        <p className="absolute bottom-12 left-4 right-4 z-10 font-display text-base font-black uppercase leading-tight tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
          {luogo}
        </p>
      )}

      {/* Watermark */}
      <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1 opacity-90 drop-shadow-md">
        <Image src="/logo-motogarage.png" alt="" width={16} height={16} className="h-4 w-auto" />
        <span className="font-display text-[7px] font-bold uppercase text-white">Moto Garage</span>
      </div>
    </div>
  );
}
