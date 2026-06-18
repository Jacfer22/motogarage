-- Migrazione: collega ogni profilo al suo cliente Stripe.
-- Necessaria per i pagamenti. Esegui in Supabase: SQL Editor -> New query -> Run.
-- Sicuro da rieseguire.

alter table public.profiles add column if not exists stripe_customer_id text;

create index if not exists profiles_stripe_customer_idx
  on public.profiles (stripe_customer_id);

-- Nota sicurezza: is_pro e pro_scadenza restano scrivibili SOLO dal webhook
-- (service-role key). La policy dell'audit impedisce all'utente di modificarli
-- da solo. stripe_customer_id e' tecnico e non da' privilegi.
