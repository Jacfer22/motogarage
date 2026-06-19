-- MotoGarage — schema completo
-- Esegui in Supabase: SQL Editor → New query → incolla → Run
-- Include già le tabelle Fase 2 (commenti, foto, segnalazioni): pronte ma inattive.

-- ============ FASE 1 ============

create table public.itinerari (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  titolo text not null,
  sottotitolo text not null default '',
  descrizione text not null default '',
  zona text not null default '',
  -- Una o più regioni (slug). Un giro a cavallo del confine ne ha due.
  regioni text[] not null default '{}',
  -- 'verificato' (provato in sella) o 'classico' (strada-icona da fonti pubbliche)
  origine text not null default 'verificato' check (origine in ('verificato','classico')),
  km integer not null default 0,
  durata_ore integer not null default 0,
  difficolta text not null default 'facile' check (difficolta in ('facile','medio','impegnativo')),
  periodo_ideale text not null default '',
  gpx_url text,
  is_premium boolean not null default false,
  cover_url text,
  -- Sequenza di punti [lat,lng] che disegna il percorso reale su strada
  tracciato jsonb not null default '[]'::jsonb,
  -- Contenuti Pro: variante del percorso e pacchetto weekend
  variante_pro text,
  weekend_pro text,
  -- Strada percorsa, solo se verificata con fonte ufficiale (altrimenti null)
  strada text,
  strada_fonte text,
  created_at timestamptz not null default now()
);

create table public.tappe (
  id uuid primary key default gen_random_uuid(),
  itinerario_id uuid not null references public.itinerari(id) on delete cascade,
  ordine integer not null,
  nome text not null,
  tipo text not null default 'sosta' check (tipo in ('partenza','panorama','cibo','benzina','sosta','arrivo')),
  lat double precision not null,
  lng double precision not null,
  note text
);

create index tappe_itinerario_idx on public.tappe (itinerario_id, ordine);

-- Avvisi: stato strade, lavori, consigli stagionali. Aggiornabili senza deploy.
-- Ogni avviso deve avere una fonte verificabile.
create table public.avvisi (
  id uuid primary key default gen_random_uuid(),
  itinerario_id uuid not null references public.itinerari(id) on delete cascade,
  tipo text not null check (tipo in ('chiuso','lavori','info','consiglio')),
  titolo text not null,
  descrizione text not null,
  fonte text not null,
  attivo boolean not null default true,
  data date not null default current_date,
  created_at timestamptz not null default now()
);

create index avvisi_itinerario_idx on public.avvisi (itinerario_id, attivo);

-- ============ AUTENTICAZIONE / PROFILI ============

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  moto text,
  categoria_moto text check (
    categoria_moto in ('naked','sportiva','touring','adventure','custom','cafe_racer','enduro','scooter','vintage','altro')
  ),
  avatar_url text,
  is_pro boolean not null default false,
  is_admin boolean not null default false,
  pro_scadenza timestamptz,
  created_at timestamptz not null default now()
);

-- Crea automaticamente una riga in profiles quando un utente si registra,
-- usando l'username scelto in fase di signUp (options.data.username).
-- Se manca o è già in uso, genera un username di riserva: la registrazione
-- non deve mai fallire per questo.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  scelto text;
begin
  scelto := new.raw_user_meta_data->>'username';
  if scelto is null or length(trim(scelto)) = 0 then
    scelto := 'utente_' || substr(new.id::text, 1, 8);
  end if;

  begin
    insert into public.profiles (id, username) values (new.id, scelto);
  exception when unique_violation then
    insert into public.profiles (id, username) values (new.id, scelto || '_' || substr(new.id::text, 1, 4));
  end;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============ FASE 2 (già pronte) ============

create table public.commenti (
  id uuid primary key default gen_random_uuid(),
  itinerario_id uuid not null references public.itinerari(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  testo text not null,
  created_at timestamptz not null default now()
);

create table public.foto (
  id uuid primary key default gen_random_uuid(),
  itinerario_id uuid not null references public.itinerari(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  url text not null,
  approvata boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.segnalazioni (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  lat double precision not null,
  lng double precision not null,
  tipo text not null check (tipo in ('cibo','sosta','pericolo','panorama','benzina')),
  descrizione text not null,
  voti integer not null default 0,
  created_at timestamptz not null default now()
);

-- Blog: articoli scritti dagli utenti, pubblicati solo dopo revisione admin
create table public.articoli (
  id uuid primary key default gen_random_uuid(),
  autore_id uuid not null references public.profiles(id) on delete cascade,
  titolo text not null,
  contenuto text not null,
  stato text not null default 'in_revisione' check (stato in ('in_revisione','pubblicato','rifiutato')),
  created_at timestamptz not null default now(),
  pubblicato_at timestamptz
);

-- ============ RLS ============

alter table public.itinerari enable row level security;
alter table public.tappe enable row level security;
alter table public.avvisi enable row level security;
alter table public.profiles enable row level security;
alter table public.commenti enable row level security;
alter table public.foto enable row level security;
alter table public.segnalazioni enable row level security;
alter table public.articoli enable row level security;

-- Lettura pubblica del catalogo
create policy "itinerari leggibili da tutti" on public.itinerari for select using (true);
create policy "tappe leggibili da tutti" on public.tappe for select using (true);
create policy "avvisi leggibili da tutti" on public.avvisi for select using (true);

-- Profili: ognuno gestisce il suo
create policy "profili leggibili da tutti" on public.profiles for select using (true);
create policy "ognuno aggiorna il proprio profilo" on public.profiles for update using (auth.uid() = id);
create policy "admin aggiorna profili" on public.profiles for update using (
  exists (select 1 from public.profiles p2 where p2.id = auth.uid() and p2.is_admin = true)
);

create policy "admin aggiorna avvisi" on public.avvisi for update using (
  exists (select 1 from public.profiles p2 where p2.id = auth.uid() and p2.is_admin = true)
);

-- Commenti: lettura pubblica, scrittura solo autenticati
create policy "commenti leggibili da tutti" on public.commenti for select using (true);
create policy "utenti loggati commentano" on public.commenti for insert with check (auth.uid() = user_id);
create policy "autore cancella proprio commento" on public.commenti for delete using (auth.uid() = user_id);

-- Foto: visibili solo se approvate (o all'autore)
create policy "foto approvate visibili" on public.foto for select using (approvata = true or auth.uid() = user_id);
create policy "utenti loggati caricano foto" on public.foto for insert with check (auth.uid() = user_id);

-- Segnalazioni
create policy "segnalazioni leggibili da tutti" on public.segnalazioni for select using (true);
create policy "utenti loggati segnalano" on public.segnalazioni for insert with check (auth.uid() = user_id);

-- Blog: pubblicati visibili a tutti; ognuno vede e modifica i propri articoli
-- mentre sono in revisione; gli admin possono pubblicare/rifiutare qualsiasi articolo
create policy "articoli pubblicati leggibili da tutti" on public.articoli for select using (stato = 'pubblicato');
create policy "autori leggono i propri articoli" on public.articoli for select using (auth.uid() = autore_id);
create policy "utenti loggati scrivono articoli" on public.articoli for insert with check (auth.uid() = autore_id);
create policy "autori modificano i propri articoli in revisione" on public.articoli for update using (
  auth.uid() = autore_id and stato = 'in_revisione'
);
create policy "admin modera articoli" on public.articoli for update using (
  exists (select 1 from public.profiles p2 where p2.id = auth.uid() and p2.is_admin = true)
);
