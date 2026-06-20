'use client';

import { useAuth } from './AuthProvider';
import Reveal from './Reveal';
import CardDemoAnteprima from './CardDemoAnteprima';

export default function SezioneCardEsempio() {
  const { user, loading } = useAuth();

  if (loading || user) return null;

  return (
    <section className="border-b border-asfalto/8 bg-asfalto/[0.02] dark:bg-carbone/50">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-asfalto/40">
            Esempio card social
          </p>
          <h2 className="mt-1 max-w-md font-display text-2xl font-bold uppercase tracking-tight sm:text-4xl">
            La card del tuo giro, pronta per Instagram
          </h2>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-asfalto/65 dark:text-cemento/65">
            A fine tracciamento GPS generi automaticamente km, tempo, curve e tracciato — formato 4:5.
          </p>
        </Reveal>
        <Reveal delay={80}>
          <CardDemoAnteprima className="mt-8" />
        </Reveal>
      </div>
    </section>
  );
}
