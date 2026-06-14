'use client';

import { useCallback, useEffect, useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase-browser';
import { Foto } from '@/lib/types';
import GalleriaFoto from './GalleriaFoto';
import CaricaFoto from './CaricaFoto';

function urlPubblico(base: string, path: string) {
  return `${base}/storage/v1/object/public/foto-bikers/${path}`;
}

export default function SezioneFotoItinerario({
  itinerarioId,
}: {
  itinerarioId: string;
}) {
  const [foto, setFoto] = useState<Foto[]>([]);
  const [caricato, setCaricato] = useState(false);

  const carica = useCallback(async () => {
    const supabase = getSupabaseBrowser();
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
    if (!supabase) {
      setCaricato(true);
      return;
    }
    const { data } = await supabase
      .from('foto')
      .select('id, autore_id, itinerario_id, storage_path, didascalia, created_at, autore:profiles(username)')
      .eq('itinerario_id', itinerarioId)
      .order('created_at', { ascending: false });

    const righe = (data ?? []) as unknown as Array<Record<string, unknown>>;
    setFoto(
      righe.map((r) => ({
        id: r.id as string,
        autore_id: r.autore_id as string,
        itinerario_id: (r.itinerario_id as string) ?? null,
        url: urlPubblico(base, r.storage_path as string),
        didascalia: (r.didascalia as string) ?? null,
        created_at: r.created_at as string,
        autore: (r.autore as { username: string | null }) ?? null,
      }))
    );
    setCaricato(true);
  }, [itinerarioId]);

  useEffect(() => {
    carica();
  }, [carica]);

  return (
    <section className="mt-12">
      <h2 className="font-display text-sm font-bold uppercase tracking-[0.2em] text-cartello">
        Foto dei Bikers
      </h2>
      <p className="mt-1 font-display text-3xl font-bold uppercase tracking-tight">
        Chi l&apos;ha fatto
      </p>
      <p className="mt-2 text-sm text-asfalto/70">
        Hai fatto questo giro? Aggiungi una tua foto: la vedranno gli altri qui e
        nella galleria della community.
      </p>

      <div className="mt-5">
        <CaricaFoto itinerarioId={itinerarioId} onCaricata={carica} />
      </div>

      <div className="mt-6">
        {!caricato ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton aspect-[4/3] rounded-app" />
            ))}
          </div>
        ) : (
          <GalleriaFoto foto={foto} />
        )}
      </div>
    </section>
  );
}
