import Link from 'next/link';

export default function PaginaPro() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-14">
      <p className="font-mono text-sm uppercase tracking-widest text-cartello">
        GiroSecco Pro
      </p>
      <h1 className="mt-2 font-display text-5xl font-bold uppercase leading-none tracking-tight sm:text-7xl">
        Il giro completo,
        <br />
        <span className="text-bosco">senza pensieri.</span>
      </h1>

      <ul className="mt-8 space-y-3 border-2 border-asfalto bg-white p-6">
        {[
          'Tracce GPX di tutti gli itinerari, pronte per il navigatore',
          'Varianti del percorso: versione corta, versione panoramica',
          'Pacchetto weekend: orari, soste, dove dormire',
          'Nuovi itinerari ogni mese, provati su strada',
        ].map((voce) => (
          <li key={voce} className="flex gap-3">
            <span className="font-mono font-medium text-bosco">✓</span>
            <span>{voce}</span>
          </li>
        ))}
      </ul>

      <div className="mt-8 flex flex-col gap-4 sm:flex-row">
        <div className="flex-1 border-2 border-asfalto bg-asfalto p-6 text-cemento">
          <p className="font-mono text-sm uppercase text-segnale">Stagione</p>
          <p className="mt-1 font-display text-5xl font-bold">9,90€</p>
          <p className="font-mono text-xs text-guardrail">una tantum · accesso 12 mesi</p>
        </div>
        <div className="flex-1 border-2 border-asfalto bg-white p-6">
          <p className="font-mono text-sm uppercase text-cartello">Mensile</p>
          <p className="mt-1 font-display text-5xl font-bold">2,99€</p>
          <p className="font-mono text-xs text-asfalto/50">al mese · disdici quando vuoi</p>
        </div>
      </div>

      <div className="mt-8 border-2 border-asfalto bg-cemento p-5">
        <p className="font-mono text-sm text-asfalto/70">
          I pagamenti non sono ancora attivi. Nel frattempo gli itinerari free
          sono tutti aperti.
        </p>
        <Link
          href="/itinerari"
          className="mt-3 inline-block bg-segnale px-5 py-2.5 font-mono text-sm font-medium uppercase text-asfalto hover:bg-asfalto hover:text-cemento"
        >
          Vai agli itinerari
        </Link>
      </div>
    </section>
  );
}
