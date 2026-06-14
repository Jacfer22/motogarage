import { getFoto } from '@/lib/supabase';
import GalleriaFoto from '@/components/GalleriaFoto';
import CaricaFoto from '@/components/CaricaFoto';
import Reveal from '@/components/Reveal';

export const revalidate = 60;

export const metadata = {
  title: 'Foto dei Bikers — GiroSecco',
  description:
    'Le foto scattate in sella dalla community: strade, panorami e moto lungo gli itinerari di GiroSecco.',
};

export default async function PaginaFoto() {
  const foto = await getFoto(80);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <Reveal>
        <p className="font-mono text-sm uppercase tracking-[0.2em] text-cartello">Community</p>
        <h1 className="mt-1 font-display text-5xl font-bold uppercase leading-none tracking-tight sm:text-7xl">
          Foto dei Bikers
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-asfalto/75">
          Gli scatti della community lungo le strade. Una curva venuta bene, un
          panorama, la moto al valico. Carica i tuoi: appariranno qui e
          sull&apos;itinerario che hai fatto.
        </p>
      </Reveal>

      <Reveal>
        <div className="mt-8">
          <CaricaFoto />
        </div>
      </Reveal>

      <Reveal>
        <div className="mt-10">
          <GalleriaFoto foto={foto} mostraItinerario />
        </div>
      </Reveal>
    </div>
  );
}
