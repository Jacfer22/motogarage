import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { supabaseServiceRoleKey, supabaseUrlServer } from '@/lib/env-server';

// Client server con service-role: bypassa la RLS per operazioni amministrative.
// Non importare mai questo modulo nel browser.
export function getSupabaseAdmin(): SupabaseClient | null {
  const url = supabaseUrlServer();
  const serviceKey = supabaseServiceRoleKey();
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
