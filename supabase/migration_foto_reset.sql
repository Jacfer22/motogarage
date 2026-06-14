-- Ricrea la tabella foto con la struttura corretta.
-- Sicuro: la tabella foto è nuova e vuota. Elimina la versione sbagliata
-- (con colonne diverse) e la ricrea con autore_id, itinerario_id, ecc.

-- 1) Via la tabella vecchia con struttura errata (cascade toglie anche le sue policy)
drop table if exists public.foto cascade;

-- 2) Tabella corretta
create table public.foto (
  id uuid primary key default gen_random_uuid(),
  autore_id uuid not null references public.profiles(id) on delete cascade,
  itinerario_id uuid references public.itinerari(id) on delete set null,
  storage_path text not null,
  didascalia text,
  created_at timestamptz not null default now()
);

create index foto_itinerario_idx on public.foto (itinerario_id);
create index foto_created_idx on public.foto (created_at desc);

alter table public.foto enable row level security;

-- 3) Policy tabella
create policy "foto leggibili da tutti" on public.foto
  for select using (true);
create policy "utenti loggati caricano foto" on public.foto
  for insert with check (auth.uid() = autore_id);
create policy "autori cancellano le proprie foto" on public.foto
  for delete using (auth.uid() = autore_id);
create policy "admin cancella foto" on public.foto
  for delete using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

-- 4) Bucket pubblico (ignora se già presente)
insert into storage.buckets (id, name, public)
values ('foto-bikers', 'foto-bikers', true)
on conflict (id) do nothing;

-- 5) Policy storage (drop + create per essere rieseguibili)
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
