-- Anteprima vetrina garage (screenshot dal viewer 3D).
-- Esegui in Supabase: SQL Editor -> New query -> Run. Sicuro da rieseguire.

alter table public.moto add column if not exists vetrina_url text;
