-- Aggiunge la posizione (lat/lng) alle foto, per mostrarle su una mappa.
-- Opzionale: molte foto non avranno coordinate (il browser le rimuove spesso).
-- Esegui in Supabase: SQL Editor -> New query -> Run. Sicuro da rieseguire.

alter table public.foto add column if not exists lat double precision;
alter table public.foto add column if not exists lng double precision;
