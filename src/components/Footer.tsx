export default function Footer() {
  return (
    <footer className="mt-16 bg-asfalto text-cemento">
      <div className="mezzeria" aria-hidden="true"/>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex items-center gap-3 mb-4">
          <img src="/logo-motogarage.svg" alt="" width={28} height={34} className="h-8 w-auto opacity-80"/>
          <span className="font-display text-xl font-bold uppercase tracking-tight">
            Moto<span className="text-segnale">Garage</span>
          </span>
        </div>
        <p className="font-hand text-2xl leading-snug text-segnale sm:text-3xl">
          La casa digitale della tua moto.
        </p>
        <p className="mt-3 max-w-xl text-sm text-guardrail">
          Crea il gemello digitale della tua moto, personalizza il tuo garage virtuale e connettiti con la community di motociclisti italiani.
        </p>
        <p className="mt-6 text-xs text-guardrail/70">MotoGarage · Italia</p>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 font-mono text-xs uppercase tracking-wide text-guardrail/70">
          <a href="/privacy" className="hover:text-segnale">Privacy</a>
          <a href="/termini" className="hover:text-segnale">Termini</a>
          <a href="mailto:info@motogarage.it" className="hover:text-segnale">Contatti</a>
        </div>
      </div>
    </footer>
  );
}
