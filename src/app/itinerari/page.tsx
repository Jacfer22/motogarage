import Link from 'next/link';
import { getItinerari } from '@/lib/supabase';
import { REGIONI } from '@/lib/regioni';
import Reveal from '@/components/Reveal';

export const revalidate = 3600;

export const metadata = {
  title: 'Itinerari moto in Italia — MotoGarage',
  description:
    'Itinerari in moto regione per regione, con mappa, roadbook e traccia GPX. Percorsi condivisi e aggiornati dalla community.',
};

export default async function PaginaItinerari() {
  const itinerari = await getItinerari();

  const conteggio = new Map<string, number>();
  for (const it of itinerari) {
    for (const r of it.regioni ?? []) {
      conteggio.set(r, (conteggio.get(r) ?? 0) + 1);
    }
  }

  const conGiri = REGIONI.filter((r) => (conteggio.get(r.slug) ?? 0) > 0);
  const senzaGiri = REGIONI.filter((r) => (conteggio.get(r.slug) ?? 0) === 0);
  const totale = itinerari.length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <Reveal>
        <p className="font-mono text-sm uppercase tracking-[0.2em] text-cartello">Italia</p>
        <h1 className="mt-1 font-display text-5xl font-bold uppercase leading-none tracking-tight sm:text-7xl">
          Scegli la regione
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-asfalto/75">
          Ogni giro ha mappa, roadbook e traccia GPX. I percorsi li propone e
          aggiorna la community: se conosci una strada che vale, puoi aggiungerla.
        </p>

        <div className="mt-6 flex flex-wrap gap-2.5 font-mono text-sm">
          <span className="rounded-app bg-asfalto px-3 py-1.5 text-cemento">
            {totale} {totale === 1 ? 'itinerario' : 'itinerari'}
          </span>
          <span className="rounded-app border border-asfalto/15 bg-white px-3 py-1.5 shadow-app-sm">
            {conGiri.length} {conGiri.length === 1 ? 'regione attiva' : 'regioni attive'}
          </span>
        </div>
      </Reveal>

      {conGiri.length > 0 && (
        <Reveal>
          <h2 className="mt-12 font-display text-sm font-bold uppercase tracking-[0.2em] text-cartello">
            Con itinerari
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {conGiri.map((r) => (
              <Link
                key={r.slug}
                href={`/itinerari/regione/${r.slug}`}
                className="card-app tap group flex items-center justify-between gap-2 p-4"
              >
                <span className="font-display text-xl font-bold uppercase leading-tight tracking-tight transition-colors group-hover:text-bosco">
                  {r.nome}
                </span>
                <span className="shrink-0 rounded-full bg-segnale px-2.5 py-0.5 font-mono text-xs font-medium text-asfalto">
                  {conteggio.get(r.slug)}
                </span>
              </Link>
            ))}
          </div>
        </Reveal>
      )}

      <Reveal>
        <h2 className="mt-14 font-display text-sm font-bold uppercase tracking-[0.2em] text-asfalto/40">
          In arrivo
        </h2>
        <p className="mt-1 text-sm text-asfalto/55">
          Queste regioni non hanno ancora itinerari. Le prime strade le aggiunge
          chi le conosce: se ne hai una, proponila dal blog.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {senzaGiri.map((r) => (
            <Link
              key={r.slug}
              href={`/itinerari/regione/${r.slug}`}
              className="tap group relative flex items-center justify-between gap-2 overflow-hidden rounded-app border border-dashed border-asfalto/25 bg-white/40 p-4 transition-colors hover:border-asfalto/50 hover:bg-white"
            >
              <span className="font-display text-xl font-bold uppercase leading-tight tracking-tight text-asfalto/45 transition-colors group-hover:text-asfalto/70">
                {r.nome}
              </span>
              <span className="shrink-0 rounded-full border border-asfalto/20 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-asfalto/45">
                In arrivo
              </span>
            </Link>
          ))}
        </div>
      </Reveal>
    </div>
  );
}
