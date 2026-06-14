import Link from 'next/link';
import { Accesso, Itinerario } from '@/lib/types';
import { ChipDato, ChipDifficolta } from './Chips';

function BadgeAccesso({ accesso }: { accesso: Accesso }) {
  const stili: Record<Accesso, { bg: string; testo: string; label: string }> = {
    aperto: { bg: 'bg-bosco', testo: 'text-cemento', label: 'Libero' },
    registrati: { bg: 'bg-white', testo: 'text-asfalto', label: 'Gratis' },
    pro: { bg: 'bg-segnale', testo: 'text-asfalto', label: 'Pro' },
  };
  const s = stili[accesso];
  return (
    <span className={`${s.bg} ${s.testo} rounded-full px-2.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wide`}>
      {s.label}
    </span>
  );
}

export default function ItinerarioCard({
  itinerario,
  haAvviso = false,
  accesso,
}: {
  itinerario: Itinerario;
  haAvviso?: boolean;
  accesso?: Accesso;
}) {
  const bloccato = accesso === 'pro';

  return (
    <Link
      href={`/itinerari/${itinerario.slug}`}
      className="card-app group flex flex-col overflow-hidden"
    >
      {/* intestazione: fascia asfalto con zona + badge, e un accenno di percorso */}
      <div className="relative flex items-center justify-between gap-2 bg-asfalto px-4 py-2.5">
        <span className="truncate font-mono text-xs uppercase tracking-wide text-guardrail">
          {itinerario.zona}
        </span>
        <div className="flex shrink-0 items-center gap-1.5">
          {haAvviso && (
            <span className="rounded-full bg-cartello px-2 py-0.5 font-mono text-[10px] font-medium uppercase text-cemento">
              ⚠
            </span>
          )}
          {accesso && <BadgeAccesso accesso={accesso} />}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <h3 className="font-display text-3xl font-bold uppercase leading-none tracking-tight transition-colors group-hover:text-bosco">
          {itinerario.titolo}
        </h3>
        <p className="text-sm leading-relaxed text-asfalto/70">{itinerario.sottotitolo}</p>
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
          <ChipDato label="km" value={String(itinerario.km)} />
          <ChipDato label="ore" value={`~${itinerario.durata_ore}`} />
          <ChipDifficolta value={itinerario.difficolta} />
          {bloccato && (
            <span className="ml-auto font-mono text-[10px] uppercase tracking-wide text-asfalto/40">
              🔒 con Pro
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
