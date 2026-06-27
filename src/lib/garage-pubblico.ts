import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { adminClient } from '@/lib/garage-server-auth';
import { badgeRaggiunto, prossimoBadge, avanzamento, type Badge } from '@/lib/badge';
import type { GarageMoto } from '@/lib/garage';
import { supabaseAnonKey, supabaseUrlServer } from '@/lib/env-server';

export interface ProfiloGaragePubblico {
  id: string;
  username: string;
  bio: string | null;
  avatar_url: string | null;
  moto: string | null;
  categoria_moto: string | null;
}

export interface GiroGaragePubblico {
  id: string;
  nome: string;
  km: number;
  curve: number;
  created_at: string;
}

export interface StatisticheGaragePubblico {
  kmTotali: number;
  numGiri: number;
  numGiriPubblici: number;
  badge: Badge;
  prossimoBadge: Badge | null;
  avanzamentoPerc: number;
  ultimoGiro: GiroGaragePubblico | null;
}

export interface DatiGaragePubblico {
  profilo: ProfiloGaragePubblico;
  moto: GarageMoto[];
  stats: StatisticheGaragePubblico;
  vetrinaAnteprima: string | null;
}

function clientAnon(): SupabaseClient | null {
  const url = supabaseUrlServer();
  const key = supabaseAnonKey();
  if (!url || !key) return null;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

function clientStats(): SupabaseClient | null {
  try {
    return adminClient();
  } catch {
    return clientAnon();
  }
}

async function firmaVetrina(
  supabase: SupabaseClient,
  moto: GarageMoto[],
): Promise<string | null> {
  const conVetrina = moto.find((m) => m.vetrina_url);
  if (!conVetrina?.vetrina_url) return null;
  const { data } = await supabase.storage
    .from('foto-moto')
    .createSignedUrl(conVetrina.vetrina_url, 3600);
  return data?.signedUrl ?? null;
}

async function caricaStatistiche(
  supabase: SupabaseClient,
  utenteId: string,
): Promise<StatisticheGaragePubblico> {
  const { data } = await supabase
    .from('giri')
    .select('id, nome, km, curve, created_at, pubblico')
    .eq('utente_id', utenteId)
    .order('created_at', { ascending: false });

  const rows = data ?? [];
  const kmTotali = Math.round(rows.reduce((s, g) => s + (Number(g.km) || 0), 0));
  const pubblici = rows.filter((g) => g.pubblico);
  const ultimo = pubblici[0] ?? null;

  return {
    kmTotali,
    numGiri: rows.length,
    numGiriPubblici: pubblici.length,
    badge: badgeRaggiunto(kmTotali),
    prossimoBadge: prossimoBadge(kmTotali),
    avanzamentoPerc: avanzamento(kmTotali),
    ultimoGiro: ultimo
      ? {
          id: ultimo.id,
          nome: ultimo.nome,
          km: Number(ultimo.km) || 0,
          curve: Number(ultimo.curve) || 0,
          created_at: ultimo.created_at,
        }
      : null,
  };
}

export async function caricaGaragePubblico(username: string): Promise<DatiGaragePubblico | null> {
  const supabase = clientAnon();
  if (!supabase) return null;

  const { data: profilo } = await supabase
    .from('profiles')
    .select('id, username, bio, avatar_url, moto, categoria_moto')
    .eq('username', username)
    .maybeSingle();
  if (!profilo) return null;

  const { data: motoRaw } = await supabase
    .from('moto')
    .select('*')
    .eq('utente_id', profilo.id)
    .eq('is_public', true)
    .eq('stato', 'pronto')
    .or('model_url.not.is.null,glb_url.not.is.null')
    .order('created_at', { ascending: false });

  const moto = (motoRaw ?? []) as GarageMoto[];
  const statsClient = clientStats() ?? supabase;
  const stats = await caricaStatistiche(statsClient, profilo.id);
  const vetrinaAnteprima = await firmaVetrina(supabase, moto);

  return {
    profilo: profilo as ProfiloGaragePubblico,
    moto,
    stats,
    vetrinaAnteprima,
  };
}
