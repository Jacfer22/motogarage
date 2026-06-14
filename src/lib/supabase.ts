import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Articolo, Avviso, Itinerario } from './types';
import { AVVISI_FALLBACK, ITINERARI_FALLBACK } from './fallback';
import { ITINERARI_CLASSICI } from './itinerari-classici';

// Tutti gli itinerari disponibili senza database: i 10 verificati del Lazio
// più le strade-icona classiche delle altre regioni.
const TUTTI_FALLBACK = [...ITINERARI_FALLBACK, ...ITINERARI_CLASSICI];

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function getClient(): SupabaseClient | null {
  if (!url || !key) return null;
  return createClient(url, key);
}

// Se Supabase non è configurato o la query fallisce, il sito usa i dati fallback:
// puoi vedere tutto in locale prima ancora di creare il progetto Supabase.

interface RigaItinerario extends Omit<Itinerario, 'pro_extra'> {
  variante_pro: string | null;
  weekend_pro: string | null;
}

function mappaRiga(riga: RigaItinerario): Itinerario {
  const { variante_pro, weekend_pro, ...resto } = riga;
  return {
    ...resto,
    tracciato: riga.tracciato ?? [],
    regioni: riga.regioni ?? [],
    origine: riga.origine ?? 'verificato',
    pro_extra:
      variante_pro && weekend_pro
        ? { variante: variante_pro, weekend: weekend_pro }
        : null,
  };
}

export async function getItinerari(): Promise<Itinerario[]> {
  const supabase = getClient();
  if (!supabase) return TUTTI_FALLBACK;

  const { data, error } = await supabase
    .from('itinerari')
    .select('*')
    .order('km', { ascending: true });

  if (error || !data || data.length === 0) return TUTTI_FALLBACK;
  return (data as RigaItinerario[]).map(mappaRiga);
}

// Itinerari di una regione (per slug). Include i giri che la toccano anche
// se a cavallo del confine, perché appaiono nell'array `regioni` di entrambe.
export async function getItinerariPerRegione(regioneSlug: string): Promise<Itinerario[]> {
  const tutti = await getItinerari();
  return tutti.filter((i) => (i.regioni ?? []).includes(regioneSlug));
}

export async function getItinerario(slug: string): Promise<Itinerario | null> {
  const supabase = getClient();
  if (!supabase) {
    const itinerario = TUTTI_FALLBACK.find((i) => i.slug === slug) ?? null;
    if (!itinerario) return null;
    return {
      ...itinerario,
      avvisi: AVVISI_FALLBACK.filter((a) => a.itinerario_id === itinerario.id),
    };
  }

  const { data, error } = await supabase
    .from('itinerari')
    .select('*, tappe(*), avvisi(*)')
    .eq('slug', slug)
    .order('ordine', { referencedTable: 'tappe', ascending: true })
    .single();

  if (error || !data) {
    const itinerario = TUTTI_FALLBACK.find((i) => i.slug === slug) ?? null;
    if (!itinerario) return null;
    return {
      ...itinerario,
      avvisi: AVVISI_FALLBACK.filter((a) => a.itinerario_id === itinerario.id),
    };
  }

  const riga = data as Omit<RigaItinerario, 'avvisi'> & {
    avvisi?: (Avviso & { attivo?: boolean })[];
  };
  const itinerario = mappaRiga(riga);
  itinerario.avvisi = (riga.avvisi ?? []).filter((a) => a.attivo !== false);
  return itinerario;
}

// Restituisce gli id degli itinerari con almeno un avviso attivo,
// utile per mostrare un badge "Aggiornamenti" nelle card della homepage.
export async function getItinerariConAvvisi(): Promise<Set<string>> {
  const supabase = getClient();
  if (!supabase) {
    return new Set(AVVISI_FALLBACK.map((a) => a.itinerario_id));
  }

  const { data, error } = await supabase
    .from('avvisi')
    .select('itinerario_id')
    .eq('attivo', true);

  if (error || !data) return new Set();
  return new Set(data.map((r: { itinerario_id: string }) => r.itinerario_id));
}

export type { Avviso };

// ============ BLOG ============

// Niente fallback locale per il blog: senza Supabase configurato la pagina
// mostra solo un avviso, non finge articoli inesistenti.

export async function getArticoliPubblicati(): Promise<Articolo[]> {
  const supabase = getClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('articoli')
    .select('*, autore:profiles(username)')
    .eq('stato', 'pubblicato')
    .order('pubblicato_at', { ascending: false });

  if (error || !data) return [];
  return data as unknown as Articolo[];
}

export async function getArticolo(id: string): Promise<Articolo | null> {
  const supabase = getClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('articoli')
    .select('*, autore:profiles(username)')
    .eq('id', id)
    .eq('stato', 'pubblicato')
    .single();

  if (error || !data) return null;
  return data as unknown as Articolo;
}
