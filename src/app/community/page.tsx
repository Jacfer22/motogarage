import Feed from '@/components/Feed';
import Reveal from '@/components/Reveal';

export const metadata = {
  title: 'Community — MotoGarage',
  description: 'Le ultime foto, i commenti e i giri della community di MotoGarage.',
};

export default function PaginaCommunity() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <Reveal>
        <p className="font-mono text-sm uppercase tracking-[0.2em] text-cartello">In sella ora</p>
        <h1 className="mt-1 font-display text-5xl font-bold uppercase leading-none tracking-tight sm:text-6xl">
          La community
        </h1>
        <p className="mt-4 text-lg text-asfalto/75">
          Foto, commenti e giri appena registrati dai biker. Quello che succede,
          mentre succede.
        </p>
      </Reveal>
      <div className="mt-8">
        <Feed />
      </div>
    </div>
  );
}
