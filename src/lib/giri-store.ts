import type { SupabaseClient } from '@supabase/supabase-js';
import type { Punto } from '@/lib/geo';

const STORAGE_KEY = 'motogarage_giri';

export interface GiroUtente {
  id: string;
  cloudId: string | null;
  nome: string;
  data: string;
  km: number;
  durataSec: number;
  punti: Punto[];
  velMediaKmh: number;
  velMaxKmh: number;
  dislivelloM: number;
  curve: number;
  pubblico: boolean;
  soloLocale: boolean;
}

interface GiroLocale {
  id: string;
  data: string;
  km: number;
  durataSec: number;
  punti: Punto[];
  velMediaKmh?: number;
  velMaxKmh?: number;
  dislivelloM?: number;
  curve?: number;
}

interface RigaGiroDb {
  id: string;
  nome: string;
  km: number;
  durata_sec: number;
  vel_media_kmh: number;
  vel_max_kmh: number;
  dislivello_m: number;
  curve: number;
  tracciato: unknown;
  created_at: string;
  pubblico: boolean;
}

export function tracciatoDaDb(tracciato: unknown): Punto[] {
  if (!Array.isArray(tracciato)) return [];
  const punti: Punto[] = [];
  for (const item of tracciato) {
    if (!Array.isArray(item) || item.length < 2) continue;
    const lat = Number(item[0]);
    const lng = Number(item[1]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    const altRaw = item.length > 2 ? Number(item[2]) : undefined;
    const p: Punto = { lat, lng };
    if (altRaw !== undefined && Number.isFinite(altRaw)) p.alt = altRaw;
    punti.push(p);
  }
  return punti;
}

export function tracciatoPerDb(punti: Punto[]): number[][] {
  return punti.map((p) => {
    if (typeof p.alt === 'number' && Number.isFinite(p.alt)) return [p.lat, p.lng, p.alt];
    return [p.lat, p.lng];
  });
}

function daRigaDb(riga: RigaGiroDb): GiroUtente {
  return {
    id: riga.id,
    cloudId: riga.id,
    nome: riga.nome,
    data: riga.created_at,
    km: Number(riga.km) * 1000,
    durataSec: riga.durata_sec,
    punti: tracciatoDaDb(riga.tracciato),
    velMediaKmh: riga.vel_media_kmh ?? 0,
    velMaxKmh: riga.vel_max_kmh ?? 0,
    dislivelloM: riga.dislivello_m ?? 0,
    curve: riga.curve ?? 0,
    pubblico: Boolean(riga.pubblico),
    soloLocale: false,
  };
}

function daLocale(giro: GiroLocale): GiroUtente {
  return {
    id: giro.id,
    cloudId: null,
    nome: 'Giro libero',
    data: giro.data,
    km: giro.km,
    durataSec: giro.durataSec,
    punti: giro.punti,
    velMediaKmh: giro.velMediaKmh ?? 0,
    velMaxKmh: giro.velMaxKmh ?? 0,
    dislivelloM: giro.dislivelloM ?? 0,
    curve: giro.curve ?? 0,
    pubblico: false,
    soloLocale: true,
  };
}

function leggiLocale(): GiroLocale[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as GiroLocale[]) : [];
  } catch {
    return [];
  }
}

function svuotaLocale() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignora
  }
}

