-- Permette di usare le tracce GPS reali (dei giri resi pubblici e collegati a
-- un itinerario) come base per la card di quell'itinerario.
-- Esegui in Supabase: SQL Editor -> New query -> Run. Sicuro da rieseguire.
-- Prerequisito: migration_giri_pubblici.sql (colonna "pubblico") già eseguita.

-- La policy "giri pubblici leggibili da tutti" (già creata) consente di leggere
-- i giri con pubblico = true. Qui aggiungiamo solo un indice per trovare in
-- fretta l'ultima traccia pubblica di un dato itinerario.
create index if not exists giri_itinerario_pubblico_idx
  on public.giri (itinerario_id, pubblico, created_at desc);
