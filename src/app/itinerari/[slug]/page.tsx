import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getItinerario } from '@/lib/supabase';
import AvvisoBanner from '@/components/AvvisoBanner';
import ContenutoItinerario from '@/components/ContenutoItinerario';
import { ChipDato, ChipDifficolta } from '@/components/Chips';

export const revalidate = 3600;

export default async function PaginaItinerario({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const itinerario = await getItinerario(slug);
  if (!itinerario) notFound();

  const tappe = itinerario.tappe ?? [];

  return (
    <article className="mx-auto max-w-4xl px-4 py-10">
      <Link
        href="/itinerari"
        className="font-mono text-sm uppercase text-asfalto/60 hover:text-asfalto"
      >
        ← Tutti gli itinerari
      </Link>

      <header className="mt-4">
        <p className="font-mono text-sm uppercase tracking-widest text-cartello">
          {itinerario.zona}
        </p>
        <h1 className="mt-1 font-display text-5xl font-bold uppercase leading-none tracking-tight sm:text-7xl">
          {itinerario.titolo}
        </h1>
        <p className="mt-3 text-lg text-asfalto/70">{itinerario.sottotitolo}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <ChipDato label="km" value={String(itinerario.km)} />
          <ChipDato label="ore" value={`~${itinerario.durata_ore}`} />
          <ChipDifficolta value={itinerario.difficolta} />
          <ChipDato label="quando" value={itinerario.periodo_ideale} />
        </div>
      </header>

      {itinerario.origine === 'classico' && (
        <div className="mt-6 border-2 border-asfalto/20 bg-cemento p-4">
          <p className="font-mono text-xs uppercase tracking-wide text-cartello">
            Percorso classico
          </p>
          <p className="mt-1 text-sm text-asfalto/70">
            Una delle strade-icona della zona, descritta da fonti pubbliche. La
            traccia GPS di dettaglio non è ancora rifinita: se lo conosci e vuoi
            aggiungere tappe o GPX, scrivici dal blog.
          </p>
        </div>
      )}

      {/* Avvisi: info di sicurezza, visibili a tutti indipendentemente dall'account */}
      <AvvisoBanner avvisi={itinerario.avvisi ?? []} />

      <section className="mt-8">
        <h2 className="font-display text-3xl font-bold uppercase tracking-tight">
          Il giro
        </h2>
        <p className="mt-3 whitespace-pre-line leading-relaxed text-asfalto/85">
          {itinerario.descrizione}
        </p>
      </section>

      {/* Mappa, roadbook, GPX (+ variante/weekend se Pro): in base al livello account */}
      <ContenutoItinerario
        titolo={itinerario.titolo}
        isPremium={itinerario.is_premium}
        tappe={tappe}
        tracciato={itinerario.tracciato ?? []}
        strada={itinerario.strada ?? null}
        stradaFonte={itinerario.strada_fonte ?? null}
        proExtra={itinerario.pro_extra}
        gpxUrl={itinerario.gpx_url}
      />
    </article>
  );
}
