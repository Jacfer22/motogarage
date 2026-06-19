import Link from 'next/link';
import { getItinerari, getItinerariConAvvisi } from '@/lib/supabase';
import { accessoItinerario } from '@/lib/accesso';
import LandingHero from '@/components/LandingHero';
import Reveal from '@/components/Reveal';
import ItinerarioCard from '@/components/ItinerarioCard';

export const revalidate = 3600;

export default async function HomePage() {
  const [itinerari, idConAvvisi] = await Promise.all([
    getItinerari(),
    getItinerariConAvvisi(),
  ]);

  const reali = itinerari.filter((i) => !i.is_placeholder);
  const inEvidenza = reali
    .filter((i) => i.origine === 'verificato')
    .slice(0, 3);

  return (
    <div>
      <LandingHero itinerariCount={reali.length} />

      {inEvidenza.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-14 sm:py-16">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.22em] text-asfalto/40">
                  Da non perdere
                </p>
                <h2 className="mt-1 font-display text-3xl font-bold uppercase tracking-tight sm:text-4xl">
                  Itinerari verificati
                </h2>
              </div>
              <Link
                href="/itinerari"
                className="font-mono text-xs font-medium uppercase tracking-[0.18em] text-asfalto/45 transition-colors hover:text-red-600"
              >
                Tutte le regioni →
              </Link>
            </div>
          </Reveal>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {inEvidenza.map((item, i) => (
              <Reveal key={item.id} delay={i * 60}>
                <ItinerarioCard
                  itinerario={item}
                  haAvviso={idConAvvisi.has(item.id)}
                  accesso={accessoItinerario(item, itinerari)}
                />
              </Reveal>
            ))}
          </div>
        </section>
      )}

      <section className="border-y border-asfalto/8 bg-asfalto/[0.02]">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:py-16">
          <Reveal>
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-asfalto/40">
              Cosa puoi fare
            </p>
            <h2 className="mt-1 font-display text-3xl font-bold uppercase tracking-tight sm:text-4xl">
              Tutto in un&apos;unica piattaforma
            </h2>
          </Reveal>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              href="/traccia"
              titolo="Traccia un giro"
              desc="GPS live, statistiche e card condivisibile per Instagram e TikTok."
              inEvidenza
              delay={0}
            />
            <FeatureCard
              href="/itinerari"
              titolo="Itinerari"
              desc="Mappe, tappe, avvisi strada e GPX per ogni regione d'Italia."
              delay={60}
            />
            <FeatureCard
              href="/garage"
              titolo="Il mio Garage"
              desc="Gemello digitale 3D della tua moto nel garage virtuale."
              delay={120}
            />
            <FeatureCard
              href="/community"
              titolo="Community"
              desc="Foto, giri pubblici e commenti dalla community di biker."
              delay={180}
            />
          </div>
        </div>
      </section>

      <section className="tuning-cta-finale">
        <div className="mx-auto max-w-6xl px-4 py-14 text-center sm:py-16">
          <Reveal>
            <h2 className="font-display text-3xl font-black uppercase tracking-tight text-white sm:text-5xl">
              Pronto a partire?
            </h2>
            <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-cemento/65 sm:text-base">
              Registrati gratis, sblocca gli itinerari e inizia a costruire il tuo garage digitale.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/accedi#registrati"
                className="tap rounded-app bg-brand px-8 py-3.5 font-mono text-sm font-bold uppercase tracking-wide text-white shadow-brand transition-colors hover:bg-brand-chiaro"
              >
                Crea account gratuito
              </Link>
              <Link
                href="/itinerari"
                className="tap rounded-app border border-white/15 px-8 py-3.5 font-mono text-sm font-bold uppercase tracking-wide text-cemento/75 transition-colors hover:border-white/30 hover:text-white"
              >
                Esplora itinerari
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({
  href,
  titolo,
  desc,
  inEvidenza,
  delay = 0,
}: {
  href: string;
  titolo: string;
  desc: string;
  inEvidenza?: boolean;
  delay?: number;
}) {
  return (
    <Reveal delay={delay}>
      <Link
        href={href}
        className={`card-feature group ${inEvidenza ? 'card-feature-evidenza' : ''}`}
      >
        <h3 className="font-display text-xl font-bold uppercase leading-tight tracking-tight transition-colors group-hover:text-brand">
          {titolo}
        </h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed">
          {desc}
        </p>
        <span className="mt-4 font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-asfalto/45 transition-colors group-hover:text-brand">
          Scopri →
        </span>
      </Link>
    </Reveal>
  );
}
