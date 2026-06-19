-- MotoGarage — garage digitale Pro, richieste fotografiche e Gaussian Splat.
-- Esegui nel SQL Editor di Supabase. La migration è idempotente.

create table if not exists public.moto (
  id uuid primary key default gen_random_uuid(),
  utente_id uuid not null references public.profiles(id) on delete cascade,
  marca text not null,
  modello text not null,
  anno smallint,
  targa text,
  colore_primario text not null default '#D91414',
  colore_secondario text not null default '#15181A',
  foto_sx_url text,
  foto_dx_url text,
  glb_url text,
  model_url text,
  thumbnail_url text,
  model_format text not null default 'ply',
  stato text not null default 'in_attesa',
  task_id text,
  provider text,
  progress smallint not null default 0,
  errore text,
  is_public boolean not null default false,
  accessori jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.moto add column if not exists model_url text;
alter table public.moto add column if not exists model_format text not null default 'ply';
alter table public.moto add column if not exists provider text;
alter table public.moto add column if not exists progress smallint not null default 0;
alter table public.moto add column if not exists is_public boolean not null default false;

alter table public.moto drop constraint if exists moto_stato_check;
alter table public.moto
  add constraint moto_stato_check
  check (stato in ('bozza', 'in_attesa', 'elaborazione', 'pronto', 'errore'));

alter table public.moto drop constraint if exists moto_model_format_check;
alter table public.moto
  add constraint moto_model_format_check
  check (model_format in ('glb', 'gltf', 'ply', 'splat', 'ksplat'));

alter table public.moto drop constraint if exists moto_progress_check;
alter table public.moto
  add constraint moto_progress_check check (progress between 0 and 100);

create index if not exists moto_utente_created_idx
  on public.moto (utente_id, created_at desc);
create index if not exists moto_coda_idx
  on public.moto (stato, created_at)
  where stato in ('in_attesa', 'elaborazione', 'errore');
create index if not exists moto_pubbliche_idx
  on public.moto (utente_id, is_public, stato)
  where is_public = true and stato = 'pronto';

create or replace function public.set_motogarage_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists moto_updated_at on public.moto;
create trigger moto_updated_at
  before update on public.moto
  for each row execute function public.set_motogarage_updated_at();

-- Il client può modificare colori e visibilità, ma non può auto-approvare
-- una richiesta né inserire URL di modelli. Questi campi sono scritti
-- esclusivamente dall'API admin con service-role.
create or replace function public.proteggi_modello_moto()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if auth.role() <> 'service_role' then
    if new.model_url is distinct from old.model_url
      or new.glb_url is distinct from old.glb_url
      or new.model_format is distinct from old.model_format
      or new.stato is distinct from old.stato
      or new.progress is distinct from old.progress
      or new.provider is distinct from old.provider
      or new.task_id is distinct from old.task_id
      or new.errore is distinct from old.errore then
      raise exception 'I campi del modello sono gestiti dal server MotoGarage';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists proteggi_modello_moto_trigger on public.moto;
create trigger proteggi_modello_moto_trigger
  before update on public.moto
  for each row execute function public.proteggi_modello_moto();

alter table public.moto enable row level security;

drop policy if exists "moto leggibili da tutti" on public.moto;
drop policy if exists "utente gestisce proprie moto" on public.moto;
drop policy if exists "proprietario legge le proprie moto" on public.moto;
drop policy if exists "visitatori leggono moto pubbliche" on public.moto;
drop policy if exists "proprietario crea moto" on public.moto;
drop policy if exists "proprietario pro crea moto" on public.moto;
drop policy if exists "proprietario aggiorna moto" on public.moto;
drop policy if exists "proprietario elimina moto" on public.moto;

create policy "proprietario legge le proprie moto"
  on public.moto for select
  using (auth.uid() = utente_id);

create policy "visitatori leggono moto pubbliche"
  on public.moto for select
  using (
    is_public = true
    and stato = 'pronto'
    and coalesce(model_url, glb_url) is not null
  );

create policy "proprietario pro crea moto"
  on public.moto for insert
  with check (
    auth.uid() = utente_id
    and stato = 'in_attesa'
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and (p.is_pro = true or p.is_admin = true)
    )
  );

create policy "proprietario aggiorna moto"
  on public.moto for update
  using (auth.uid() = utente_id)
  with check (auth.uid() = utente_id);

create policy "proprietario elimina moto"
  on public.moto for delete
  using (auth.uid() = utente_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'foto-moto',
  'foto-moto',
  false,
  15728640,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'modelli-3d',
  'modelli-3d',
  true,
  262144000,
  array['model/gltf-binary', 'model/gltf+json', 'application/octet-stream']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "upload foto moto" on storage.objects;
drop policy if exists "leggi foto proprie" on storage.objects;
drop policy if exists "aggiorna foto proprie" on storage.objects;
drop policy if exists "elimina foto proprie" on storage.objects;
drop policy if exists "leggi modelli 3d" on storage.objects;
drop policy if exists "upload modelli 3d" on storage.objects;
drop policy if exists "update modelli 3d" on storage.objects;

create policy "upload foto moto"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'foto-moto'
    and auth.uid()::text = (storage.foldername(name))[1]
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and (p.is_pro = true or p.is_admin = true)
    )
  );

create policy "leggi foto proprie"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'foto-moto'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "aggiorna foto proprie"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'foto-moto'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'foto-moto'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "elimina foto proprie"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'foto-moto'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "leggi modelli 3d"
  on storage.objects for select
  using (bucket_id = 'modelli-3d');

-- Nessuna policy client per scrivere in modelli-3d:
-- i file approvati vengono caricati dalla API admin con service-role.
