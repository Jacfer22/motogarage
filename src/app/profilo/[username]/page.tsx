'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getSupabaseBrowser } from '@/lib/supabase-browser';
import MotoSVG from '@/components/MotoSVG';
import type { TipoMoto } from '@/components/MotoSVG';

interface ProfiloPubblico {
  id: string;
  username: string;
  bio: string | null;
  avatar_url: string | null;
  moto: string | null;
  categoria_moto: string | null;
  moto_tipo: string | null;
  moto_colore_primario: string | null;
  moto_colore_secondario: string | null;
  moto_accessori: string[] | null;
  is_pro: boolean;
}

interface GiroPubblico {
  id: string;
  nome: string;
  km: number;
  curve: number;
  created_at: string;
}

function iniziali(username: string) {
  return username.slice(0, 2).toUpperCase();
}

export default function PaginaProfilo() {
  const params = useParams();
  const username = typeof params.username === 'string' ? params.username : '';
  const [profilo, setProfilo] = useState<ProfiloPubblico | null>(null);
  const [giri, setGiri] = useState<GiroPubblico[]>([]);
  const [caricato, setCaricato] = useState(false);

  useEffect(() => {
    async function carica() {
      const supabase = getSupabaseBrowser();
      if (!supabase || !username) return;
      const { data: p } = await supabase
        .from('profiles')
        .select('id, username, bio, avatar_url, moto, categoria_moto, moto_tipo, moto_colore_primario, moto_colore_secondario, moto_accessori, is_pro')
        .eq('username', username)
        .single();
      if (!p) { setCaricato(true); return; }
      setProfilo(p as ProfiloPubblico);

      const { data: g } = await supabase
        .from('giri')
        .select('id, nome, km, curve, created_at')
        .eq('utente_id', p.id)
        .eq('pubblico', true)
        .order('created_at', { ascending: false })
        .limit(6);
      setGiri((g ?? []) as GiroPubblico[]);
      setCaricato(true);
    }
    carica();
  }, [username]);

  if (!caricato) {
    return (
      <div className="mx-auto max-w-xl px-4 py-14 space-y-4">
        <div className="skeleton h-28 w-28 rounded-full mx-auto" />
        <div className="skeleton h-6 w-40 mx-auto rounded-app" />
        <div className="skeleton h-4 w-64 mx-auto rounded-app" />
      </div>
    );
  }

  if (!profilo) {
    return (
      <div className="mx-auto max-w-xl px-4 py-14 text-center">
        <p className="font-display text-3xl font-bold uppercase tracking-tight text-asfalto/40">Profilo non trovato</p>
        <Link href="/" className="mt-4 inline-block font-mono text-sm uppercase text-bosco hover:underline">← Torna alla home</Link>
      </div>
    );
  }

  const motoTipo = (profilo.moto_tipo as TipoMoto) || 'naked';
  const motorePrimario = profilo.moto_colore_primario || '#F2B705';
  const motoreSecondario = profilo.moto_colore_secondario || '#15181A';
  const motoAccessori = profilo.moto_accessori || [];
  const kmTotali = giri.reduce((s, g) => s + (Number(g.km) || 0), 0);

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      {/* Intestazione profilo */}
      <div className="flex flex-col items-center text-center">
        {/* Avatar circolare */}
        <div className="relative">
          {profilo.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profilo.avatar_url}
              alt={profilo.username}
              className="h-28 w-28 rounded-full object-cover border-4 border-segnale shadow-app"
            />
          ) : (
            <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-segnale bg-asfalto text-cemento shadow-app">
              <span className="font-display text-3xl font-bold">{iniziali(profilo.username)}</span>
            </div>
          )}
          {profilo.is_pro && (
            <span className="absolute -bottom-1 -right-1 rounded-full bg-segnale px-2 py-0.5 font-mono text-[10px] font-medium uppercase text-asfalto">
              Pro
            </span>
          )}
        </div>

        {/* Nome e bio */}
        <h1 className="mt-4 font-display text-4xl font-bold uppercase tracking-tight">
          {profilo.username}
        </h1>
        {profilo.bio && (
          <p className="mt-2 max-w-sm text-asfalto/70 leading-relaxed">{profilo.bio}</p>
        )}
        {(profilo.moto || profilo.categoria_moto) && (
          <p className="mt-1 font-mono text-sm text-asfalto/55 uppercase tracking-wide">
            {[profilo.categoria_moto, profilo.moto].filter(Boolean).join(' · ')}
          </p>
        )}

        {/* Statistiche veloci */}
        {giri.length > 0 && (
          <div className="mt-4 flex gap-6">
            <div className="text-center">
              <p className="font-display text-2xl font-bold">{giri.length}</p>
              <p className="font-mono text-[11px] uppercase text-asfalto/50">giri</p>
            </div>
            <div className="text-center">
              <p className="font-display text-2xl font-bold">{Math.round(kmTotali)}</p>
              <p className="font-mono text-[11px] uppercase text-asfalto/50">km</p>
            </div>
          </div>
        )}
      </div>

      {/* La mia moto (display) */}
      <div className="mt-10">
        <h2 className="font-display text-2xl font-bold uppercase tracking-tight border-b-2 border-asfalto pb-3">
          La sua moto
        </h2>
        <div className="mt-4 rounded-app-lg bg-asfalto p-4 flex items-center justify-center">
          <MotoSVG
            tipo={motoTipo}
            colorePrimario={motorePrimario}
            coloreSecondario={motoreSecondario}
            accessori={motoAccessori}
            className="w-full max-w-sm"
          />
        </div>
        <p className="mt-2 text-center font-mono text-xs uppercase text-asfalto/50 capitalize tracking-wide">
          {motoTipo} · {[...motoAccessori].join(', ') || 'standard'}
        </p>
      </div>

      {/* Giri pubblici */}
      {giri.length > 0 && (
        <div className="mt-10">
          <h2 className="font-display text-2xl font-bold uppercase tracking-tight border-b-2 border-asfalto pb-3">
            Giri condivisi
          </h2>
          <ul className="mt-4 space-y-3">
            {giri.map((g) => (
              <li key={g.id} className="card-app flex items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-mono text-sm font-medium uppercase">{g.nome}</p>
                  <p className="font-mono text-[11px] text-asfalto/50">
                    {new Date(g.created_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
                    {g.curve > 0 ? ` · ${g.curve} curve` : ''}
                  </p>
                </div>
                <p className="font-display text-2xl font-bold shrink-0">
                  {Math.round(g.km)}<span className="text-sm"> km</span>
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
