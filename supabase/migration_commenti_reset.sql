-- Ricrea la tabella commenti con la struttura corretta.
-- Sicuro: la tabella commenti e' nuova/vuota. Elimina la versione vecchia
-- (struttura diversa, senza autore_id) e la ricrea con i campi giusti.

-- 1) Via la tabella vecchia (cascade rimuove anche le sue policy)
drop table if exists public.commenti cascade;

-- 2) Tabella corretta
create table public.commenti (
  id uuid primary key default gen_random_uuid(),
  itinerario_id uuid not null references public.itinerari(id) on delete cascade,
  autore_id uuid not null references public.profiles(id) on delete cascade,
  testo text not null,
  created_at timestamptz not null default now()
);

create index commenti_itinerario_idx
  on public.commenti (itinerario_id, created_at desc);

alter table public.commenti enable row level security;

-- 3) Policy
create policy "commenti leggibili da tutti" on public.commenti
  for select using (true);

create policy "utenti loggati commentano" on public.commenti
  for insert with check (auth.uid() = autore_id);

create policy "autori cancellano i propri commenti" on public.commenti
  for delete using (auth.uid() = autore_id);

create policy "admin cancella commenti" on public.commenti
  for delete using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );
