-- MotoGarage — protezione dei privilegi account.
-- Impedisce a un utente di auto-assegnarsi Pro o admin.

drop policy if exists "ognuno aggiorna il proprio profilo" on public.profiles;
drop policy if exists "utente aggiorna il proprio profilo (no privilegi)" on public.profiles;

create policy "utente aggiorna il proprio profilo (no privilegi)"
on public.profiles
for update
using (auth.uid() = id)
with check (
  auth.uid() = id
  and is_pro = (select p.is_pro from public.profiles p where p.id = auth.uid())
  and is_admin = (select p.is_admin from public.profiles p where p.id = auth.uid())
  and pro_scadenza is not distinct from (
    select p.pro_scadenza from public.profiles p where p.id = auth.uid()
  )
);

alter table public.profiles enable row level security;
alter table public.itinerari enable row level security;
alter table public.tappe enable row level security;
alter table public.avvisi enable row level security;

drop policy if exists "foto approvate visibili" on public.foto;
