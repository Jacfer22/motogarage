'use client';

import { useEffect, useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase-browser';
import { useAuth } from './AuthProvider';
import { badgeRaggiunto, prossimoBadge, avanzamento, BADGES } from '@/lib/badge';
import IconaBadgeLivello from './icons/IconaBadgeLivello';

export default function BadgeUtente() {
  const { user, nonConfigurato } = useAuth();
  const [km, setKm] = useState<number | null>(null);

  useEffect(() => {
    async function carica() {
      const supabase = getSupabaseBrowser();
      if (!supabase || !user) {
        setKm(0);
        return;
      }
      const { data } = await supabase.from('giri').select('km').eq('utente_id', user.id);
      const tot = (data ?? []).reduce((acc, r) => acc + (Number(r.km) || 0), 0);
      setKm(Math.round(tot));
    }
    carica();
  }, [user]);

  if (nonConfigurato) return null;
  if (km === null) {
    return <div className="skeleton h-32 rounded-app-lg" />;
  }

  const attuale = badgeRaggiunto(km);
  const prossimo = prossimoBadge(km);
  const perc = avanzamento(km);
  const indiceAttuale = BADGES.findIndex((b) => b.id === attuale.id);

  return (
    <div className={`badge-livello-card badge-livello-rango-${attuale.rango}`}>
      <div className="flex items-start gap-4">
        <div className="badge-livello-emblema shrink-0" aria-hidden="true">
          <IconaBadgeLivello badge={attuale} size="grande" />
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-brand/90">
            Il tuo livello
          </p>
          <p className={`badge-livello-nome font-display font-black uppercase leading-none tracking-tight text-white rango-${attuale.rango}`}>
            {attuale.nome}
          </p>
          <p className="mt-1.5 font-mono text-[11px] text-cemento/55">
            {km.toLocaleString('it-IT')} km registrati
          </p>
        </div>
        <div className="badge-livello-contatore shrink-0 text-right">
          <p className="font-display text-lg font-black leading-none text-brand">{indiceAttuale + 1}</p>
          <p className="font-mono text-[9px] uppercase text-cemento/40">/{BADGES.length}</p>
        </div>
      </div>

      {prossimo ? (
        <div className="mt-4">
          <div className="badge-livello-bar-track h-2 overflow-hidden rounded-full">
            <div
              className="badge-livello-bar-fill h-full rounded-full transition-all duration-700"
              style={{ width: `${perc}%` }}
            />
          </div>
          <div className="mt-2 flex items-center gap-2.5">
            <IconaBadgeLivello badge={prossimo} size="compact" className="opacity-60 shrink-0" />
            <p className="font-mono text-[10px] leading-snug text-cemento/55">
              <span className="text-cemento/75">{perc}%</span>
              {' · '}
              {(prossimo.kmRichiesti - km).toLocaleString('it-IT')} km a{' '}
              <span className="font-bold uppercase text-cemento/80">{prossimo.nome}</span>
            </p>
          </div>
        </div>
      ) : (
        <p className="mt-4 font-mono text-[10px] uppercase tracking-wide text-segnale">
          Divinità del bitume — hai raggiunto il rango massimo
        </p>
      )}
    </div>
  );
}
