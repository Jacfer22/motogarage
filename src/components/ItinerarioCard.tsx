import Link from 'next/link';
import { Accesso, Itinerario } from '@/lib/types';
import { ChipDato, ChipDifficolta } from './Chips';

function BadgeAccesso({ accesso }: { accesso: Accesso }) {
  if (accesso === 'aperto') {
    return (
      <span className="bg-bosco px-2 py-0.5 font-mono text-xs font-medium uppercase text-cemento">
        Libero
      </span>
    );
  }
  if (accesso === 'registrati') {
    return (
      <span className="bg-white px-2 py-0.5 font-mono text-xs font-medium uppercase text-asfalto">
        Gratis
      </span>
    );
  }
  return (
    <span className="bg-segnale px-2 py-0.5 font-mono text-xs font-medium uppercase text-asfalto">
      Pro
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
  return (
    <Link
      href={`/itinerari/${itinerario.slug}`}
      className="group flex flex-col border-2 border-asfalto bg-white transition-transform hover:-translate-y-0.5"
    >
      <div className="flex items-center justify-between border-b-2 border-asfalto bg-asfalto px-4 py-2">
        <span className="font-mono text-xs uppercase tracking-wide text-guardrail">
          {itinerario.zona}
        </span>
        <div className="flex items-center gap-2">
          {haAvviso && (
            <span className="bg-cartello px-2 py-0.5 font-mono text-xs font-medium uppercase text-cemento">
              ⚠ Aggiornamenti
            </span>
          )}
          {accesso && <BadgeAccesso accesso={accesso} />}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <h3 className="font-display text-3xl font-bold uppercase leading-none tracking-tight group-hover:text-bosco">
          {itinerario.titolo}
        </h3>
        <p className="text-sm text-asfalto/70">{itinerario.sottotitolo}</p>
        <div className="mt-auto flex flex-wrap gap-2">
          <ChipDato label="km" value={String(itinerario.km)} />
          <ChipDato label="ore" value={`~${itinerario.durata_ore}`} />
          <ChipDifficolta value={itinerario.difficolta} />
        </div>
      </div>
    </Link>
  );
}
