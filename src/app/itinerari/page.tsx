import Link from 'next/link';
import { getItinerari, getItinerariConAvvisi } from '@/lib/supabase';
import ItinerarioCard from '@/components/ItinerarioCard';

export const revalidate = 3600;

export const metadata = {
  title: 'Itinerari moto nel Lazio — GiroSecco',
  description:
    'Dieci itinerari in moto nel Lazio, ognuno con mappa, roadbook tappa per tappa e traccia GPX da scaricare.',
};

export default async function PaginaItinerari() {
  const [itinerari, idConAvvisi] = await Promise.all([
    getItinerari(),
    getItinerariConAvvisi(),
  ]);

  const kmTotali = itinerari.reduce((acc, i) => acc + i.km, 0);
  const free = itinerari.filter((i) => !i.is_premium);
  const pro = itinerari.filter((i) => i.is_premium);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <p className="font-mono text-sm uppercase tracking-widest text-cartello">
        Lazio
      </p>
      <h1 className="mt-1 font-display text-5xl font-bold uppercase leading-none tracking-tight sm:text-7xl">
        Gli itinerari
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-asfalto/75">
        Ogni giro ha la mappa del percorso, il roadbook tappa per tappa e la
        traccia GPX da caricare sul navigatore. I km sono misurati sul
        tracciato reale.
      </p>

      <div className="mt-6 flex flex-wrap gap-3 font-mono text-sm">
        <span className="border-2 border-asfalto px-3 py-1.5">
          {itinerari.length} itinerari
        </span>
        <span className="border-2 border-asfalto px-3 py-1.5">
          {kmTotali.toLocaleString('it-IT')} km totali
        </span>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {free.map((i) => (
          <ItinerarioCard key={i.id} itinerario={i} haAvviso={idConAvvisi.has(i.id)} />
        ))}
      </div>

      {pro.length > 0 && (
        <div className="mt-16">
          <div className="flex items-end justify-between gap-4 border-b-2 border-asfalto pb-3">
            <h2 className="font-display text-3xl font-bold uppercase tracking-tight">
              Itinerari Pro
            </h2>
            <Link
              href="/pro"
              className="font-mono text-xs uppercase tracking-wide text-cartello underline hover:text-asfalto"
            >
              Cos&apos;è Pro →
            </Link>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {pro.map((i) => (
              <ItinerarioCard key={i.id} itinerario={i} haAvviso={idConAvvisi.has(i.id)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
