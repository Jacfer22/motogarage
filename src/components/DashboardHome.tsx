'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from './AuthProvider';
import { getSupabaseBrowser } from '@/lib/supabase-browser';
import { etichettaCategoria } from '@/lib/categorie-moto';
import { caricaGiriUtente, type GiroUtente } from '@/lib/giri-store';
import { nomeMoto, urlModello } from '@/lib/garage';
import { formattaKmDisplay } from '@/lib/geo';
import ChecklistHub from './ChecklistHub';
import BadgeUtente from './BadgeUtente';
import Reveal from './Reveal';

interface AnteprimaMoto {
  id: string;
  nome: string;
  fotoUrl: string | null;
  haModello3d: boolean;
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

  useEffect(() => {
    if (!user) return;
    const supabase = getSupabaseBrowser();
    if (!supabase) return;

    caricaGiriUtente(supabase, user.id).then((giri) => {
      setUltimoGiro(giri[0] ?? null);
    });

    supabase
      .from('moto')
      .select('id, marca, modello, foto_sx_url, glb_url, model_url, stato, vetrina_url, updated_at')
      .eq('utente_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(async ({ data }) => {
        if (!data) {
          setMoto(null);
          return;
        }
        let fotoUrl: string | null = null;
        const pathAnteprima = data.vetrina_url ?? data.foto_sx_url;
        if (pathAnteprima) {
          const { data: signed } = await supabase.storage
            .from('foto-moto')
            .createSignedUrl(pathAnteprima, 3600);
          fotoUrl = signed?.signedUrl ?? null;
        }
        const haModello3d = data.stato === 'pronto' && Boolean(urlModello(data));
        setMoto({
          id: data.id,
          nome: nomeMoto(data),
          fotoUrl,
          haModello3d,
        });
      });
  }, [user]);

  if (!user) return null;

  const categoria = etichettaCategoria(profilo?.categoria_moto ?? null);

  return (
    <div className="dash-home pb-8">
      <Reveal>
        <header className="dash-header">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-brand">{salutoGiorno()}</p>
            <h1 className="font-display text-3xl font-black uppercase leading-none tracking-tight text-white">
              {profilo?.username ?? 'Motociclista'}
            </h1>
            {(categoria || profilo?.moto) && (
              <p className="mt-1 font-mono text-[11px] text-cemento/50">
                {[categoria, profilo?.moto].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
          <Link href="/account" className="dash-avatar" title="Profilo">
            {profilo?.avatar_url ? (
              <img src={profilo.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
            ) : (
              <span>{(profilo?.username ?? 'M').slice(0, 1).toUpperCase()}</span>
            )}
          </Link>
        </header>
      </Reveal>

      <ChecklistHub
        utenteId={user.id}
        profiloOk={Boolean(profilo?.username?.trim())}
      />

      {/* Hero: Il mio garage (profilo moto) */}
      <Reveal delay={60}>
        <Link href="/garage" className="dash-card dash-card-hero dash-card-garage group">
          <p className="dash-card-label">Il mio garage</p>
          <div className="dash-garage-visual">
            {moto?.fotoUrl ? (
              <img src={moto.fotoUrl} alt="" className="h-full w-full object-cover" />
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
                {moto?.haModello3d ? 'Modello 3D · tap per entrare' : 'Tap per creare avatar 3D'}
              </p>
            </div>
            <Chevron />
          </div>
        </Link>
      </Reveal>

      {/* Griglia 2x2: Giri + Traccia + Itinerari + Community */}
      <div className="dash-grid-2 mt-3">
        <Reveal delay={100}>
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

        <Reveal delay={120}>
          <Link href="/traccia" className="dash-card dash-card-half dash-card-traccia group">
            <p className="dash-card-label">Traccia un giro</p>
            <div className="flex flex-1 flex-col items-center justify-center py-4">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ED2100" strokeWidth="2" aria-hidden="true">
                <circle cx="6" cy="18" r="2" />
                <circle cx="18" cy="6" r="2" />
                <path d="M8 16c3-4 5-6 10-8" />
              </svg>
              <p className="mt-3 text-center font-display text-lg font-black uppercase leading-tight text-white">
                GPS live
              </p>
              <p className="mt-1 font-mono text-[9px] uppercase tracking-wide text-cemento/45">Card · stats</p>
            </div>
            <div className="dash-card-foot compact justify-end">
              <Chevron />
            </div>
          </Link>
        </Reveal>

        <Reveal delay={140}>
          <Link href="/itinerari" className="dash-card dash-card-half dash-card-link group">
            <div className="flex items-center gap-3">
              <span className="dash-icon-wrap">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M4 22 9 2" /><path d="M20 22 15 2" />
                </svg>
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-base font-bold uppercase text-white">Itinerari</p>
                <p className="text-[11px] leading-snug text-cemento/50">Mappe, tappe, GPX verificati</p>
              </div>
              <Chevron />
            </div>
          </Link>
        </Reveal>

        <Reveal delay={160}>
          <Link href="/community" className="dash-card dash-card-half dash-card-link group">
            <div className="flex items-center gap-3">
              <span className="dash-icon-wrap">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <circle cx="8.5" cy="10" r="1.5" />
                </svg>
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-base font-bold uppercase text-white">Community</p>
                <p className="text-[11px] leading-snug text-cemento/50">Foto, giri, commenti</p>
              </div>
              <Chevron />
            </div>
          </Link>
        </Reveal>
      </div>

      {/* Navigatore + Classifica */}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <Reveal delay={180}>
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
        <Reveal delay={200}>
          <Link href="/community/classifica" className="dash-card dash-card-pill group">
            <span className="dash-icon-wrap sm">🏆</span>
            <span className="font-display text-sm font-bold uppercase text-white">Classifica km</span>
            <Chevron />
          </Link>
        </Reveal>
      </div>

      <Reveal delay={220}>
        <div className="mt-5">
          <BadgeUtente />
        </div>
      </Reveal>
    </div>
  );
}
