import Link from 'next/link';
import { getItinerari } from '@/lib/supabase';
import LandingHero from '@/components/LandingHero';
import Reveal from '@/components/Reveal';
import SezioneCardEsempio from '@/components/SezioneCardEsempio';
import SezioneComeFunziona from '@/components/SezioneComeFunziona';

export const revalidate = 3600;

export default async function HomePage() {
  const itinerari = await getItinerari();
  const reali = itinerari.filter((i) => !i.is_placeholder);

  return (
    <div>
      <LandingHero itinerariCount={reali.length} />

      <div className="strada-viva strada-viva-animata" aria-hidden="true" />

      <SezioneCardEsempio />

      <div className="strada-viva strada-viva-animata" aria-hidden="true" />

      <section className="border-b border-asfalto/8 bg-asfalto/[0.02]">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
          <Reveal>
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-asfalto/40">
              Cosa puoi fare
            </p>
            <h2 className="mt-1 font-display text-2xl font-bold uppercase tracking-tight sm:text-4xl">
              Tutto in un&apos;unica piattaforma
            </h2>
          </Reveal>

          <div className="bento-features mt-8 sm:mt-10">
            <FeatureCard
              href="/traccia"
              titolo="Traccia un giro"
              desc="GPS live, statistiche e card condivisibile per Instagram e TikTok."
              inEvidenza
              bento="hero"
              delay={0}
            />
            <FeatureCard
              href="/itinerari"
              titolo="Itinerari"
              desc="Mappe, tappe, avvisi strada. GPX su itinerari verificati."
              bento="side-top"
              delay={60}
            />
            <FeatureCard
              href="/garage"
              titolo="Il mio Garage"
              desc="Avatar 3D della tua moto nel garage virtuale."
              bento="side-bottom"
              delay={120}
            />
            <FeatureCard
              href="/community"
              titolo="Community"
              desc="Foto, giri pubblici e commenti dalla community di biker."
              bento="wide"
              delay={180}
            />
          </div>
        </div>
      </section>

      <div className="strada-viva strada-viva-animata" aria-hidden="true" />

      <SezioneComeFunziona />

      <div className="strada-viva strada-viva-animata" aria-hidden="true" />

      <section className="tuning-cta-finale">
        <div className="mx-auto max-w-6xl px-4 py-12 text-center sm:py-16">
          <Reveal>
            <h2 className="font-display text-2xl font-black uppercase tracking-tight text-white sm:text-5xl">
              Pronto a partire?
            </h2>
            <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-cemento/65 sm:text-base">
              Registrati gratis, sblocca gli itinerari e inizia a costruire il tuo garage digitale.
            </p>
            <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
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
  bento = 'side-top',
  delay = 0,
}: {
  href: string;
  titolo: string;
  desc: string;
  inEvidenza?: boolean;
  bento?: 'hero' | 'side-top' | 'side-bottom' | 'wide';
  delay?: number;
}) {
  const bentoClass =
    bento === 'hero'
      ? 'bento-feature-hero'
      : bento === 'wide'
        ? 'bento-feature-wide'
        : bento === 'side-top'
          ? 'bento-feature-sm bento-feature-side-top'
          : bento === 'side-bottom'
            ? 'bento-feature-sm bento-feature-side-bottom'
            : 'bento-feature-sm';

  return (
    <Reveal delay={delay}>
      <Link
        href={href}
        className={`card-feature bento-feature group ${bentoClass} ${inEvidenza ? 'card-feature-evidenza' : ''}`}
      >
        {inEvidenza && (
          <span className="bento-feature-badge font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-brand">
            Core
          </span>
        )}
        <h3 className="font-display text-lg font-bold uppercase leading-tight tracking-tight transition-colors group-hover:text-brand sm:text-xl">
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
