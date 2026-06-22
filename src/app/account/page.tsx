'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getSupabaseBrowser } from '@/lib/supabase-browser';
import { useAuth } from '@/components/AuthProvider';
import { CATEGORIE_MOTO } from '@/lib/categorie-moto';
import AppPageShell from '@/components/AppPageShell';
import AuthWall, { AuthWallLoading } from '@/components/AuthWall';
import { Button, ButtonLink } from '@/components/Button';

const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;

export default function PaginaAccount() {
  const router = useRouter();
  const { user, profilo, loading, nonConfigurato, ricaricaProfilo } = useAuth();
  const supabase = getSupabaseBrowser();

  const [username, setUsername] = useState('');
  const [categoriaMoto, setCategoriaMoto] = useState('');
  const [moto, setMoto] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [salvataggio, setSalvataggio] = useState(false);
  const [caricamentoFoto, setCaricamentoFoto] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);
  const [messaggio, setMessaggio] = useState<string | null>(null);

  useEffect(() => {
    if (profilo) {
      setUsername(profilo.username ?? '');
      setCategoriaMoto(profilo.categoria_moto ?? '');
      setMoto(profilo.moto ?? '');
      setAvatarUrl(profilo.avatar_url ?? null);
    }
  }, [profilo]);

  async function logout() {
    if (!supabase) return;
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  async function salvaProfilo(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase || !user) return;
    setErrore(null);
    setMessaggio(null);

    if (username && !USERNAME_REGEX.test(username)) {
      setErrore('Username: 3-20 caratteri, solo lettere minuscole, numeri e underscore.');
      return;
    }

    setSalvataggio(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        username: username || null,
        categoria_moto: categoriaMoto || null,
        moto: moto || null,
      })
      .eq('id', user.id);
    setSalvataggio(false);

    if (error) {
      setErrore(
        error.message.includes('duplicate') || error.code === '23505'
          ? 'Username già in uso, scegline un altro.'
          : error.message
      );
      return;
    }
    setMessaggio('Profilo aggiornato.');
    ricaricaProfilo();
  }

  async function caricaFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !supabase || !user) return;
    setErrore(null);
    setCaricamentoFoto(true);

    const estensione = file.name.split('.').pop() ?? 'jpg';
    const percorso = `${user.id}/avatar.${estensione}`;

    const { error: erroreUpload } = await supabase.storage
      .from('avatars')
      .upload(percorso, file, { upsert: true });

    if (erroreUpload) {
      setCaricamentoFoto(false);
      setErrore(
        erroreUpload.message.includes('not found')
          ? 'Bucket "avatars" non trovato: esegui supabase/migration_profilo.sql.'
          : erroreUpload.message
      );
      return;
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(percorso);
    // cache-bust per vedere subito la nuova foto
    const url = `${data.publicUrl}?t=${Date.now()}`;

    await supabase.from('profiles').update({ avatar_url: url }).eq('id', user.id);
    setAvatarUrl(url);
    setCaricamentoFoto(false);
    ricaricaProfilo();
  }

  if (nonConfigurato) {
    return (
      <AppPageShell width="narrow">
        <h1 className="font-display text-4xl font-bold uppercase tracking-tight text-white">
          Account non disponibile
        </h1>
        <p className="mt-3 text-cemento/65">
          Il sito non è ancora collegato a Supabase in questo ambiente.
        </p>
      </AppPageShell>
    );
  }

  if (loading) {
    return (
      <AppPageShell width="narrow">
        <AuthWallLoading />
      </AppPageShell>
    );
  }

  if (!user) {
    return (
      <AppPageShell width="narrow">
        <h1 className="font-display text-4xl font-bold uppercase tracking-tight text-white">
          Non hai effettuato l’accesso
        </h1>
        <div className="mt-6">
          <AuthWall
            titolo="Il tuo profilo"
            descrizione="Accedi per gestire username, foto e dati della moto."
            invitaRegistrazione={false}
          />
        </div>
      </AppPageShell>
    );
  }

  return (
    <AppPageShell width="narrow">
      <p className="font-mono text-sm uppercase tracking-widest text-cartello">Account</p>
      <h1 className="mt-1 font-display text-5xl font-bold uppercase leading-none tracking-tight">
        Il tuo profilo
      </h1>

      <div className="mt-6 flex items-center gap-4">
        <label className="group relative block aspect-square w-24 shrink-0 cursor-pointer overflow-hidden border-2 border-asfalto bg-cemento">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <Image
              src="/icon-bike.png"
              alt=""
              width={96}
              height={96}
              className="h-full w-full object-contain p-3 opacity-70"
            />
          )}
          <span className="absolute inset-x-0 bottom-0 bg-asfalto/80 py-1 text-center font-mono text-[10px] uppercase text-cemento opacity-0 transition-opacity group-hover:opacity-100">
            {caricamentoFoto ? '...' : 'Cambia foto'}
          </span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={caricaFoto}
            disabled={caricamentoFoto}
          />
        </label>
        <div>
          {/* Nome pubblico: username (non email) */}
          <p className="font-display text-2xl font-bold uppercase tracking-tight">
            {profilo?.username ?? 'Senza username'}
          </p>
          {!profilo?.username && (
            <p className="mt-1 font-mono text-xs text-cartello">
              ↓ Scegli un username qui sotto
            </p>
          )}
          <p className="mt-2">
            {profilo?.is_admin ? (
              <span className="bg-cartello px-2 py-0.5 font-mono text-xs font-medium uppercase text-cemento">
                Admin
              </span>
            ) : profilo?.is_pro ? (
              <span className="bg-segnale px-2 py-0.5 font-mono text-xs font-medium uppercase text-asfalto">
                Pro attivo
              </span>
            ) : (
              <span className="font-mono text-xs uppercase text-asfalto/50">
                Account free —{' '}
                <Link href="/pro" className="underline">
                  passa a Pro
                </Link>
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Dati privati: visibili solo all'utente loggato, non pubblici */}
      <details className="mt-4 border-2 border-asfalto/20">
        <summary className="cursor-pointer px-3 py-2 font-mono text-xs uppercase tracking-wide text-asfalto/50 hover:text-asfalto">
          Dati riservati (solo tu puoi vederli)
        </summary>
        <div className="border-t border-asfalto/20 px-3 py-3">
          <p className="font-mono text-xs uppercase text-asfalto/40">Email</p>
          <p className="text-sm">{user.email}</p>
        </div>
      </details>

      <form onSubmit={salvaProfilo} className="mt-8 space-y-4">
        <div>
          <label htmlFor="username" className="font-mono text-xs uppercase text-asfalto/60">
            Username
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            className="mt-1 w-full border-2 border-asfalto bg-white px-3 py-2 font-mono lowercase focus:outline-none"
            placeholder="es. jacopo_rm"
            pattern="[a-z0-9_]{3,20}"
            autoCapitalize="none"
          />
        </div>

        <div>
          <label htmlFor="categoria" className="font-mono text-xs uppercase text-asfalto/60">
            Tipo di moto
          </label>
          <select
            id="categoria"
            value={categoriaMoto}
            onChange={(e) => setCategoriaMoto(e.target.value)}
            className="mt-1 w-full border-2 border-asfalto bg-white px-3 py-2 focus:outline-none"
          >
            <option value="">— Seleziona —</option>
            {CATEGORIE_MOTO.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="moto" className="font-mono text-xs uppercase text-asfalto/60">
            Modello
          </label>
          <input
            id="moto"
            type="text"
            value={moto}
            onChange={(e) => setMoto(e.target.value)}
            className="mt-1 w-full border-2 border-asfalto bg-white px-3 py-2 focus:outline-none"
            placeholder="es. Panigale V4 2021, 1100cc"
          />
        </div>

        {errore && (
          <p className="border-2 border-red-700 bg-red-50 p-3 text-sm text-red-900">{errore}</p>
        )}
        {messaggio && (
          <p className="border-2 border-bosco bg-bosco/10 p-3 text-sm text-bosco">{messaggio}</p>
        )}

        <button
          type="submit"
          disabled={salvataggio}
          className="btn-primary tap w-full disabled:opacity-60"
        >
          {salvataggio ? 'Salvo…' : 'Salva profilo'}
        </button>
      </form>

      {profilo?.is_admin && (
        <ButtonLink href="/admin" variant="ghost" className="mt-4">
          Pannello admin
        </ButtonLink>
      )}

      <Button variant="ghost" fullWidth onClick={logout} className="mt-4">
        Esci
      </Button>
    </AppPageShell>
  );
}
