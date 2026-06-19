# MotoGarage

> La casa digitale della tua moto.

MotoGarage è una piattaforma Next.js per motociclisti: itinerari, community, tracking GPS, card condivisibili, profili, contenuti Pro e garage virtuali con gemelli digitali Gaussian Splat.

## Funzioni

- Itinerari per regione, mappe, tappe, avvisi e GPX.
- Login, profili, community, foto, commenti, like e blog moderato.
- Tracking GPS, statistiche e card social.
- Livelli free, Pro e admin gestiti da Supabase.
- Garage virtuale responsive.
- Viewer GLB legacy e Gaussian Splat per PLY, SPLAT e KSPLAT.
- Richiesta del gemello digitale riservata ai Pro.
- Coda admin con download delle foto e upload del modello approvato.
- Garage pubblico visitabile da `/garage/[username]`.

## Gaussian Splat

Il file di riferimento `splat (1).ply` è un Gaussian Splat binario:

- 262.144 gaussiane;
- posizione XYZ;
- colore tramite coefficienti `f_dc`;
- opacità;
- scala anisotropa;
- rotazione quaternion.

È compatibile con il formato standard INRIA usato da TriplaneGaussian. Non è una mesh tradizionale, quindi MotoGarage usa un renderer splat dedicato.

Il progetto open source è **TriplaneGaussian (TGS)**, spesso abbreviato informalmente in “Tripo Splat”:

- https://github.com/VAST-AI-Research/TriplaneGaussian

## Flusso gratuito

```text
Utente Pro invia 1–2 foto
            ↓
Richiesta in attesa nell’admin
            ↓
Il team genera il PLY
            ↓
Upload dal pannello admin
            ↓
Pubblicazione automatica nel garage
```

Non viene usata alcuna API GPU a pagamento.

## Pubblicare un modello

1. Apri `/admin`.
2. Vai a **Gemelli da generare**.
3. Scarica Foto 1 ed eventualmente Foto 2.
4. Genera il modello con TriplaneGaussian.
5. Seleziona il file PLY, SPLAT, KSPLAT o GLB.
6. Premi **Pubblica nel garage**.

L’API admin controlla che un PLY contenga gli attributi Gaussian Splat prima di accettarlo.

## Supabase

Su un progetto nuovo:

1. Esegui `supabase/schema.sql`.
2. Esegui le migration necessarie alle funzioni presenti.
3. Esegui per ultima `supabase/migration_motogarage.sql`.

La migration MotoGarage:

- aggiunge `model_url`, formati splat e stato `in_attesa`;
- limita le richieste agli account Pro e admin;
- impedisce agli utenti di auto-approvare il proprio modello;
- mantiene private le foto;
- consente la scrittura dei modelli soltanto all’API admin;
- preserva eventuali vecchi GLB.

Bucket:

- `foto-moto`: privato, massimo 15 MB per foto;
- `modelli-3d`: lettura pubblica, upload solo server-side, massimo 250 MB.

## Variabili ambiente

Tutta la configurazione vive in `.env.local`:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://TUO-PROGETTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

Non servono token AI, servizi GPU o sistemi di pagamento.

## Avvio e test

```bash
npm install
npm run dev
npm run typecheck
npm run build
```

Test manuale:

1. Attiva un utente come Pro dal pannello admin.
2. Accedi con quell’utente e apri `/garage`.
3. Invia una foto principale e una seconda facoltativa.
4. Controlla che la richiesta compaia in `/admin`.
5. Carica un PLY Gaussian Splat.
6. Controlla rotazione, zoom, pan, fullscreen e download.
7. Rendi la moto pubblica e verifica `/garage/[username]`.

## Deploy Vercel

1. Esegui la migration MotoGarage.
2. Configura le quattro variabili di `.env.local` in Vercel.
3. Esegui il deploy.
4. Aggiorna Site URL e Redirect URLs in Supabase Auth.

Il PLY non transita da Git: viene caricato direttamente in Supabase Storage.
