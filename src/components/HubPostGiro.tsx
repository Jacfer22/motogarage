'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { getSupabaseBrowser } from '@/lib/supabase-browser';
import { formattaDurata, formattaKmDisplay } from '@/lib/geo';
import { avanzamento, badgeRaggiunto, prossimoBadge } from '@/lib/badge';
import {
  cancellaGiroCelebrato,
  leggiGiroCelebrato,
  type GiroCelebrato,
} from '@/lib/giro-celebrazione';
import IconaBadgeLivello from '@/components/icons/IconaBadgeLivello';

export default function HubPostGiro() {
  const { user, profilo } = useAuth();
  const [giro, setGiro] = useState<GiroCelebrato | null>(null);
  const [kmTotali, setKmTotali] = useState<number | null>(null);

  useEffect(() => {
    const salvato = leggiGiroCelebrato();
    if (salvato) setGiro(salvato);
  }, []);

  useEffect(() => {
    if (!giro) return;
    async function caricaKm() {
      const supabase = getSupabaseBrowser();
      const userId = user?.id;
      if (!supabase || !userId) {
        setKmTotali(0);
        return;
      }
      const { data } = await supabase.from('giri').select('km').eq('utente_id', userId);
      const tot = (data ?? []).reduce((acc, r) => acc + (Number(r.km) || 0), 0);
      setKmTotali(Math.round(tot));
    }
    caricaKm();
  }, [giro, user?.id]);

  if (!giro) return null;

  function chiudi() {
    cancellaGiroCelebrato();
    setGiro(null);
  }

  const idCard = giro.cloudId ?? giro.id;
  const hrefCard = `/giri?apri=${encodeURIComponent(idCard)}`;
  const attuale = kmTotali !== null ? badgeRaggiunto(kmTotali) : null;
  const prossimo = kmTotali !== null ? prossimoBadge(kmTotali) : null;
  const perc = kmTotali !== null ? avanzamento(kmTotali) : null;
  const nomeUtente = profilo?.username ?? 'Motociclista';

  return (
    <section className="hub-post-giro animate-fade-in">
      <button
        type="button"
        onClick={chiudi}
        className="hub-post-giro-chiudi tap"
        aria-label="Chiudi"
      >
        ×
      </button>
      <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-brand">Giro registrato</p>
      <h2 className="mt-1 font-display text-2xl font-black uppercase leading-tight tracking-tight text-white">
        Grande, {nomeUtente}!
      </h2>
      <p className="mt-2 text-sm text-cemento/60">
        Hai appena aggiunto{' '}
        <span className="font-display text-xl font-black text-[#f2b705]">
          {formattaKmDisplay(giro.km)} km
        </span>{' '}
        al tuo storico · {formattaDurata(giro.durataSec)} in sella
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {[
          { l: 'Vel. media', v: `${Math.round(giro.velMediaKmh)} km/h` },
          { l: 'Curve', v: `${giro.curve}` },
        ].map((x) => (
          <div key={x.l} className="rounded-app border border-white/10 bg-white/[0.04] px-2 py-2 text-center">
            <p className="font-mono text-[8px] uppercase text-cemento/45">{x.l}</p>
            <p className="mt-0.5 font-display text-lg font-black text-white">{x.v}</p>
          </div>
        ))}
      </div>

      {attuale && prossimo && perc !== null && (
        <div className="mt-4 flex items-center gap-3 rounded-app border border-brand/20 bg-brand/5 px-3 py-2.5">
          <IconaBadgeLivello badge={attuale} size="compact" />
          <p className="min-w-0 flex-1 font-mono text-[10px] leading-snug text-cemento/60">
            <span className="font-bold uppercase text-cemento/85">{attuale.nome}</span>
            {' · '}
            {perc}% verso {prossimo.nome}
          </p>
        </div>
      )}

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <Link href={hrefCard} className="tap btn-primary text-center">
          Crea la card
        </Link>
        <Link href="/giri" className="tap editor-card-btn-secondary text-center">
          I miei giri
        </Link>
      </div>
    </section>
  );
}
