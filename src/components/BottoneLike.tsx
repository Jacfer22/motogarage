'use client';

import { useEffect, useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase-browser';
import { useAuth } from './AuthProvider';

// Cuore con conteggio. Funziona per 'foto' o 'giro'. Ottimistico: aggiorna
// subito la UI e poi sincronizza col database.
export default function BottoneLike({
  tipo,
  contenutoId,
  compatto = false,
}: {
  tipo: 'foto' | 'giro';
  contenutoId: string;
  compatto?: boolean;
}) {
  const { user, nonConfigurato } = useAuth();
  const [conteggio, setConteggio] = useState(0);
  const [mioLike, setMioLike] = useState(false);
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    async function carica() {
      const supabase = getSupabaseBrowser();
      if (!supabase) {
        setPronto(true);
        return;
      }
      // conteggio totale
      const { count } = await supabase
        .from('likes')
        .select('id', { count: 'exact', head: true })
        .eq('tipo', tipo)
        .eq('contenuto_id', contenutoId);
      setConteggio(count ?? 0);

      // ho già messo like?
      if (user) {
        const { data } = await supabase
          .from('likes')
          .select('id')
          .eq('tipo', tipo)
          .eq('contenuto_id', contenutoId)
          .eq('utente_id', user.id)
          .maybeSingle();
        setMioLike(!!data);
      }
      setPronto(true);
    }
    carica();
  }, [tipo, contenutoId, user]);

  async function toggle() {
    const supabase = getSupabaseBrowser();
    if (!supabase) return;
    if (!user && !nonConfigurato) {
      window.location.href = '/accedi#registrati';
      return;
    }
    if (!user) return;

    // aggiornamento ottimistico
    const nuovoStato = !mioLike;
    setMioLike(nuovoStato);
    setConteggio((c) => c + (nuovoStato ? 1 : -1));

    try {
      if (nuovoStato) {
        await supabase.from('likes').insert({
          utente_id: user.id,
          tipo,
          contenuto_id: contenutoId,
        });
      } else {
        await supabase
          .from('likes')
          .delete()
          .eq('utente_id', user.id)
          .eq('tipo', tipo)
          .eq('contenuto_id', contenutoId);
      }
    } catch {
      // in caso di errore, ripristino
      setMioLike(!nuovoStato);
      setConteggio((c) => c + (nuovoStato ? -1 : 1));
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={mioLike ? 'Togli mi piace' : 'Metti mi piace'}
      className={`tap inline-flex items-center gap-1.5 font-mono ${
        compatto ? 'text-xs' : 'text-sm'
      } ${mioLike ? 'text-cartello' : 'text-asfalto/70 hover:text-cartello dark:text-cemento/75'}`}
    >
      <svg
        width={compatto ? 16 : 18}
        height={compatto ? 16 : 18}
        viewBox="0 0 24 24"
        fill={mioLike ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className={mioLike ? 'animate-scale-in' : ''}
      >
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z" />
      </svg>
      {pronto && conteggio > 0 && <span>{conteggio}</span>}
    </button>
  );
}
