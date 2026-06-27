'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { useFeedback } from '@/components/FeedbackProvider';
import { getSupabaseBrowser } from '@/lib/supabase-browser';
import { formattaDurata, formattaKmDisplay } from '@/lib/geo';
import { avanzamento, badgeRaggiunto, prossimoBadge } from '@/lib/badge';
import BloccoGarageBio from './BloccoGarageBio';
import { aggiornaGiroCloud } from '@/lib/giri-store';
import {
  cancellaGiroCelebrato,
  leggiGiroCelebrato,
  type GiroCelebrato,
} from '@/lib/giro-celebrazione';
import IconaBadgeLivello from '@/components/icons/IconaBadgeLivello';

export default function HubPostGiro() {
  const { user, profilo } = useAuth();
  const { toast } = useFeedback();
  const [giro, setGiro] = useState<GiroCelebrato | null>(null);
  const [kmTotali, setKmTotali] = useState<number | null>(null);
  const [pubblico, setPubblico] = useState(false);
  const [pubblicando, setPubblicando] = useState(false);
  const [motoPubblica, setMotoPubblica] = useState(false);

  useEffect(() => {
    const salvato = leggiGiroCelebrato();
    if (salvato) setGiro(salvato);
  }, []);

  useEffect(() => {
    if (!giro) return;
    const cloudId = giro.cloudId;
    async function caricaKm() {
      const supabase = getSupabaseBrowser();
      const userId = user?.id;
      if (!supabase || !userId) {
        setKmTotali(0);
        return;
      }
      const { data } = await supabase.from('giri').select('id, km, pubblico').eq('utente_id', userId);
      const tot = (data ?? []).reduce((acc, r) => acc + (Number(r.km) || 0), 0);
      setKmTotali(Math.round(tot));
      if (cloudId) {
        const riga = (data ?? []).find((r) => r.id === cloudId);
        if (riga?.pubblico) setPubblico(true);
      }
      const { data: moto } = await supabase
        .from('moto')
        .select('is_public, stato')
        .eq('utente_id', userId)
        .eq('is_public', true)
        .eq('stato', 'pronto')
        .limit(1)
        .maybeSingle();
      setMotoPubblica(Boolean(moto));
    }
    caricaKm();
  }, [giro, user?.id]);

  if (!giro) return null;

  function chiudi() {
    cancellaGiroCelebrato();
    setGiro(null);
  }

  async function pubblicaInCommunity() {
    if (!giro?.cloudId) {
      toast('Salvataggio in corso — riprova tra un attimo.', 'info');
      return;
    }
    const supabase = getSupabaseBrowser();
    if (!supabase) return;
    setPubblicando(true);
    try {
      await aggiornaGiroCloud(supabase, giro.cloudId, { pubblico: true });
      setPubblico(true);
      toast('Giro in community! Gli altri rider possono vederlo.', 'ok');
    } catch {
      toast('Non sono riuscito a pubblicare. Riprova.', 'errore');
    } finally {
      setPubblicando(false);
    }
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

      <div className="mt-5 rounded-app border border-white/10 bg-white/[0.03] p-3.5">
        <p className="font-mono text-[10px] uppercase tracking-wide text-brand">Community</p>
        <p className="mt-1 text-sm text-cemento/60">
          {pubblico
            ? 'Il tuo giro è nel feed — gli altri possono vedere km, curve e tracciato.'
            : 'Condividi il giro: è il modo più veloce per far vivere la community.'}
        </p>
        {pubblico ? (
          <Link href="/community" className="tap btn-primary mt-3 inline-block w-full text-center sm:w-auto sm:px-8">
            Vedi nel feed
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => void pubblicaInCommunity()}
            disabled={pubblicando}
            className="tap btn-primary mt-3 w-full sm:w-auto sm:px-8"
          >
            {pubblicando ? 'Pubblico…' : 'Pubblica in community'}
          </button>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Link href={hrefCard} className="tap editor-card-btn-secondary text-center">
          Crea la card
        </Link>
        <Link href="/giri" className="tap editor-card-btn-secondary text-center">
          I miei giri
        </Link>
      </div>

      {profilo?.username && (
        <div className="mt-5 border-t border-white/10 pt-4">
          <p className="font-mono text-[10px] uppercase tracking-wide text-brand">Garage in bio</p>
          <p className="mt-1 text-sm text-cemento/60">
            {pubblico
              ? 'Il tuo garage si è aggiornato: km, badge e ultimo giro sono live nel link.'
              : 'Pubblica il giro e il tuo garage si aggiorna con km e badge nel link bio.'}
          </p>
          <div className="mt-3">
            <BloccoGarageBio
              username={profilo.username}
              motoPubblica={motoPubblica}
              compatto
              kmTotali={kmTotali}
              badgeNome={attuale?.nome ?? null}
            />
          </div>
        </div>
      )}
    </section>
  );
}