export async function caricaGiriUtente(
  supabase: SupabaseClient,
  utenteId: string,
): Promise<GiroUtente[]> {
  const { data, error } = await supabase
    .from('giri')
    .select('id, nome, km, durata_sec, vel_media_kmh, vel_max_kmh, dislivello_m, curve, tracciato, created_at, pubblico')
    .eq('utente_id', utenteId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw new Error(error.message);

  const cloud = (data ?? []).map((riga) => daRigaDb(riga as RigaGiroDb));
  const locali = leggiLocale();

  if (locali.length === 0) return cloud;

  const migrati: GiroUtente[] = [];
  for (const locale of locali) {
    const duplicato = cloud.some((g) => {
      const stessoGiorno = new Date(g.data).toDateString() === new Date(locale.data).toDateString();
      const stessiKm = Math.abs(g.km - locale.km) < 50;
      return stessoGiorno && stessiKm;
    });
    if (duplicato) continue;

    try {
      const salvato = await salvaGiroCloud(supabase, utenteId, daLocale(locale), 'Giro libero');
      migrati.push(salvato);
    } catch {
      migrati.push(daLocale(locale));
    }
  }

  if (migrati.some((g) => !g.soloLocale)) svuotaLocale();

  const ids = new Set(cloud.map((g) => g.id));
  const extra = migrati.filter((g) => !ids.has(g.id));
  return [...extra, ...cloud].sort(
    (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime(),
  );
}

export async function salvaGiroCloud(
  supabase: SupabaseClient,
  utenteId: string,
  giro: GiroUtente,
  nome?: string,
): Promise<GiroUtente> {
  const titolo = (nome ?? giro.nome).trim() || 'Giro libero';
  const { data, error } = await supabase
    .from('giri')
    .insert({
      utente_id: utenteId,
      nome: titolo,
      km: Number((giro.km / 1000).toFixed(2)),
      durata_sec: Math.round(giro.durataSec),
      vel_media_kmh: giro.velMediaKmh,
      vel_max_kmh: giro.velMaxKmh,
      dislivello_m: giro.dislivelloM,
      curve: giro.curve,
      tracciato: tracciatoPerDb(giro.punti),
      pubblico: giro.pubblico,
    })
    .select('id, nome, km, durata_sec, vel_media_kmh, vel_max_kmh, dislivello_m, curve, tracciato, created_at, pubblico')
    .single();

  if (error || !data) throw new Error(error?.message ?? 'Salvataggio giro fallito.');
  return daRigaDb(data as RigaGiroDb);
}

export async function aggiornaGiroCloud(
  supabase: SupabaseClient,
  cloudId: string,
  valori: Partial<Pick<GiroUtente, 'nome' | 'pubblico'>>,
): Promise<void> {
  const aggiornamento: Record<string, unknown> = {};
  if (valori.nome !== undefined) aggiornamento.nome = valori.nome.trim() || 'Giro libero';
  if (valori.pubblico !== undefined) aggiornamento.pubblico = valori.pubblico;
  if (Object.keys(aggiornamento).length === 0) return;

  const { error } = await supabase.from('giri').update(aggiornamento).eq('id', cloudId);
  if (error) throw new Error(error.message);
}

export async function eliminaGiroCloud(supabase: SupabaseClient, cloudId: string): Promise<void> {
  const { error } = await supabase.from('giri').delete().eq('id', cloudId);
  if (error) throw new Error(error.message);
}

/** Rimuove un giro da localStorage (id locale o iso pre-sync). */
export function eliminaGiroLocale(id: string): void {
  if (typeof window === 'undefined') return;
  const esistenti = leggiLocale().filter((item) => item.id !== id);
  try {
    if (esistenti.length === 0) window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, JSON.stringify(esistenti));
  } catch {
    // ignora
  }
}

/** Elimina cloud + eventuale copia locale. */
export async function eliminaGiroUtente(
  supabase: SupabaseClient | null,
  giro: Pick<GiroUtente, 'id' | 'cloudId'>,
): Promise<void> {
  eliminaGiroLocale(giro.id);
  if (giro.cloudId && supabase) {
    await eliminaGiroCloud(supabase, giro.cloudId);
  }
}

export function salvaGiroLocale(giro: GiroLocale) {
  const esistenti = leggiLocale();
  const aggiornato = [giro, ...esistenti.filter((item) => item.id !== giro.id)].slice(0, 20);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(aggiornato));
  } catch {
    // storage pieno o non disponibile
  }
}

export function giroDaSessione(
  punti: Punto[],
  distanzaM: number,
  durataSec: number,
  stat: {
    velMediaKmh: number;
    velMaxKmh: number;
    dislivelloPositivoM: number;
    curve: number;
  },
  nome = 'Giro libero',
): GiroUtente {
  const data = new Date().toISOString();
  return {
    id: data,
    cloudId: null,
    nome,
    data,
    km: distanzaM,
    durataSec,
    punti,
    velMediaKmh: stat.velMediaKmh,
    velMaxKmh: stat.velMaxKmh,
    dislivelloM: stat.dislivelloPositivoM,
    curve: stat.curve,
    pubblico: false,
    soloLocale: true,
  };
}
