-- Migrazione: foto dei biker (caricate dagli utenti, collegabili a un itinerario)
-- Esegui in Supabase: SQL Editor → New query → incolla tutto → Run.
-- Crea anche il bucket di storage pubblico "foto-bikers".

-- 1) Tabella metadati foto
create table public.foto (
  id uuid primary key default gen_random_uuid(),
  autore_id uuid not null references public.profiles(id) on delete cascade,
  -- itinerario collegato (opzionale: una foto può essere "libera")
  itinerario_id uuid references public.itinerari(id) on delete set null,
  -- percorso del file dentro il bucket "foto-bikers"
  storage_path text not null,
  -- didascalia breve opzionale
  didascalia text,
  created_at timestamptz not null default now()
);

create index foto_itinerario_idx on public.foto (itinerario_id);
create index foto_created_idx on public.foto (created_at desc);

alter table public.foto enable row level security;

-- Tutti possono vedere le foto (galleria pubblica)
create policy "foto leggibili da tutti" on public.foto
  for select using (true);

-- Solo utenti loggati caricano, e solo a proprio nome
create policy "utenti loggati caricano foto" on public.foto
  for insert with check (auth.uid() = autore_id);

-- Ognuno può cancellare le proprie foto
create policy "autori cancellano le proprie foto" on public.foto
  for delete using (auth.uid() = autore_id);

-- L'admin può cancellare qualsiasi foto (moderazione)
create policy "admin cancella foto" on public.foto
  for delete using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

-- 2) Bucket di storage pubblico per i file immagine
insert into storage.buckets (id, name, public)
values ('foto-bikers', 'foto-bikers', true)
on conflict (id) do nothing;

-- 3) Policy sullo storage
-- Lettura pubblica dei file del bucket
create policy "foto storage lettura pubblica" on storage.objects
  for select using (bucket_id = 'foto-bikers');

-- Upload consentito agli utenti autenticati, dentro una cartella col proprio id
create policy "foto storage upload autenticati" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'foto-bikers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Cancellazione dei propri file
create policy "foto storage cancella propri" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'foto-bikers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
