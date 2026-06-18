import Link from 'next/link';
import { getItinerari, getItinerariConAvvisi } from '@/lib/supabase';
import { accessoItinerario } from '@/lib/accesso';
import { REGIONI } from '@/lib/regioni';
import ItinerarioCard from '@/components/ItinerarioCard';
import Reveal from '@/components/Reveal';

export const revalidate = 3600;

export default async function Home() {
  const [itinerari, idConAvvisi] = await Promise.all([
    getItinerari(),
    getItinerariConAvvisi(),
  ]);
  const kmTotali = itinerari.reduce((acc, i) => acc + i.km, 0);
  const regioniAttive = new Set(itinerari.flatMap((i) => i.regioni ?? [])).size;

  const inEvidenza = [...itinerari]
    .sort((a, b) => {
      const oa = ['aperto', 'registrati', 'pro'].indexOf(accessoItinerario(a, itinerari));
      const ob = ['aperto', 'registrati', 'pro'].indexOf(accessoItinerario(b, itinerari));
      if (oa !== ob) return oa - ob;
      return a.km - b.km;
    })
    .slice(0, 3);

  return (
    <>
      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden bg-notte text-cemento">
        {/* atmosfera: bagliore caldo + griglia topografica tenue */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, #fff 0 1px, transparent 1px 40px), repeating-linear-gradient(90deg, #fff 0 1px, transparent 1px 40px)',
          }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -right-32 -top-32 h-[28rem] w-[28rem] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(242,183,5,0.22), transparent 70%)' }}
          aria-hidden="true"
        />

        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:py-28">
          <p className="animate-fade-up font-mono text-sm uppercase tracking-[0.2em] text-segnale">
            Itinerari moto · Italia
          </p>
          <h1
            className="mt-4 max-w-3xl animate-fade-up font-display text-6xl font-bold uppercase leading-[0.9] tracking-tight sm:text-8xl"
            style={{ animationDelay: '60ms' }}
          >
            Domenica.
            <br />
            Moto.
            <br />
            <span className="text-segnale">Sai già dove.</span>
          </h1>
          <p
            className="mt-6 max-w-xl animate-fade-up text-lg leading-relaxed text-guardrail"
            style={{ animationDelay: '120ms' }}
          >
            Giri in moto regione per regione: la mappa del percorso, le tappe una
            per una, la traccia GPX pronta per il navigatore. Li propone la
            community, le condizioni della strada le teniamo aggiornate.
          </p>
          <div
            className="mt-8 flex flex-wrap gap-3 animate-fade-up"
            style={{ animationDelay: '180ms' }}
          >
            <Link
              href="/itinerari"
              className="tap rounded-app bg-segnale px-6 py-3 font-mono text-sm font-medium uppercase tracking-wide text-asfalto shadow-segnale hover:bg-white"
            >
              Vedi gli itinerari
            </Link>
            <Link
              href="/accedi#registrati"
              className="tap rounded-app border border-guardrail/30 px-6 py-3 font-mono text-sm uppercase tracking-wide text-cemento hover:border-cemento hover:bg-white/5"
            >
              Crea un account
            </Link>
          </div>

          {/* stat: tre tessere con leggera elevazione su vetro */}
          <div
            className="mt-12 grid max-w-2xl grid-cols-3 gap-3 animate-fade-up"
            style={{ animationDelay: '240ms' }}
          >
            {[
              { n: itinerari.length, l: 'itinerari' },
              { n: regioniAttive, l: regioniAttive === 1 ? 'regione' : 'regioni' },
              { n: kmTotali.toLocaleString('it-IT'), l: 'km mappati' },
            ].map((s) => (
              <div
                key={s.l}
                className="rounded-app border border-white/10 bg-white/[0.04] px-4 py-3 backdrop-blur-sm"
              >
                <p className="font-display text-3xl font-bold leading-none text-segnale sm:text-4xl">
                  {s.n}
                </p>
                <p className="mt-1 font-mono text-[11px] uppercase tracking-wide text-guardrail">
                  {s.l}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== COME FUNZIONA ===== */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <Reveal>
          <h2 className="font-display text-sm font-bold uppercase tracking-[0.2em] text-cartello">
            Come funziona
          </h2>
        </Reveal>
        <div className="mt-6 grid gap-5 sm:grid-cols-3">
          {[
            {
              n: '01',
              t: 'Scegli il giro',
              d: 'Per regione, km o difficoltà. Ogni scheda dice quanto dura e cosa aspettarti.',
            },
            {
              n: '02',
              t: 'Porta la traccia',
              d: 'Scarica il GPX per il navigatore, o segui il percorso sul sito con la tua posizione live.',
            },
            {
              n: '03',
              t: 'Parti',
              d: 'Roadbook tappa per tappa: dove curva bene, dove si mangia, dove fare benzina.',
            },
          ].map((p, i) => (
            <Reveal key={p.n} delay={i * 90}>
              <div className="card-app h-full p-6">
                <p className="font-display text-5xl font-bold leading-none text-segnale">
                  {p.n}
                </p>
                <h3 className="mt-3 font-display text-2xl font-bold uppercase tracking-tight">
                  {p.t}
                </h3>
                <p className="mt-2 text-asfalto/70">{p.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ===== ANTEPRIMA ITINERARI ===== */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <Reveal>
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-sm font-bold uppercase tracking-[0.2em] text-cartello">
                Da dove partire
              </h2>
              <p className="mt-1 font-display text-4xl font-bold uppercase tracking-tight">
                I più accessibili
              </p>
            </div>
            <Link
              href="/itinerari"
              className="tap shrink-0 font-mono text-xs uppercase tracking-wide text-asfalto/60 hover:text-asfalto"
            >
              Tutti i {itinerari.length} →
            </Link>
          </div>
        </Reveal>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {inEvidenza.map((i, idx) => (
            <Reveal key={i.id} delay={idx * 90}>
              <ItinerarioCard
                itinerario={i}
                haAvviso={idConAvvisi.has(i.id)}
                accesso={accessoItinerario(i, itinerari)}
              />
            </Reveal>
          ))}
        </div>

        {/* invito esplora regioni */}
        <Reveal>
          <Link
            href="/itinerari"
            className="card-app tap mt-6 flex items-center justify-between gap-4 p-6"
          >
            <div>
              <p className="font-display text-2xl font-bold uppercase tracking-tight">
                Esplora per regione
              </p>
              <p className="mt-1 text-sm text-asfalto/70">
                {REGIONI.length} regioni, {regioniAttive} già con itinerari. Le altre
                arrivano.
              </p>
            </div>
            <span className="font-display text-3xl text-segnale-scuro">→</span>
          </Link>
        </Reveal>
      </section>
    </>
  );
}
