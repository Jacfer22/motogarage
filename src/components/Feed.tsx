'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSupabaseBrowser } from '@/lib/supabase-browser';
import BottoneLike from './BottoneLike';

type VoceFeed =
  | { tipo: 'foto'; id: string; quando: string; autore: string; url: string; didascalia: string | null; itinerario: { slug: string; titolo: string } | null }
  | { tipo: 'commento'; id: string; quando: string; autore: string; testo: string; itinerario: { slug: string; titolo: string } | null }
  | { tipo: 'giro'; id: string; quando: string; autore: string; nome: string; km: number; curve: number };

function tempoFa(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const ore = Math.floor(diff / 3600000);
  if (ore < 1) return 'poco fa';
  if (ore < 24) return `${ore}h fa`;
  const giorni = Math.floor(ore / 24);
  if (giorni < 7) return `${giorni}g fa`;
  return new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
}

export default function Feed() {
  const [voci, setVoci] = useState<VoceFeed[] | null>(null);

  useEffect(() => {
    async function carica() {
      const supabase = getSupabaseBrowser();
      const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
      if (!supabase) {
        setVoci([]);
        return;
      }

      const [foto, commenti, giri] = await Promise.all([
        supabase
          .from('foto')
          .select('id, storage_path, didascalia, created_at, autore:profiles(username), itinerario:itinerari(slug, titolo)')
          .order('created_at', { ascending: false })
          .limit(15),
        supabase
          .from('commenti')
          .select('id, testo, created_at, autore:profiles(username), itinerario:itinerari(slug, titolo)')
          .order('created_at', { ascending: false })
          .limit(15),
        supabase
          .from('giri')
          .select('id, nome, km, curve, created_at, autore:profiles(username)')
          .eq('pubblico', true)
          .order('created_at', { ascending: false })
          .limit(15),
      ]);

      const v: VoceFeed[] = [];
      for (const f of (foto.data ?? []) as unknown as Array<Record<string, unknown>>) {
        v.push({
          tipo: 'foto',
          id: f.id as string,
          quando: f.created_at as string,
          autore: ((f.autore as { username?: string })?.username) ?? 'biker',
          url: `${base}/storage/v1/object/public/foto-bikers/${f.storage_path as string}`,
          didascalia: (f.didascalia as string) ?? null,
          itinerario: (f.itinerario as { slug: string; titolo: string }) ?? null,
        });
      }
      for (const c of (commenti.data ?? []) as unknown as Array<Record<string, unknown>>) {
        v.push({
          tipo: 'commento',
          id: c.id as string,
          quando: c.created_at as string,
          autore: ((c.autore as { username?: string })?.username) ?? 'biker',
          testo: c.testo as string,
          itinerario: (c.itinerario as { slug: string; titolo: string }) ?? null,
        });
      }
      for (const g of (giri.data ?? []) as unknown as Array<Record<string, unknown>>) {
        v.push({
          tipo: 'giro',
          id: g.id as string,
          quando: g.created_at as string,
          autore: ((g.autore as { username?: string })?.username) ?? 'biker',
          nome: (g.nome as string) ?? 'Giro libero',
          km: Number(g.km) || 0,
          curve: Number(g.curve) || 0,
        });
      }

      v.sort((a, b) => new Date(b.quando).getTime() - new Date(a.quando).getTime());
      setVoci(v.slice(0, 30));
    }
    carica();
  }, []);

  if (voci === null) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton h-20 rounded-app" />
        ))}
      </div>
    );
  }

  if (voci.length === 0) {
    return (
      <div className="rounded-app-lg border border-dashed border-asfalto/25 bg-white/40 p-8 text-center">
        <p className="font-display text-2xl font-bold uppercase tracking-tight text-asfalto/60 dark:text-cemento/65">
          Ancora silenzio in garage
        </p>
        <p className="mt-1 text-sm text-asfalto/70 dark:text-cemento/75">
          Le prime foto, i primi commenti e i primi giri appariranno qui. Comincia tu.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {voci.map((v) => (
        <div key={`${v.tipo}-${v.id}`} className="card-app overflow-hidden p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="font-mono text-xs uppercase tracking-wide text-asfalto/65 dark:text-cemento/70">
              <Link href={`/profilo/${v.autore}`} className="font-medium text-asfalto hover:text-brand hover:underline">
                {v.autore}
              </Link>
              {v.tipo === 'foto' && ' ha aggiunto una foto'}
              {v.tipo === 'commento' && ' ha commentato'}
              {v.tipo === 'giro' && ' ha registrato un giro'}
            </p>
            <span className="shrink-0 font-mono text-[11px] text-asfalto/60 dark:text-cemento/65">{tempoFa(v.quando)}</span>
          </div>

          {v.tipo === 'foto' && (
            <div className="mt-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={v.url} alt={v.didascalia ?? ''} className="max-h-80 w-full rounded-app object-cover" />
              {v.didascalia && <p className="mt-2 text-sm text-asfalto/80">{v.didascalia}</p>}
              <div className="mt-2 flex items-center justify-between">
                {v.itinerario ? (
                  <Link href={`/itinerari/${v.itinerario.slug}`} className="font-mono text-xs uppercase text-bosco hover:underline">
                    → {v.itinerario.titolo}
                  </Link>
                ) : <span />}
                <BottoneLike tipo="foto" contenutoId={v.id} />
              </div>
            </div>
          )}

          {v.tipo === 'commento' && (
            <div className="mt-2">
              <p className="text-sm text-asfalto/85">«{v.testo}»</p>
              {v.itinerario && (
                <Link href={`/itinerari/${v.itinerario.slug}`} className="mt-1 inline-block font-mono text-xs uppercase text-bosco hover:underline">
                  → {v.itinerario.titolo}
                </Link>
              )}
            </div>
          )}

          {v.tipo === 'giro' && (
            <div className="mt-2">
              <div className="flex items-center gap-4">
                <span className="font-display text-3xl font-bold leading-none">{v.km} <span className="text-base">km</span></span>
                {v.curve > 0 && (
                  <span className="font-mono text-sm text-asfalto/70 dark:text-cemento/75">{v.curve} curve</span>
                )}
                <span className="font-display text-lg uppercase tracking-tight text-asfalto/70">{v.nome}</span>
              </div>
              <div className="mt-2 flex justify-end">
                <BottoneLike tipo="giro" contenutoId={v.id} />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
