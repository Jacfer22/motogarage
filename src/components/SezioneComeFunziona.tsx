'use client';

import { useAuth } from './AuthProvider';
import Reveal from './Reveal';

const PASSI = [
  {
    numero: '01',
    titolo: 'Registrati gratis',
    desc: 'Profilo, giri nel cloud e garage digitale — tutto sincronizzato su ogni dispositivo.',
  },
  {
    numero: '02',
    titolo: 'Traccia un giro',
    desc: 'Avvia il GPS, registra km e curve reali. Al termine ottieni statistiche e la card social.',
  },
  {
    numero: '03',
    titolo: 'Condividi e cresci',
    desc: 'Pubblica in community, crea l\'avatar 3D della moto e scala la classifica km.',
  },
];

export default function SezioneComeFunziona() {
  const { user, loading } = useAuth();

  if (loading || user) return null;

  return (
    <section className="border-y border-asfalto/8 bg-white dark:bg-carbone">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-asfalto/40">
            Come funziona
          </p>
          <h2 className="mt-1 font-display text-2xl font-bold uppercase tracking-tight sm:text-4xl">
            Tre passi e sei in sella
          </h2>
        </Reveal>

        <div className="mt-8 space-y-3 sm:space-y-4">
          {PASSI.map((passo, i) => (
            <Reveal key={passo.numero} delay={i * 60}>
              <div className="flex gap-4 rounded-app-lg border border-asfalto/10 p-4 dark:border-white/10">
                <p className="font-display text-2xl font-black text-brand sm:text-3xl">{passo.numero}</p>
                <div>
                  <h3 className="font-display text-base font-bold uppercase tracking-tight sm:text-lg">
                    {passo.titolo}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-asfalto/65 dark:text-cemento/65">
                    {passo.desc}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
