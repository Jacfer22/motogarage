-- ============================================================
-- AUDIT SICUREZZA - FIX CRITICO
-- Chiude la falla per cui un utente poteva auto-assegnarsi
-- is_pro = true (saltando il pagamento) o is_admin = true
-- (prendendo il controllo del pannello admin) aggiornando il
-- proprio profilo.
--
-- Esegui in Supabase: SQL Editor -> New query -> incolla tutto -> Run.
-- Sicuro da rieseguire (usa drop policy if exists).
-- ============================================================

-- 1) Rimuovo la vecchia policy di update troppo permissiva
drop policy if exists "ognuno aggiorna il proprio profilo" on public.profiles;

-- 2) Nuova policy: l'utente aggiorna il PROPRIO profilo, ma NON puo'
--    cambiare is_pro, is_admin e pro_scadenza (devono restare uguali
--    ai valori attualmente salvati nel database).
--    I privilegi vengono modificati solo da:
--      - un admin (policy "admin aggiorna profili", gia' presente)
--      - il webhook pagamenti, che usa la service-role key (bypassa RLS)
create policy "utente aggiorna il proprio profilo (no privilegi)"
on public.profiles
for update
using (auth.uid() = id)
with check (
  auth.uid() = id
  and is_pro = (select p.is_pro from public.profiles p where p.id = auth.uid())
  and is_admin = (select p.is_admin from public.profiles p where p.id = auth.uid())
  and pro_scadenza is not distinct from (select p.pro_scadenza from public.profiles p where p.id = auth.uid())
);

-- 3) Verifica: RLS attivo su tutte le tabelle sensibili.
--    (enable e' idempotente, non da' errore se gia' attivo)
alter table public.profiles enable row level security;
alter table public.itinerari enable row level security;
alter table public.tappe enable row level security;
alter table public.avvisi enable row level security;

-- 4) Bonifica policy "foto" obsolete: lo schema originale aveva una tabella
--    foto con colonne user_id/approvata, poi sostituita da quella con
--    autore_id. Rimuovo le vecchie policy se per caso sono rimaste, cosi'
--    non restano regole che puntano a colonne inesistenti.
drop policy if exists "foto approvate visibili" on public.foto;
-- (le policy corrette "foto leggibili da tutti", "utenti loggati caricano foto",
--  "autori cancellano le proprie foto", "admin cancella foto" restano)

-- 5) Diagnostica finale: elenca le policy attive su profiles.
--    Esegui SOLO questa parte per controllare il risultato.
-- select policyname, cmd, qual, with_check
-- from pg_policies where tablename = 'profiles';
