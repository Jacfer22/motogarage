-- Versione rieseguibile della migration foto: non dà errore se qualcosa
-- esiste già. Usa questa al posto di migration_foto.sql.

-- 1) Tabella (solo se non esiste)
create table if not exists public.foto (
  id uuid primary key default gen_random_uuid(),
  autore_id uuid not null references public.profiles(id) on delete cascade,
  itinerario_id uuid references public.itinerari(id) on delete set null,
  storage_path text not null,
  didascalia text,
  created_at timestamptz not null default now()
);

create index if not exists foto_itinerario_idx on public.foto (itinerario_id);
create index if not exists foto_created_idx on public.foto (created_at desc);

alter table public.foto enable row level security;

-- 2) Policy tabella (drop + create per essere rieseguibili)
drop policy if exists "foto leggibili da tutti" on public.foto;
create policy "foto leggibili da tutti" on public.foto
  for select using (true);

drop policy if exists "utenti loggati caricano foto" on public.foto;
create policy "utenti loggati caricano foto" on public.foto
  for insert with check (auth.uid() = autore_id);

drop policy if exists "autori cancellano le proprie foto" on public.foto;
create policy "autori cancellano le proprie foto" on public.foto
  for delete using (auth.uid() = autore_id);

drop policy if exists "admin cancella foto" on public.foto;
create policy "admin cancella foto" on public.foto
  for delete using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

-- 3) Bucket pubblico (ignora se già presente)
insert into storage.buckets (id, name, public)
values ('foto-bikers', 'foto-bikers', true)
on conflict (id) do nothing;

-- 4) Policy storage (drop + create)
drop policy if exists "foto storage lettura pubblica" on storage.objects;
create policy "foto storage lettura pubblica" on storage.objects
  for select using (bucket_id = 'foto-bikers');

drop policy if exists "foto storage upload autenticati" on storage.objects;
create policy "foto storage upload autenticati" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'foto-bikers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "foto storage cancella propri" on storage.objects;
create policy "foto storage cancella propri" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'foto-bikers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
