-- Migrazione: giri registrati via GPS dagli utenti (salvataggio nel cloud)
-- Esegui in Supabase: SQL Editor → New query → incolla tutto → Run.

create table if not exists public.giri (
  id uuid primary key default gen_random_uuid(),
  utente_id uuid not null references public.profiles(id) on delete cascade,
  -- itinerario collegato (opzionale: un giro libero non ne ha)
  itinerario_id uuid references public.itinerari(id) on delete set null,
  nome text not null default 'Giro libero',
  km numeric not null default 0,
  durata_sec integer not null default 0,
  vel_media_kmh integer not null default 0,
  vel_max_kmh integer not null default 0,
  dislivello_m integer not null default 0,
  curve integer not null default 0,
  -- tracciato completo come array di [lat,lng]
  tracciato jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists giri_utente_idx on public.giri (utente_id, created_at desc);

alter table public.giri enable row level security;

drop policy if exists "giri propri leggibili" on public.giri;
create policy "giri propri leggibili" on public.giri
  for select using (auth.uid() = utente_id);

drop policy if exists "utenti salvano i propri giri" on public.giri;
create policy "utenti salvano i propri giri" on public.giri
  for insert with check (auth.uid() = utente_id);

drop policy if exists "utenti cancellano i propri giri" on public.giri;
create policy "utenti cancellano i propri giri" on public.giri
  for delete using (auth.uid() = utente_id);
