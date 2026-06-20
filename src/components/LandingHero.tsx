'use client';

import Link from 'next/link';
import CtaHome from '@/components/CtaHome';
import Reveal from '@/components/Reveal';
import TuningGarageScene from '@/components/TuningGarageScene';

interface Props {
  itinerariCount: number;
}

export default function LandingHero({ itinerariCount }: Props) {
  return (
    <TuningGarageScene variant="landing" className="landing-tuning-hero">
      <div className="landing-tuning-content">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-[0.32em] text-amber-200/80">
            Per motociclisti italiani
          </p>
          <h1 className="mt-4 max-w-3xl font-display text-[2.35rem] font-black uppercase leading-[0.92] tracking-tight text-white sm:text-6xl lg:text-[4.2rem]">
            Traccia il giro.
            <span className="block text-brand">Crea la card.</span>
            <span className="block text-cemento/90">Condividi.</span>
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-cemento/75 sm:mt-5 sm:text-base">
            <span className="hidden sm:inline">
              GPS reale, statistiche e card pronta per Instagram — più garage 3D, itinerari e community.
              Registrati gratis per salvare tutto nel cloud.
            </span>
            <span className="sm:hidden">
              GPS reale e card pronta per Instagram. Registrati gratis.
            </span>
          </p>
        </Reveal>

        <Reveal delay={100}>
          <div className="mt-6 sm:mt-8">
            <CtaHome />
          </div>
        </Reveal>

        <Reveal delay={160}>
          <div className="mt-10 hidden flex-wrap gap-6 border-t border-white/10 pt-8 md:flex">
            <Metrica valore={String(itinerariCount)} label="Itinerari" />
            <Metrica valore="20" label="Regioni" />
            <Metrica valore="GPS" label="Tracciamento" />
          </div>
        </Reveal>

        <Reveal delay={200}>
          <div className="mt-8 hidden flex-wrap gap-3 md:flex">
            <Pill href="/naviga" label="Navigatore" />
            <Pill href="/itinerari" label="Itinerari" />
          </div>
        </Reveal>
      </div>
    </TuningGarageScene>
  );
}

function Metrica({ valore, label }: { valore: string; label: string }) {
  return (
    <div>
      <p className="font-display text-2xl font-black text-white sm:text-3xl">{valore}</p>
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cemento/50">{label}</p>
    </div>
  );
}

function Pill({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-full border border-white/15 bg-black/35 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-wide text-cemento/80 backdrop-blur transition-colors hover:border-brand/40 hover:bg-brand/15 hover:text-white"
    >
      {label}
    </Link>
  );
}
