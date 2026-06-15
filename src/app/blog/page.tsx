import Link from 'next/link';
import { getArticoliPubblicati } from '@/lib/supabase';

export const revalidate = 300;

function formattaData(iso: string): string {
  return new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default async function PaginaBlog() {
  const articoli = await getArticoliPubblicati();

  return (
    <section className="mx-auto max-w-4xl px-4 py-14">
      <p className="font-mono text-sm uppercase tracking-widest text-cartello">GiroSecco</p>
      <h1 className="mt-1 font-display text-5xl font-bold uppercase leading-none tracking-tight">
        Blog
      </h1>
      <p className="mt-3 max-w-xl text-asfalto/70">
        Strade, moto e storie da chi guida. Scritto dalla community e
        revisionato prima della pubblicazione.
      </p>

      <div className="mt-6 border-2 border-asfalto bg-asfalto p-5 text-cemento">
        <p className="font-display text-xl font-bold uppercase tracking-tight">
          Hai un giro da raccontare?
        </p>
        <p className="mt-1 text-sm text-guardrail">
          Se hai un account puoi scrivere un articolo. Lo leggiamo e, se va
          bene, lo pubblichiamo qui col tuo nome.
        </p>
        <Link
          href="/blog/nuovo"
          className="mt-3 inline-block bg-segnale px-4 py-2 font-mono text-sm font-medium uppercase text-asfalto hover:bg-white"
        >
          Scrivi un articolo
        </Link>
      </div>

      {articoli.length === 0 ? (
        <div className="mt-10 border-2 border-dashed border-asfalto/25 p-8 text-center">
          <p className="font-display text-2xl font-bold uppercase tracking-tight text-asfalto/40">
            Ancora nessun articolo
          </p>
          <p className="mt-1 text-sm text-asfalto/50">
            I primi pezzi della community arrivano presto. Vuoi essere il primo?
          </p>
        </div>
      ) : (
        <div className="mt-10 space-y-6">
          {articoli.map((a) => (
            <article key={a.id} className="border-2 border-asfalto bg-white p-6 hover:bg-cemento">
              <p className="font-mono text-xs uppercase tracking-wide text-asfalto/50">
                {a.autore?.username ?? 'GiroSecco'}
                {a.pubblicato_at && <> · {formattaData(a.pubblicato_at)}</>}
              </p>
              <h2 className="mt-2 font-display text-3xl font-bold uppercase leading-tight tracking-tight">
                <Link href={`/blog/${a.id}`} className="hover:underline">
                  {a.titolo}
                </Link>
              </h2>
              <p className="mt-3 line-clamp-3 leading-relaxed text-asfalto/80">{a.contenuto}</p>
              <Link
                href={`/blog/${a.id}`}
                className="mt-3 inline-block font-mono text-xs uppercase tracking-wide text-asfalto/50 underline hover:text-asfalto"
              >
                Leggi tutto →
              </Link>
            </article>
          ))}
        </div>
      )}

      <p className="mt-12">
        <Link href="/itinerari" className="font-mono text-sm uppercase text-asfalto/60 underline hover:text-asfalto">
          ← Torna agli itinerari
        </Link>
      </p>
    </section>
  );
}
