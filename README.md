# GiroSecco

Itinerari moto curati nel Lazio. Next.js 15 + Supabase + Vercel.

## Vederlo SUBITO (senza Supabase)

Il sito ha dati di fallback integrati: funziona anche senza database
(itinerari, avvisi). Login/registrazione mostrano un messaggio finché
Supabase non è collegato.

```bash
npm install
npm run dev
```

Apri http://localhost:3000 — vedi già i 10 itinerari con mappe e avvisi demo.

## Collegare Supabase (10 minuti)

1. Vai su supabase.com → New project → nome `girosecco`
2. SQL Editor → New query → incolla `supabase/schema.sql` → Run
3. New query → incolla `supabase/seed.sql` → Run
4. New query → incolla `supabase/migration_admin.sql` → Run (ti rende admin)
5. New query → incolla `supabase/migration_profilo.sql` → Run (categoria moto + foto profilo)
6. Project Settings → API → copia URL e anon key
7. Crea `.env.local` (copia da `.env.local.example`) e incolla i valori
8. Riavvia `npm run dev` — ora i dati arrivano dal database

> Su un progetto già esistente (creato prima di queste due migrazioni):
> esegui solo i passi 4 e 5, lo schema base resta quello che hai già.

### Livelli account

Il sito mostra contenuti diversi in base a chi sei:

- **Anonimo**: home, descrizione e avvisi (sicurezza) di ogni itinerario.
- **Registrato (free)**: + mappa, roadbook e GPX per i 6 itinerari free.
- **Pro**: + mappa, roadbook, GPX, variante e weekend per i 4 itinerari Pro.
- **Admin** (solo il tuo account): + pannello `/admin` per attivare/disattivare
  avvisi e rendere Pro un utente con un click.

### Autenticazione

La registrazione richiede username, email e password. Supabase invia
un'email di conferma con un link: l'utente deve cliccarlo prima di poter
accedere. Lo schema crea `profiles` con un trigger che, alla conferma,
salva anche l'username scelto (con un fallback automatico se è già in uso).

**Configurazione necessaria in Supabase** (Authentication → URL
Configuration):
- **Site URL**: l'URL del sito pubblicato (es. `https://girosecco.it` o
  l'URL di anteprima Vercel)
- **Redirect URLs**: aggiungi anche `http://localhost:3000/accedi` se vuoi
  testare in locale

Il link nell'email di conferma riporta l'utente su `/accedi`, dove può
fare login.

Per rendere "Pro" un utente: Table Editor → `profiles` → metti `is_pro` a
`true` sulla sua riga (in futuro lo farà Stripe in automatico).

## Deploy su Vercel

1. Push del progetto su GitHub
2. vercel.com → Import project → seleziona il repo
3. Environment Variables: aggiungi `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

## Struttura

- `src/app/page.tsx` — homepage con griglia itinerari + badge avvisi
- `src/app/itinerari/[slug]/page.tsx` — dettaglio: avvisi, mappa, roadbook, contenuti Pro
- `src/app/pro/page.tsx` — pagina Pro (pricing)
- `src/app/accedi/page.tsx` — login/registrazione
- `src/app/account/page.tsx` — stato account, logout
- `src/components/AuthProvider.tsx` — contesto sessione utente
- `src/components/AvvisoBanner.tsx` — banner chiusure/lavori/consigli
- `src/components/MappaItinerario.tsx` — mappa Leaflet con tracciato reale
- `src/lib/fallback.ts` — dati statici di emergenza (= seed.sql)
- `supabase/schema.sql` — schema completo: itinerari, tappe, avvisi, profiles+trigger, Fase 2

## Roadmap

- **Fase 1 (ora):** catalogo itinerari + GPX free/pro + avvisi real-time
- **Fase 1.5 (ora):** login/registrazione utenti
- **Fase 2 (~50 utenti):** commenti, foto utenti, segnalazioni soste
- **Fase 3:** forum, pagamenti Stripe per Pro

## Per aggiungere un itinerario o un avviso

Dal Table Editor di Supabase: insert in `itinerari` + `tappe`, oppure in
`avvisi` (basta `itinerario_id`, `tipo`, `titolo`, `descrizione`). Gli avvisi
con `attivo = false` non vengono mostrati.
