'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import type { GarageMoto } from '@/lib/garage';

const GarageModelViewer = dynamic(() => import('./GarageModelViewer'), { ssr: false });

interface Props {
  username: string;
  moto: GarageMoto[];
}

/** Viewer 3D hero fullscreen per cattura video marketing. */
export default function ReelGarageCapture({ moto }: Props) {
  useEffect(() => {
    document.body.classList.add('nav-fullscreen-active', 'app-immersive-mobile');
    return () => {
      document.body.classList.remove('nav-fullscreen-active', 'app-immersive-mobile');
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-notte">
      <div className="relative min-h-0 flex-1">
        <GarageModelViewer
          moto={moto}
          selezionataId={moto[0]?.id ?? null}
          onSeleziona={() => {}}
          modalitaHero
          modalitaReel
        />
      </div>
    </div>
  );
}
