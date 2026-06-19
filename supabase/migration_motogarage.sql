-- MotoGarage: tabella moto (più moto per utente) + storage
-- Esegui in Supabase SQL Editor → New query → Run

-- ───── TABELLA MOTO ─────────────────────────────────────────────────────────
create table if not exists public.moto (
  id               uuid primary key default gen_random_uuid(),
  utente_id        uuid not null references public.profiles(id) on delete cascade,
  marca            text not null,
  modello          text not null,
  anno             smallint,
  targa            text,
  colore_primario  text default '#CC0000',
  colore_secondario text default '#111111',
  foto_sx_url      text,
  foto_dx_url      text,
  glb_url          text,
  thumbnail_url    text,
  stato            text default 'bozza',  -- bozza | elaborazione | pronto | errore
  task_id          text,                   -- Hunyuan3D HF job id
  errore           text,
  accessori        jsonb default '[]'::jsonb,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- RLS
alter table public.moto enable row level security;

drop policy if exists "moto leggibili da tutti" on public.moto;
drop policy if exists "utente gestisce proprie moto" on public.moto;

-- tutti possono leggere (profili pubblici, garage)
create policy "moto leggibili da tutti" on public.moto
  for select using (true);

-- solo il proprietario può inserire/modificare/cancellare
create policy "utente gestisce proprie moto" on public.moto
  for all using (auth.uid() = utente_id);

-- aggiorna updated_at automaticamente
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists moto_updated_at on public.moto;
create trigger moto_updated_at
  before update on public.moto
  for each row execute procedure public.set_updated_at();

-- ───── STORAGE BUCKET ───────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
  values ('foto-moto', 'foto-moto', false)
  on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
  values ('modelli-3d', 'modelli-3d', true)
  on conflict (id) do nothing;

-- Policy foto-moto (private, solo proprietario)
drop policy if exists "upload foto moto" on storage.objects;
drop policy if exists "leggi foto proprie" on storage.objects;
create policy "upload foto moto" on storage.objects
  for insert with check (bucket_id = 'foto-moto' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "leggi foto proprie" on storage.objects
  for select using (bucket_id = 'foto-moto' and auth.uid()::text = (storage.foldername(name))[1]);

-- Policy modelli-3d (pubblici)
drop policy if exists "leggi modelli 3d" on storage.objects;
drop policy if exists "upload modelli 3d" on storage.objects;
create policy "leggi modelli 3d" on storage.objects
  for select using (bucket_id = 'modelli-3d');
create policy "upload modelli 3d" on storage.objects
  for insert with check (bucket_id = 'modelli-3d');
create policy "update modelli 3d" on storage.objects
  for update using (bucket_id = 'modelli-3d');
