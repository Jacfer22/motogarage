'use client';

import { useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formattaDurata, formattaKmDisplay } from '@/lib/geo';
import type { GiroUtente } from '@/lib/giri-store';
import { salvaGiroCelebrato } from '@/lib/giro-celebrazione';
import CelebrazioneGiro from '@/components/CelebrazioneGiro';

interface Props {
  giro: GiroUtente;
  durataSec: number;
}

export default function RedirectPostGiro({ giro, durataSec }: Props) {
  const router = useRouter();

  useEffect(() => {
    salvaGiroCelebrato({
      id: giro.id,
      cloudId: giro.cloudId,
      nome: giro.nome,
      km: giro.km,
      durataSec: giro.durataSec,
      velMediaKmh: giro.velMediaKmh,
      curve: giro.curve,
      timestamp: Date.now(),
    });
  }, [giro]);

  const vaiHub = useCallback(() => {
    router.replace('/hub');
  }, [router]);

  const km = formattaKmDisplay(giro.km);

  return (
    <CelebrazioneGiro
      titolo="Congratulazioni!"
      sottotitolo={`${km} km · ${formattaDurata(durataSec)} in sella`}
      onFine={vaiHub}
    />
  );
}
