import { createClient } from '@supabase/supabase-js';
import { tracciatoDaDb } from '@/lib/giri-store';
import type { Punto } from '@/lib/geo';

export interface GiroPubblico {
  id: string;
  nome: string;
  km: number;
  durataSec: number;
  velMediaKmh: number;
  velMaxKmh: number;
  dislivelloM: number;
  curve: number;
  punti: Punto[];
  createdAt: string;
  autore: string;
}

export async function getGiroPubblico(id: string): Promise<GiroPubblico | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const supabase = createClient(url, key);
  const { data, error } = await supabase
    .from('giri')
    .select(
      'id, nome, km, durata_sec, vel_media_kmh, vel_max_kmh, dislivello_m, curve, tracciato, created_at, pubblico, autore:profiles(username)',
    )
    .eq('id', id)
    .eq('pubblico', true)
    .maybeSingle();

  if (error || !data) return null;

  const autore = (data.autore as { username?: string } | null)?.username ?? 'biker';

  return {
    id: data.id as string,
    nome: (data.nome as string) ?? 'Giro libero',
    km: Number(data.km),
    durataSec: Number(data.durata_sec) ?? 0,
    velMediaKmh: Number(data.vel_media_kmh) ?? 0,
    velMaxKmh: Number(data.vel_max_kmh) ?? 0,
    dislivelloM: Number(data.dislivello_m) ?? 0,
    curve: Number(data.curve) ?? 0,
    punti: tracciatoDaDb(data.tracciato),
    createdAt: data.created_at as string,
    autore,
  };
}
