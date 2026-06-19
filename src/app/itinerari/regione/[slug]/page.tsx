import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getItinerariPerRegione, getItinerariConAvvisi } from '@/lib/supabase';
import { nomeRegione, regioneEsiste, REGIONI } from '@/lib/regioni';
import { livelliAccessoRegione } from '@/lib/accesso';
import { slotProRegione } from '@/lib/slot-pro';
import ItinerarioCard from '@/components/ItinerarioCard';
import SlotProCard from '@/components/SlotProCard';

export const revalidate = 3600;

export function generateStaticParams() {
  return REGIONI.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const nome = nomeRegione(slug);
  return {
    title: nome ? `Itinerari moto in ${nome} — MotoGarage` : 'Itinerari — MotoGarage',
  };
}

export default async function PaginaRegione({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!regioneEsiste(slug)) notFound();

  const nome = nomeRegione(slug)!;
  const [itinerari, idConAvvisi] = await Promise.all([
    getItinerariPerRegione(slug),
    getItinerariConAvvisi(),
  ]);

  const livelli = livelliAccessoRegione(itinerari);
  const ordinati = [...itinerari].sort((a, b) => {
    const ra = livelli.get(a.id) === 'aperto' ? 0 : livelli.get(a.id) === 'registrati' ? 1 : 2;
    const rb = livelli.get(b.id) === 'aperto' ? 0 : livelli.get(b.id) === 'registrati' ? 1 : 2;
    return ra - rb;
  });
  // Tutti i giri reali sono accessibili (aperti o con registrazione).
  const liberi = ordinati;
  // Gli slot Pro "coming soon" di questa regione (numero, senza nomi).
  const numSlotPro = slotProRegione(slug);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <Link
        href="/itinerari"
        className="font-mono text-sm uppercase text-asfalto/60 hover:text-asfalto"
      >
        ← Tutte le regioni
      </Link>

      <h1 className="mt-4 font-display text-5xl font-bold uppercase leading-none tracking-tight sm:text-7xl">
        {nome}
      </h1>
      <p className="mt-3 text-lg text-asfalto/75">
        {itinerari.length === 0
          ? 'Ancora nessun itinerario qui.'
          : `${itinerari.length} ${itinerari.length === 1 ? 'itinerario' : 'itinerari'} in ${nome}.`}
      </p>

      {itinerari.length === 0 ? (
        <div className="mt-10 border-2 border-dashed border-asfalto/25 p-8 text-center">
          <p className="font-display text-2xl font-bold uppercase tracking-tight text-asfalto/40">
            Strade da scoprire
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-asfalto/55">
            Conosci un bel giro in {nome}? Raccontacelo: lo trasformiamo in un
            itinerario con mappa e GPX, e lo pubblichiamo qui.
          </p>
          <Link
            href="/blog/nuovo"
            className="mt-4 inline-block bg-segnale px-5 py-2.5 font-mono text-sm font-medium uppercase text-asfalto hover:bg-asfalto hover:text-cemento"
          >
            Proponi un giro
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-10 flex items-end justify-between gap-4 border-b-2 border-asfalto pb-3">
            <h2 className="font-display text-3xl font-bold uppercase tracking-tight">
              Gli itinerari
            </h2>
            <span className="font-mono text-xs uppercase tracking-wide text-asfalto/50">
              {liberi.length > 1 ? '1 libero · gli altri con registrazione' : 'libero a tutti'}
            </span>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {liberi.map((i) => (
              <ItinerarioCard
                key={i.id}
                itinerario={i}
                haAvviso={idConAvvisi.has(i.id)}
                accesso={livelli.get(i.id)}
              />
            ))}
          </div>

          {numSlotPro > 0 && (
            <div className="mt-14">
              <div className="flex items-end justify-between gap-4 border-b-2 border-segnale pb-3">
                <div>
                  <h2 className="font-display text-3xl font-bold uppercase tracking-tight">
                    Pro <span className="text-segnale-scuro">· in arrivo</span>
                  </h2>
                  <p className="mt-1 text-sm text-asfalto/60">
                    Itinerari premium con GPX, varianti e pacchetti weekend. Stanno arrivando.
                  </p>
                </div>
                <Link
                  href="/pro"
                  className="tap shrink-0 rounded-app bg-segnale px-4 py-2 font-mono text-xs font-medium uppercase tracking-wide text-asfalto hover:bg-asfalto hover:text-cemento"
                >
                  Pre-iscriviti →
                </Link>
              </div>
              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: numSlotPro }).map((_, i) => (
                  <SlotProCard key={i} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
