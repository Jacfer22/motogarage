'use client';

import dynamic from 'next/dynamic';
import type { GarageMoto } from '@/lib/garage';
import { isGaussianSplat } from '@/lib/garage';

const Garage3D = dynamic(() => import('./Garage3D'), { ssr: false });
const GaussianGarage = dynamic(() => import('./GaussianGarage'), { ssr: false });

interface Props {
  moto: GarageMoto[];
  selezionataId: string | null;
  onSeleziona: (id: string) => void;
  modalitaViewer?: boolean;
}

export default function GarageModelViewer({ moto, selezionataId, onSeleziona, modalitaViewer = false }: Props) {
  const selezionata = moto.find((item) => item.id === selezionataId) ?? moto[0] ?? null;
  const splat = selezionata && isGaussianSplat(selezionata);

  if (splat) {
    const splats = modalitaViewer ? [selezionata] : moto.filter(isGaussianSplat);
    return <GaussianGarage moto={splats} selezionataId={selezionata.id} modalitaViewer={modalitaViewer} />;
  }

  return <Garage3D moto={moto} selezionataId={selezionataId} onSeleziona={onSeleziona} modalitaViewer={modalitaViewer} />;
}
