import { BADGES } from '@/lib/badge';
import IconaBadgeLivello from '@/components/icons/IconaBadgeLivello';

/** Anteprima interna di tutti i badge — /dev/badges */
export default function PaginaAnteprimaBadge() {
  return (
    <main className="min-h-dvh bg-notte px-4 py-8 text-cemento">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-brand">Dev · anteprima badge</p>
      <h1 className="mt-1 font-display text-2xl font-black uppercase text-white">7 livelli km</h1>
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {BADGES.map((b) => (
          <div
            key={b.id}
            className={`badge-livello-card badge-livello-rango-${b.rango} flex flex-col items-center p-4 text-center`}
          >
            <IconaBadgeLivello badge={b} size="grande" />
            <p className="mt-3 font-display text-sm font-black uppercase text-white">{b.nome}</p>
            <p className="mt-1 font-mono text-[10px] text-cemento/50">
              {b.kmRichiesti.toLocaleString('it-IT')} km · rango {b.rango + 1}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}
