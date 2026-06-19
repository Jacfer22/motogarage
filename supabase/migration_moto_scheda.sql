-- Scheda tecnica moto (modifiche, kit, trasmissione…) + categoria per foto profilo
alter table public.moto add column if not exists categoria text check (
  categoria in ('naked','sportiva','touring','adventure','custom','cafe_racer','enduro','scooter','vintage','altro')
);
alter table public.moto add column if not exists scheda_modifiche jsonb not null default '{}'::jsonb;

-- Profilo pubblico: leggi moto pubblicate anche senza gemello 3D (scheda + categoria)
drop policy if exists "visitatori leggono moto pubbliche" on public.moto;
create policy "visitatori leggono moto pubbliche"
  on public.moto for select
  using (is_public = true and stato = 'pronto');
