import { getItinerari, getItinerariConAvvisi } from '@/lib/supabase';
import ItinerarioCard from '@/components/ItinerarioCard';

export const revalidate = 3600;

export default async function Home() {
  const [itinerari, idConAvvisi] = await Promise.all([
    getItinerari(),
    getItinerariConAvvisi(),
  ]);
  const kmTotali = itinerari.reduce((acc, i) => acc + i.km, 0);

  return (
    <>
      {/* Hero */}
      <section className="bg-asfalto text-cemento">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
          <p className="font-mono text-sm uppercase tracking-widest text-segnale">
            Lazio · provati su strada
          </p>
          <h1 className="mt-3 max-w-3xl font-display text-6xl font-bold uppercase leading-[0.95] tracking-tight sm:text-8xl">
            Domenica.
            <br />
            Moto.
            <br />
            <span className="text-segnale">Sai già dove.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-guardrail">
            Itinerari pensati e percorsi davvero: dove si piega meglio, dove
            si mangia bene, dove conviene fare benzina prima della salita.
            Aggiornati quando la strada cambia.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 font-mono text-sm">
            <span className="border border-guardrail/40 px-3 py-1.5">
              {itinerari.length} itinerari
            </span>
            <span className="border border-guardrail/40 px-3 py-1.5">
              {kmTotali.toLocaleString('it-IT')} km mappati
            </span>
            <span className="border border-guardrail/40 px-3 py-1.5">
              GPX pronti per il navigatore
            </span>
          </div>
        </div>
      </section>

      {/* Griglia itinerari */}
      <section id="itinerari" className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-8 flex items-end justify-between gap-4">
          <h2 className="font-display text-4xl font-bold uppercase tracking-tight">
            Gli itinerari
          </h2>
          <p className="hidden font-mono text-xs uppercase text-asfalto/50 sm:block">
            ordinati per km, dal più corto
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {itinerari.map((i) => (
            <ItinerarioCard
              key={i.id}
              itinerario={i}
              haAvviso={idConAvvisi.has(i.id)}
            />
          ))}
        </div>
      </section>
    </>
  );
}
