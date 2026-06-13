import Link from 'next/link';

const ARTICOLI = [
  {
    slug: 'la-braccianese-claudia',
    titolo: 'La Braccianese Claudia: perché è la strada di casa dei romani',
    data: '10 giugno 2026',
    zona: 'Roma Nord-Ovest',
    anteprima:
      'Chilometri di asfalto curato, curve in appoggio sul mare, butteri a cavallo se sei fortunato. La SP3A Braccianese Claudia non fa notizia ma è il posto dove si torna ogni domenica. Ecco perché.',
  },
  {
    slug: 'moto-adventure-lazio',
    titolo: 'Adventure nel Lazio: dove finisce la strada asfaltata',
    data: '2 giugno 2026',
    zona: 'Monti Simbruini',
    anteprima:
      'Non serve l\'Himalaya. A un'ora da Roma ci sono sentieri e strade bianche che mettono alla prova qualsiasi adventure. Una guida ai percorsi misti del Lazio, con consigli su quando andare e cosa portare.',
  },
];

export default function PaginaBlog() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-14">
      <p className="font-mono text-sm uppercase tracking-widest text-cartello">
        GiroSecco
      </p>
      <h1 className="mt-1 font-display text-5xl font-bold uppercase leading-none tracking-tight">
        Blog
      </h1>
      <p className="mt-3 max-w-xl text-asfalto/70">
        Strade, moto e storie da chi guida davvero. Niente recensioni prodotto,
        niente sponsorizzazioni: solo quello che abbiamo visto in sella.
      </p>

      <div className="mt-10 space-y-6">
        {ARTICOLI.map((a) => (
          <article
            key={a.slug}
            className="border-2 border-asfalto bg-white p-6 hover:bg-cemento"
          >
            <p className="font-mono text-xs uppercase tracking-wide text-asfalto/50">
              {a.zona} · {a.data}
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold uppercase leading-tight tracking-tight">
              {a.titolo}
            </h2>
            <p className="mt-3 text-asfalto/80 leading-relaxed">{a.anteprima}</p>
            <p className="mt-4 font-mono text-xs uppercase tracking-wide text-asfalto/40">
              Articolo completo in arrivo
            </p>
          </article>
        ))}
      </div>

      <div className="mt-12 border-2 border-dashed border-asfalto/20 p-6 text-center">
        <p className="font-mono text-xs uppercase tracking-wide text-asfalto/40">
          Prossimamente
        </p>
        <p className="mt-2 font-display text-2xl font-bold uppercase tracking-tight text-asfalto/30">
          Vuoi scrivere un pezzo?
        </p>
        <p className="mt-1 text-sm text-asfalto/40">
          Se hai un giro da raccontare o una storia da strada, scrivici.
        </p>
      </div>

      <p className="mt-8">
        <Link href="/" className="font-mono text-sm uppercase text-asfalto/60 underline hover:text-asfalto">
          ← Torna alla home
        </Link>
      </p>
    </section>
  );
}
