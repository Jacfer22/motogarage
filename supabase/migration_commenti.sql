-- Commenti degli utenti agli itinerari.
-- Esegui in Supabase: SQL Editor -> New query -> Run. Sicuro da rieseguire.

create table if not exists public.commenti (
  id uuid primary key default gen_random_uuid(),
  itinerario_id uuid not null references public.itinerari(id) on delete cascade,
  autore_id uuid not null references public.profiles(id) on delete cascade,
  testo text not null,
  created_at timestamptz not null default now()
);

create index if not exists commenti_itinerario_idx
  on public.commenti (itinerario_id, created_at desc);

alter table public.commenti enable row level security;

-- Lettura pubblica: i commenti si vedono da tutti (anche non loggati)
drop policy if exists "commenti leggibili da tutti" on public.commenti;
create policy "commenti leggibili da tutti" on public.commenti
  for select using (true);

-- Scrittura: solo utenti loggati, e solo a proprio nome
drop policy if exists "utenti loggati commentano" on public.commenti;
create policy "utenti loggati commentano" on public.commenti
  for insert with check (auth.uid() = autore_id);

-- Ognuno cancella i propri commenti
drop policy if exists "autori cancellano i propri commenti" on public.commenti;
create policy "autori cancellano i propri commenti" on public.commenti
  for delete using (auth.uid() = autore_id);

-- L'admin puo' cancellare qualsiasi commento (moderazione)
drop policy if exists "admin cancella commenti" on public.commenti;
create policy "admin cancella commenti" on public.commenti
  for delete using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );
