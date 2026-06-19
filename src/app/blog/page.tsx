import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getArticolo } from '@/lib/supabase';

function formattaData(iso: string): string {
  return new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default async function PaginaArticolo({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const articolo = await getArticolo(id);
  if (!articolo) notFound();

  return (
    <article className="mx-auto max-w-2xl px-4 py-14">
      <Link
        href="/blog"
        className="font-mono text-sm uppercase text-asfalto/60 hover:text-asfalto"
      >
        ← Blog
      </Link>

      <p className="mt-4 font-mono text-xs uppercase tracking-wide text-asfalto/50">
        {articolo.autore?.username ?? 'MotoGarage'}
        {articolo.pubblicato_at && <> · {formattaData(articolo.pubblicato_at)}</>}
      </p>
      <h1 className="mt-1 font-display text-4xl font-bold uppercase leading-tight tracking-tight sm:text-6xl">
        {articolo.titolo}
      </h1>

      <div className="mt-6 whitespace-pre-line text-lg leading-relaxed text-asfalto/85">
        {articolo.contenuto}
      </div>
    </article>
  );
}
