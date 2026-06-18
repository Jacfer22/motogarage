-- Lista d'attesa per il piano Pro: raccoglie le email di chi e' interessato,
-- per validare la domanda prima di attivare i pagamenti.
-- Esegui in Supabase: SQL Editor -> New query -> Run. Sicuro da rieseguire.

create table if not exists public.lista_attesa_pro (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  piano_interesse text,        -- 'mensile' | 'annuale' | null
  utente_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- evita doppioni della stessa email
create unique index if not exists lista_attesa_pro_email_idx
  on public.lista_attesa_pro (lower(email));

alter table public.lista_attesa_pro enable row level security;

-- Chiunque (anche non loggato) puo' iscriversi: solo INSERT.
drop policy if exists "iscrizione lista attesa" on public.lista_attesa_pro;
create policy "iscrizione lista attesa" on public.lista_attesa_pro
  for insert with check (true);

-- Solo l'admin puo' LEGGERE la lista (la lista email e' privata).
drop policy if exists "solo admin legge lista attesa" on public.lista_attesa_pro;
create policy "solo admin legge lista attesa" on public.lista_attesa_pro
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

-- Solo l'admin puo' cancellare.
drop policy if exists "solo admin cancella lista attesa" on public.lista_attesa_pro;
create policy "solo admin cancella lista attesa" on public.lista_attesa_pro
  for delete using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );
