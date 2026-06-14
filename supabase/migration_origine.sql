-- Migrazione: distingue percorsi verificati dai "classici"
-- Esegui in Supabase: SQL Editor → New query → incolla tutto → Run

alter table public.itinerari
  add column origine text not null default 'verificato'
  check (origine in ('verificato','classico'));

-- I 10 itinerari del Lazio restano 'verificato' (default). I classici delle
-- altre regioni vanno inseriti separatamente con origine = 'classico'.
