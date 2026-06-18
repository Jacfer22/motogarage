import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Client Supabase con SERVICE-ROLE key: bypassa la RLS e puo' scrivere
// is_pro / pro_scadenza. Va usato SOLO nel codice server (API route, webhook),
// MAI nel browser. La chiave vive nelle env di Vercel (SUPABASE_SERVICE_ROLE_KEY).
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function getSupabaseAdmin(): SupabaseClient | null {
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
