'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from './AuthProvider';
import { getSupabaseBrowser } from '@/lib/supabase-browser';
import { etichettaCategoria } from '@/lib/categorie-moto';
import { caricaGiriUtente, type GiroUtente } from '@/lib/giri-store';
import { nomeMoto, urlModello } from '@/lib/garage';
import { formattaKmDisplay } from '@/lib/geo';
import { badgeRaggiunto } from '@/lib/badge';
import ChecklistHub from './ChecklistHub';
import BadgeUtente from './BadgeUtente';
import Reveal from './Reveal';
import IconaGpsLive from './icons/IconaGpsLive';
import BloccoGarageBio from './BloccoGarageBio';
import NotificheKmSettimana from './NotificheKmSettimana';
import LogoHomeLink from './LogoHomeLink';
import HubPostGiro from './HubPostGiro';
import CommunityInvitoHub from './CommunityInvitoHub';

interface AnteprimaMoto {
  id: string;
  nome: string;
  vetrinaUrl: string | null;
  fotoSxUrl: string | null;
  haModello3d: boolean;
  haVetrina: boolean;
  isPublic: boolean;
}

function salutoGiorno() {
  const h = new Date().getHours();
  if (h < 12) return 'Buongiorno';
  if (h < 18) return 'Buon pomeriggio';
  return 'Buonasera';
}

