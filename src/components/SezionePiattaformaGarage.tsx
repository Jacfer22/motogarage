import Link from 'next/link';
import Reveal from '@/components/Reveal';
import IconaGpsLive from '@/components/icons/IconaGpsLive';

const SATELLITI = [
  {
    href: '/traccia',
    titolo: 'Traccia un giro',
    desc: 'GPS live, statistiche e card condivisibile per Instagram e TikTok.',
    pos: 'top' as const,
  },
  {
    href: '/itinerari',
    titolo: 'Itinerari',
    desc: 'Mappe, tappe, avvisi strada. GPX su itinerari verificati.',
    pos: 'left' as const,
  },
  {
    href: '/community',
    titolo: 'Community',
    desc: 'Foto, giri pubblici e commenti dalla community di biker.',
    pos: 'right' as const,
  },
];

function IconaGarageLucchetto() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="text-brand">
      <path
        d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M8 21V10c0-1 .5-2 2-2h4c1.5 0 2 1 2 2v11" stroke="currentColor" strokeWidth="1.5" />
      <rect x="10" y="13" width="4" height="3" rx="0.5" fill="currentColor" opacity="0.9" />
      <path
        d="M14 8V7a2 2 0 0 0-4 0v1"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function SezionePiattaformaGarage() {
  return (
    <section className="border-b border-asfalto/8 bg-asfalto/[0.02] dark:bg-carbone/30">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <Reveal>
          <p className="text-center font-mono text-xs uppercase tracking-[0.22em] text-asfalto/40">
            Cosa puoi fare
          </p>
        </Reveal>

        <div className="landing-garage-hub mt-8 sm:mt-10">
          {SATELLITI.filter((s) => s.pos === 'top').map((item) => (
            <Reveal key={item.href} delay={40}>
              <Link href={item.href} className="landing-garage-sat landing-garage-sat-top group">
                <IconaGpsLive size={28} className="text-brand" />
                <h3 className="mt-3 font-display text-lg font-bold uppercase tracking-tight group-hover:text-brand sm:text-xl">
                  {item.titolo}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-asfalto/65 dark:text-cemento/65">{item.desc}</p>
                <span className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-asfalto/40 group-hover:text-brand">
                  Scopri →
                </span>
              </Link>
            </Reveal>
          ))}

          <Reveal delay={80}>
            <Link
              href="/accedi#registrati"
              className="landing-garage-core group"
            >
              <IconaGarageLucchetto />
              <h2 className="mt-4 font-display text-2xl font-black uppercase leading-tight tracking-tight text-asfalto group-hover:text-brand dark:text-white sm:text-3xl lg:text-4xl">
                Il tuo garage digitale
              </h2>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-asfalto/65 dark:text-cemento/65">
                Avatar 3D della tua moto, officina virtuale e garage personale — sblocca con un account gratuito.
              </p>
              <span className="mt-5 inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.14em] text-brand">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <rect x="5" y="11" width="14" height="10" rx="2" />
                  <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                </svg>
                Registrati subito
              </span>
            </Link>
          </Reveal>

          {SATELLITI.filter((s) => s.pos !== 'top').map((item, i) => (
            <Reveal key={item.href} delay={120 + i * 40}>
              <Link
                href={item.href}
                className={`landing-garage-sat group ${item.pos === 'left' ? 'landing-garage-sat-left' : 'landing-garage-sat-right'}`}
              >
                <h3 className="font-display text-lg font-bold uppercase tracking-tight group-hover:text-brand sm:text-xl">
                  {item.titolo}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-asfalto/65 dark:text-cemento/65">{item.desc}</p>
                <span className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-asfalto/40 group-hover:text-brand">
                  Scopri →
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
