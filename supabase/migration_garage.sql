-- Aggiunge i campi per il configuratore moto e il profilo pubblico.
-- Esegui in Supabase: SQL Editor -> New query -> Run. Sicuro da rieseguire.

alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists moto_tipo text default 'naked';
alter table public.profiles add column if not exists moto_colore_primario text default '#F2B705';
alter table public.profiles add column if not exists moto_colore_secondario text default '#15181A';
alter table public.profiles add column if not exists moto_accessori jsonb default '[]'::jsonb;

-- Il profilo pubblico (username, bio, moto) è leggibile da tutti per la pagina /profilo/[username]
drop policy if exists "profilo pubblico leggibile" on public.profiles;
create policy "profilo pubblico leggibile" on public.profiles
  for select using (true);
