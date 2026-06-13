-- Migrazione: profilo utente (categoria moto + foto profilo)
-- Esegui in Supabase: SQL Editor → New query → incolla tutto → Run

alter table public.profiles add column categoria_moto text check (
  categoria_moto in ('naked','sportiva','touring','adventure','custom','cafe_racer','enduro','scooter','vintage','altro')
);

-- Bucket pubblico per le foto profilo
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "avatar leggibili da tutti" on storage.objects for select using (
  bucket_id = 'avatars'
);

create policy "utenti caricano il proprio avatar" on storage.objects for insert with check (
  bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "utenti aggiornano il proprio avatar" on storage.objects for update using (
  bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]
);
