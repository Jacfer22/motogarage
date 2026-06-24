'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import type { GarageMoto } from '@/lib/garage';
import TuningGarageScene from '@/components/TuningGarageScene';

const GarageModelViewer = dynamic(() => import('@/components/GarageModelViewer'), {
  ssr: false,
  loading: () => <div className="garage-stage-loader" />,
});

interface Props {
  motoPronte: GarageMoto[];
  selezionataId: string | null;
  onSeleziona: (id: string) => void;
  fotoAnteprima?: string | null;
  mostraViewer?: boolean;
  onVetrinaSalvata?: () => void;
  children?: React.ReactNode;
}

export default function GarageAmbiente({
  motoPronte,
  selezionataId,
  onSeleziona,
  fotoAnteprima,
  mostraViewer = true,
  onVetrinaSalvata,
  children,
}: Props) {
  const motoInPalco = useMemo(() => {
    if (motoPronte.length === 0) return [];
    const scelta = selezionataId
      ? motoPronte.find((item) => item.id === selezionataId)
      : motoPronte[0];
    return scelta ? [scelta] : [motoPronte[0]];
  }, [motoPronte, selezionataId]);

  const haModello = mostraViewer && motoInPalco.length > 0;

  return (
    <TuningGarageScene variant="garage" className="garage-tuning-wrap">
      <div className="garage-palco-hero">
        {haModello ? (
          <GarageModelViewer
            moto={motoInPalco}
            selezionataId={selezionataId ?? motoInPalco[0]?.id ?? null}
            onSeleziona={onSeleziona}
            modalitaHero
            motoIdVetrina={motoInPalco[0]?.id ?? null}
            onVetrinaSalvata={onVetrinaSalvata}
          />
        ) : fotoAnteprima ? (
          <div className="garage-anteprima-foto">
            <img src={fotoAnteprima} alt="Anteprima moto" />
            <p className="garage-anteprima-label">In attesa dell&apos;avatar 3D</p>
          </div>
        ) : (
          <div className="garage-palco-vuoto">
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/40">
              Nessuna moto nel garage
            </p>
          </div>
        )}
      </div>

      <div className="garage-ui-layer">{children}</div>
    </TuningGarageScene>
  );
}
