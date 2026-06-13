-- Migrazione: account a 4 livelli (anonimo / free / pro / admin)
-- Esegui in Supabase: SQL Editor → New query → incolla tutto → Run

alter table public.profiles add column is_admin boolean not null default false;

create policy "admin aggiorna profili" on public.profiles for update using (
  exists (select 1 from public.profiles p2 where p2.id = auth.uid() and p2.is_admin = true)
);

create policy "admin aggiorna avvisi" on public.avvisi for update using (
  exists (select 1 from public.profiles p2 where p2.id = auth.uid() and p2.is_admin = true)
);

-- Rende admin il tuo account (cambia l'email se necessario)
update public.profiles set is_admin = true
where id = (select id from auth.users where email = 'jacopo.ferretti1997@icloud.com');
