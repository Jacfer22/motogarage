'use client';

interface Props {
  className?: string;
  luogo?: string;
  km?: string;
  durata?: string;
  curve?: string;
}

export default function CardDemoAnteprima({
  className = '',
  luogo = 'Passo dello Stelvio',
  km = '87',
  durata = '2h 14m',
  curve = '42',
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

        <div className="relative aspect-[4/5] overflow-hidden rounded-[16px] bg-[#0a0b0e]">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-40"
            style={{ backgroundImage: 'url(/og-motogarage.png)' }}
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(209,25,25,0.35),transparent_50%),linear-gradient(180deg,rgba(8,9,11,0.2),rgba(8,9,11,0.95))]" />
          <svg viewBox="0 0 400 500" className="absolute inset-0 h-full w-full" aria-hidden="true">
            <path
              d="M 40 400 Q 80 320 140 340 T 220 280 T 320 200 T 360 160"
              fill="none"
              stroke="#facc15"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="40" cy="400" r="6" fill="#22c55e" />
            <circle cx="360" cy="160" r="6" fill="#ef4444" />
          </svg>
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/55 to-transparent p-4 pt-20">
            <p className="font-display text-xl font-black uppercase leading-tight text-white sm:text-2xl">
              {luogo}
            </p>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[10px] uppercase tracking-wide text-cemento/85">
              <span><strong className="text-white">{km}</strong> km</span>
              <span><strong className="text-white">{durata}</strong></span>
              <span><strong className="text-white">{curve}</strong> curve</span>
            </div>
            <p className="mt-4 font-mono text-[9px] font-bold uppercase tracking-[0.32em] text-brand">
              MotoGarage
            </p>
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
