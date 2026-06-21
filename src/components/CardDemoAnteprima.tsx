'use client';

import Image from 'next/image';

interface Props {
  className?: string;
  luogo?: string;
  km?: string;
  durata?: string;
  curve?: string;
  data?: string;
}

/** Anteprima statica allineata al layout card reale: logo alto-sx, tracciato 2D, stats in basso. */
export default function CardDemoAnteprima({
  className = '',
  luogo = 'Passo dello Stelvio',
  km = '87',
  durata = '2h 14m',
  curve = '42',
  data = '13 giugno 2026',
}: Props) {
  return (
    <div className={`mx-auto max-w-[320px] ${className}`}>
      <div className="rounded-[24px] border border-asfalto/15 bg-asfalto p-3 shadow-app-lg dark:border-white/10">
        <div className="flex items-center gap-2 px-2 py-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-white">
            MG
          </div>
          <span className="font-mono text-xs font-bold text-cemento">motogarage</span>
        </div>

        <div className="relative aspect-[4/5] overflow-hidden rounded-[16px] bg-[#15181a]">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: 'url(/og-motogarage.png)' }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, rgba(14,16,18,0.55) 0%, rgba(14,16,18,0.18) 40%, rgba(14,16,18,0.45) 70%, rgba(14,16,18,0.92) 100%)',
            }}
          />

          {/* Logo alto-sinistra */}
          <div className="absolute left-3 top-3 flex items-center gap-2 drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
            <Image
              src="/logo-motogarage.png"
              alt=""
              width={28}
              height={28}
              className="h-7 w-auto object-contain"
            />
            <span className="font-display text-[10px] font-bold uppercase tracking-wide text-[#f0f1f2]">
              Moto Garage
            </span>
          </div>

          {/* Tracciato 2D — percorso intero nell'area centrale */}
          <svg viewBox="0 0 400 500" className="absolute inset-0 h-full w-full" aria-hidden="true">
            <defs>
              <filter id="route-shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="1" stdDeviation="3" floodColor="#000" floodOpacity="0.45" />
              </filter>
            </defs>
            <path
              d="M 72 340 C 95 280 120 300 145 255 S 195 210 230 195 S 290 150 320 118"
              fill="none"
              stroke="rgba(0,0,0,0.4)"
              strokeWidth="14"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M 72 340 C 95 280 120 300 145 255 S 195 210 230 195 S 290 150 320 118"
              fill="none"
              stroke="#f2b705"
              strokeWidth="10"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#route-shadow)"
            />
            <path
              d="M 72 340 C 95 280 120 300 145 255 S 195 210 230 195 S 290 150 320 118"
              fill="none"
              stroke="rgba(255,255,255,0.28)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="72" cy="340" r="6" fill="#22c55e" stroke="#f0f1f2" strokeWidth="2" />
            <circle cx="320" cy="118" r="6" fill="#f2b705" />
          </svg>

          {/* Stats in basso — layout "In basso" */}
          <div className="absolute inset-x-0 bottom-0 px-4 pb-4 pt-16">
            <p className="font-display text-lg font-black uppercase leading-tight tracking-tight text-[#f0f1f2] drop-shadow-md sm:text-xl">
              {luogo}
            </p>

            <div className="my-3 h-px bg-[#f0f1f2]/15" />

            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <div>
                <p className="font-mono text-[8px] font-medium uppercase tracking-wide text-[#f0f1f2]/55">
                  Distanza
                </p>
                <p className="font-display text-2xl font-bold text-[#f0f1f2]">{km} km</p>
              </div>
              <div>
                <p className="font-mono text-[8px] font-medium uppercase tracking-wide text-[#f0f1f2]/55">
                  Durata
                </p>
                <p className="font-display text-2xl font-bold text-[#f0f1f2]">{durata}</p>
              </div>
              <div>
                <p className="font-mono text-[8px] font-medium uppercase tracking-wide text-[#f0f1f2]/55">
                  Curve
                </p>
                <p className="font-display text-xl font-bold text-[#f2b705]">{curve}</p>
              </div>
              <div>
                <p className="font-mono text-[8px] font-medium uppercase tracking-wide text-[#f0f1f2]/55">
                  Media
                </p>
                <p className="font-display text-xl font-bold text-[#f0f1f2]">68 km/h</p>
              </div>
            </div>

            <p className="mt-3 font-hand text-sm text-[#f2b705]">{data}</p>

            <div className="mt-3 flex items-center justify-end gap-1.5 opacity-80">
              <Image src="/logo-motogarage.png" alt="" width={18} height={18} className="h-[18px] w-auto" />
              <span className="font-display text-[8px] font-bold uppercase text-[#f0f1f2]">Moto Garage</span>
            </div>
          </div>
        </div>

        <div className="mt-2 flex gap-4 px-2 py-1 font-mono text-[10px] uppercase tracking-wide text-cemento/40">
          <span>Mi piace</span>
          <span>Commenta</span>
          <span>Condividi</span>
        </div>
      </div>
    </div>
  );
}
