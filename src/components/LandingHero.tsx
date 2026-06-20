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
            Solo per veri bikers
          </p>
          <h1 className="mt-4 max-w-3xl font-display text-[2.6rem] font-black uppercase leading-[0.92] tracking-tight text-white sm:text-6xl lg:text-[4.5rem]">
            La casa digitale
            <span className="block text-cemento/90">della tua moto</span>
          </h1>
          <p className="mt-5 max-w-lg text-sm leading-relaxed text-cemento/75 sm:text-base">
            Garage virtuale, gemello 3D fotorealistico, itinerari verificati in Italia,
            tracciamento GPS con card social e navigatore integrato. Per chi vive in sella.
          </p>
        </Reveal>

        <Reveal delay={100}>
          <div className="mt-8">
            <CtaHome />
          </div>
        </Reveal>

        <Reveal delay={160}>
          <div className="mt-10 flex flex-wrap gap-5 border-t border-white/10 pt-8">
            <Metrica valore={String(itinerariCount)} label="Itinerari" />
            <Metrica valore="20" label="Regioni" />
            <Metrica valore="GPS" label="Tracciamento" />
            <Metrica valore="NAV" label="Navigatore" />
            <Metrica valore="3D" label="Gemello digitale" />
          </div>
        </Reveal>

        <Reveal delay={200}>
          <div className="mt-8 flex flex-wrap gap-3">
            <Pill href="/traccia" label="Traccia il mio giro" evidenziata />
            <Pill href="/naviga" label="Navigatore GPS" />
            <Pill href="/garage" label="Il mio Garage" />
            <Pill href="/itinerari" label="Itinerari" />
            <Pill href="/community" label="Community" />
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

function Pill({ href, label, evidenziata }: { href: string; label: string; evidenziata?: boolean }) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-wide backdrop-blur transition-colors ${
        evidenziata
          ? 'border-brand/50 bg-brand/25 text-white hover:bg-brand/40'
          : 'border-white/15 bg-black/35 text-cemento/80 hover:border-brand/40 hover:bg-brand/15 hover:text-white'
      }`}
    >
      {label}
    </Link>
  );
}
