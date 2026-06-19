import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Client server con service-role: bypassa la RLS per operazioni amministrative
// autorizzate, come attivare Pro e pubblicare i modelli del garage.
// Non importare mai questo modulo nel browser.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function getSupabaseAdmin(): SupabaseClient | null {
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