function MappaGiroMini({ punti }: { punti: { lat: number; lng: number }[] }) {
  if (punti.length < 2) {
    return (
      <div className="dash-giro-map flex items-center justify-center">
        <span className="font-mono text-[10px] uppercase text-cemento/40">Nessun tracciato</span>
      </div>
    );
  }

  const lats = punti.map((p) => p.lat);
  const lngs = punti.map((p) => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const pad = 0.08;
  const dLat = maxLat - minLat || 0.01;
  const dLng = maxLng - minLng || 0.01;

  const toXY = (p: { lat: number; lng: number }) => {
    const x = 20 + ((p.lng - minLng) / dLng) * 360;
    const y = 20 + (1 - (p.lat - minLat) / dLat) * 160;
    return `${x},${y}`;
  };

  const pathD = punti.map(toXY).join(' L ');

  return (
    <div className="dash-giro-map">
      <svg viewBox="0 0 400 200" className="h-full w-full" aria-hidden="true">
        <path d={`M ${pathD}`} fill="none" stroke="rgba(0,0,0,0.45)" strokeWidth="12" strokeLinecap="round" />
        <path d={`M ${pathD}`} fill="none" stroke="#f2b705" strokeWidth="8" strokeLinecap="round" />
        <path d={`M ${pathD}`} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function Chevron() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-brand" aria-hidden="true">
      <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function DashboardHome() {
  const { user, profilo } = useAuth();
  const [ultimoGiro, setUltimoGiro] = useState<GiroUtente | null>(null);
  const [moto, setMoto] = useState<AnteprimaMoto | null>(null);
  const [kmGarage, setKmGarage] = useState<number | null>(null);
  const [badgeGarage, setBadgeGarage] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const supabase = getSupabaseBrowser();
    if (!supabase) return;

    caricaGiriUtente(supabase, user.id).then((giri) => {
      setUltimoGiro(giri[0] ?? null);
      const tot = giri.reduce((acc, g) => acc + (Number(g.km) || 0), 0);
      const km = Math.round(tot);
      setKmGarage(km);
      setBadgeGarage(badgeRaggiunto(km).nome);
    });

    supabase
      .from('moto')
      .select('id, marca, modello, foto_sx_url, glb_url, model_url, stato, vetrina_url, is_public, updated_at')
      .eq('utente_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(async ({ data }) => {
        if (!data) {
          setMoto(null);
          return;
        }
        let vetrinaUrl: string | null = null;
        let fotoSxUrl: string | null = null;
        if (data.vetrina_url) {
          const { data: signed } = await supabase.storage
            .from('foto-moto')
            .createSignedUrl(data.vetrina_url, 3600);
          vetrinaUrl = signed?.signedUrl
            ? `${signed.signedUrl}&v=${encodeURIComponent(data.updated_at ?? '')}`
            : null;
        }
        if (data.foto_sx_url) {
          const { data: signed } = await supabase.storage
            .from('foto-moto')
            .createSignedUrl(data.foto_sx_url, 3600);
          fotoSxUrl = signed?.signedUrl ?? null;
        }
        const haModello3d = data.stato === 'pronto' && Boolean(urlModello(data));
        const haVetrina = Boolean(data.vetrina_url);
        setMoto({
          id: data.id,
          nome: nomeMoto(data),
          vetrinaUrl,
          fotoSxUrl,
          haModello3d,
          haVetrina,
          isPublic: Boolean(data.is_public),
        });
      });
  }, [user]);

  if (!user) return null;

  const categoria = etichettaCategoria(profilo?.categoria_moto ?? null);
  const anteprimaGarage = moto?.vetrinaUrl ?? moto?.fotoSxUrl ?? null;

  return (
    <div className="dash-home pb-8">
      <Reveal>
        <header className="dash-hero-top">
          <LogoHomeLink grande className="dash-hero-logo" />
          <Link href="/account" className="dash-avatar" title="Profilo">
            {profilo?.avatar_url ? (
              <img src={profilo.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
            ) : (
              <span>{(profilo?.username ?? 'M').slice(0, 1).toUpperCase()}</span>
            )}
          </Link>
          <div className="dash-hero-user">
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-brand">{salutoGiorno()}</p>
            <h1 className="dash-hero-username font-display font-black uppercase leading-none tracking-tight text-white">
              {profilo?.username ?? 'Motociclista'}
            </h1>
            {(categoria || profilo?.moto) && (
              <p className="mt-1.5 font-mono text-xs text-cemento/55">
                {[categoria, profilo?.moto].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
        </header>
      </Reveal>

      <Reveal delay={40}>
        <HubPostGiro />
      </Reveal>

      <Reveal delay={50}>
        <CommunityInvitoHub utenteId={user.id} />
      </Reveal>

      <ChecklistHub
        utenteId={user.id}
        profiloOk={Boolean(profilo?.username?.trim())}
      />

      <NotificheKmSettimana utenteId={user.id} />

      {/* Il tuo livello */}
      <Reveal delay={60}>
        <BadgeUtente />
      </Reveal>

      {/* I miei giri + Traccia un giro */}
      <div className="dash-grid-2 mt-3">
        <Reveal delay={80}>
          <Link href="/giri" className="dash-card dash-card-half dash-card-giri group">
            <p className="dash-card-label">I miei giri</p>
            <MappaGiroMini punti={ultimoGiro?.punti ?? []} />
            <div className="dash-card-foot compact">
              {ultimoGiro ? (
                <>
                  <p className="font-display text-2xl font-black text-[#f2b705]">{formattaKmDisplay(ultimoGiro.km)} km</p>
                  <p className="font-mono text-[10px] uppercase text-cemento/55">{ultimoGiro.nome}</p>
                </>
              ) : (
                <p className="text-sm text-cemento/50">Nessun giro ancora</p>
              )}
              <Chevron />
            </div>
          </Link>
        </Reveal>

        <Reveal delay={100}>
          <Link href="/traccia" className="dash-card dash-card-half dash-card-traccia group">
            <p className="dash-card-label">Traccia un giro</p>
            <div className="flex flex-1 flex-col items-center justify-center py-4">
              <IconaGpsLive size={36} className="text-brand" />
              <p className="mt-3 text-center font-display text-lg font-black uppercase leading-tight text-white">
                GPS live
              </p>
              <p className="mt-1 font-mono text-[9px] uppercase tracking-wide text-cemento/45">Card · stats</p>
            </div>
          </Link>
        </Reveal>
      </div>

      {/* Itinerari + Community (stessa altezza dei giri) */}
      <div className="dash-grid-2 mt-3">
        <Reveal delay={120}>
          <Link href="/itinerari" className="dash-card dash-card-half dash-card-tile group">
            <p className="dash-card-label">Itinerari</p>
            <div className="dash-tile-body">
              <span className="dash-icon-wrap lg">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M4 22 9 2" /><path d="M20 22 15 2" />
                </svg>
              </span>
              <p className="mt-3 font-display text-lg font-black uppercase leading-tight text-white">Itinerari</p>
              <p className="mt-1 text-center font-mono text-[9px] uppercase tracking-wide text-cemento/45">Mappe · GPX · tappe</p>
            </div>
          </Link>
        </Reveal>

        <Reveal delay={140}>
          <Link href="/community" className="dash-card dash-card-half dash-card-tile dash-card-community group">
            <p className="dash-card-label">Community</p>
            <div className="dash-tile-body">
              <span className="dash-icon-wrap lg">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <circle cx="8.5" cy="10" r="1.5" />
                  <path d="M14 9h4M14 12h3" strokeLinecap="round" />
                </svg>
              </span>
              <p className="mt-3 font-display text-lg font-black uppercase leading-tight text-white">Community</p>
              <p className="mt-1 text-center font-mono text-[9px] uppercase tracking-wide text-cemento/45">Pubblica · scopri · reagisci</p>
            </div>
          </Link>
        </Reveal>
      </div>

      {/* Navigatore + Classifica km */}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <Reveal delay={160}>
          <Link href="/naviga" className="dash-card dash-card-pill group">
            <span className="dash-icon-wrap sm">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <polygon points="12,5 14,13 12,11 10,13" fill="currentColor" />
              </svg>
            </span>
            <span className="font-display text-sm font-bold uppercase text-white">Navigatore</span>
            <Chevron />
          </Link>
        </Reveal>
        <Reveal delay={180}>
          <Link href="/community/classifica" className="dash-card dash-card-pill group">
            <span className="dash-icon-wrap sm">🏆</span>
            <span className="font-display text-sm font-bold uppercase text-white">Classifica km</span>
            <Chevron />
          </Link>
        </Reveal>
      </div>

      {/* Il mio garage */}
      <Reveal delay={200}>
        <Link href="/garage" className="dash-card dash-card-hero dash-card-garage group mt-3">
          <p className="dash-card-label">Il mio garage</p>
          <div className="dash-garage-visual">
            {anteprimaGarage ? (
              <img
                src={anteprimaGarage}
                alt=""
                className="h-full w-full object-contain"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-cemento/40">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z" />
                </svg>
                <span className="font-mono text-[10px] uppercase">Aggiungi moto</span>
              </div>
            )}
          </div>
          <div className="dash-card-foot">
            <div>
              <p className="font-display text-xl font-black uppercase leading-tight text-white">
                {moto?.nome ?? 'Garage vuoto'}
              </p>
              <p className="mt-1 font-mono text-[10px] uppercase text-cemento/50">
                {moto?.haVetrina
                  ? 'Vetrina · tap per entrare'
                  : moto?.haModello3d
                    ? 'Modello 3D · tap per entrare'
                    : 'Tap per creare avatar 3D'}
              </p>
            </div>
            <Chevron />
          </div>
        </Link>
      </Reveal>

      {/* Garage live · link in bio */}
      {profilo?.username && (
        <Reveal delay={220}>
          <div className="mt-3">
            <BloccoGarageBio
              username={profilo.username}
              motoPubblica={moto?.isPublic ?? false}
              compatto
              kmTotali={kmGarage}
              badgeNome={badgeGarage}
            />
          </div>
        </Reveal>
      )}
    </div>
  );
}
