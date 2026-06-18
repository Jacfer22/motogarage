import Link from 'next/link';

// Card "segnaposto" per un futuro itinerario Pro: completamente offuscata,
// nessun nome leggibile. Solo barre grafiche che suggeriscono "contenuto in
// arrivo". Cliccandola si va alla pagina Pro per il pre-order.
export default function SlotProCard() {
  return (
    <Link
      href="/pro"
      className="group relative flex min-h-[200px] flex-col justify-between overflow-hidden rounded-app border border-asfalto/15 bg-asfalto p-5 text-cemento shadow-app-sm transition-transform hover:-translate-y-1"
    >
      {/* segnaposto grafici offuscati (nessun testo reale) */}
      <div className="pointer-events-none select-none">
        <div className="h-3 w-20 rounded-full bg-white/10" />
        <div className="mt-4 space-y-2">
          <div className="h-6 w-4/5 rounded-md bg-white/10 blur-[2px]" />
          <div className="h-6 w-3/5 rounded-md bg-white/10 blur-[2px]" />
        </div>
        <div className="mt-4 flex gap-2">
          <span className="h-6 w-16 rounded-full bg-white/10" />
          <span className="h-6 w-16 rounded-full bg-white/10" />
        </div>
      </div>

      {/* badge lucchetto in alto a destra */}
      <span className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-segnale px-3 py-1 font-mono text-[10px] font-medium uppercase tracking-wide text-asfalto">
        🔒 Pro
      </span>

      {/* CTA in basso */}
      <div className="relative mt-4">
        <p className="font-display text-lg font-bold uppercase tracking-tight text-segnale">
          In arrivo
        </p>
        <p className="mt-1 font-mono text-xs uppercase tracking-wide text-guardrail group-hover:text-cemento">
          Clicca per non perderti gli aggiornamenti →
        </p>
      </div>
    </Link>
  );
}
