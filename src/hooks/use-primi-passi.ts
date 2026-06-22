'use client';

import { useEffect, useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase-browser';

export interface ProgressoPrimiPassi {
  profilo: boolean;
  giro: boolean;
  moto: boolean;
  incompleto: boolean;
}

export function usePrimiPassi(utenteId: string | undefined, profiloOk: boolean) {
  const [progresso, setProgresso] = useState<ProgressoPrimiPassi | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    if (!supabase || !utenteId) {
      setProgresso(null);
      return;
    }

    async function carica() {
      const [giriRes, motoRes] = await Promise.all([
        supabase!.from('giri').select('id', { count: 'exact', head: true }).eq('utente_id', utenteId!),
        supabase!.from('moto').select('id', { count: 'exact', head: true }).eq('utente_id', utenteId!),
      ]);

      const profilo = profiloOk;
      const giro = (giriRes.count ?? 0) > 0;
      const moto = (motoRes.count ?? 0) > 0;
      const incompleto = !profilo || !giro || !moto;

      setProgresso({ profilo, giro, moto, incompleto });
    }

    void carica();
  }, [utenteId, profiloOk]);

  return progresso;
}
