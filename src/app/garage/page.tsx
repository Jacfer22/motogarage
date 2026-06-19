'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { getSupabaseBrowser } from '@/lib/supabase-browser';
import CreaGemello from '@/components/CreaGemello';
import GenerazioneProgress from '@/components/GenerazioneProgress';
import { dataMoto, GarageMoto, nomeMoto, statoMotoLabel, urlModello } from '@/lib/garage';
import EditorSchedaMoto from '@/components/EditorSchedaMoto';
import { risolviCategoriaMoto } from '@/lib/foto-categoria-moto';
import { normalizzaScheda, type SchedaModifiche } from '@/lib/scheda-moto';
import { richiedeApprovazioneAdmin } from '@/lib/garage-limite';

const GarageAmbiente = dynamic(() => import('@/components/GarageAmbiente'), {
  ssr: false,
  loading: () => <div className="garage-ambiente-loader" />,
});

const GarageModelViewer = dynamic(() => import('@/components/GarageModelViewer'), {
  ssr: false,
});

type Vista = 'garage' | 'crea' | 'viewer' | 'generazione';

export default function PaginaGarage() {
  const { user, profilo, loading } = useAuth();
  const router = useRouter();
  const [moto, setMoto] = useState<GarageMoto[]>([]);
  const [vista, setVista] = useState<Vista>('garage');
  const [selezionataId, setSelezionataId] = useState<string | null>(null);
  const [generazioneId, setGenerazioneId] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace('/accedi');
  }, [loading, user, router]);

  const caricaMoto = useCallback(async () => {
    const supabase = getSupabaseBrowser();
    if (!supabase || !user) return;
    const { data } = await supabase
      .from('moto')
      .select('*')
      .eq('utente_id', user.id)
      .order('created_at', { ascending: false });
    const elenco = (data ?? []) as GarageMoto[];
    const arricchite = await Promise.all(elenco.map(async (item) => {
      const [principale, secondaria] = await Promise.all([
        item.foto_sx_url
          ? supabase.storage.from('foto-moto').createSignedUrl(item.foto_sx_url, 3600)
          : Promise.resolve({ data: null }),
        item.foto_dx_url
          ? supabase.storage.from('foto-moto').createSignedUrl(item.foto_dx_url, 3600)
          : Promise.resolve({ data: null }),
      ]);
      return {
        ...item,
        foto_sx_signed_url: principale.data?.signedUrl ?? null,
        foto_dx_signed_url: secondaria.data?.signedUrl ?? null,
      };
    }));
    setMoto(arricchite);
    setSelezionataId((attuale) => attuale ?? arricchite[0]?.id ?? null);
  }, [user]);

  useEffect(() => {
    caricaMoto();
  }, [caricaMoto]);

  const selezionata = useMemo(
    () => moto.find((item) => item.id === selezionataId) ?? moto[0] ?? null,
    [moto, selezionataId],
  );
  const motoGenerazione = useMemo(
    () => moto.find((item) => item.id === generazioneId) ?? null,
    [moto, generazioneId],
  );
  const pronte = moto.filter((item) => item.stato === 'pronto' && urlModello(item));

  useEffect(() => {
    if (vista !== 'generazione' || !generazioneId || !user) return;

    let attivo = true;
    const poll = async () => {
      const supabase = getSupabaseBrowser();
      if (!supabase) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      try {
        const risposta = await fetch(`/api/garage/status?motoId=${generazioneId}`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!risposta.ok || !attivo) return;
        const json = await risposta.json() as { moto?: GarageMoto };
        if (!json.moto) return;

        setMoto((elenco) => elenco.map((item) => (
          item.id === json.moto!.id ? { ...item, ...json.moto } : item
        )));

        if (json.moto.stato === 'pronto') {
          setSelezionataId(json.moto.id);
        }
      } catch {
        // polling silenzioso
      }
    };

    poll();
    const timer = window.setInterval(poll, 3000);
    return () => {
      attivo = false;
      window.clearInterval(timer);
    };
  }, [vista, generazioneId, user]);

  async function aggiornaMoto(valori: Partial<GarageMoto>) {
    const supabase = getSupabaseBrowser();
    if (!supabase || !selezionata) return false;
    setSalvando(true);
    const { error } = await supabase.from('moto').update(valori).eq('id', selezionata.id);
    if (error) {
      if (error.message.includes('categoria') || error.message.includes('scheda_modifiche')) {
        setErrore('Esegui migration_moto_scheda.sql su Supabase (SQL Editor), poi riprova.');
      }
      setSalvando(false);
      return false;
    }
    setMoto((elenco) => elenco.map((item) => item.id === selezionata.id ? { ...item, ...valori } : item));
    setSalvando(false);
    return true;
  }

  async function eliminaMoto(motoId?: string) {
    const target = motoId ? moto.find((item) => item.id === motoId) : selezionata;
    if (!target || !user) return;
    const conferma = window.confirm(
      `Eliminare ${nomeMoto(target)} dal garage?\n\nFoto e gemello 3D verranno rimossi. L'operazione non si può annullare.`,
    );
    if (!conferma) return;

    const supabase = getSupabaseBrowser();
    if (!supabase) return;

    setSalvando(true);
    setErrore(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Sessione scaduta. Accedi di nuovo.');

      const risposta = await fetch('/api/garage/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ motoId: target.id }),
      });
      const json = await risposta.json() as { errore?: string };
      if (!risposta.ok) throw new Error(json.errore ?? 'Eliminazione non riuscita.');

      const idRimosso = target.id;
      if (generazioneId === idRimosso) {
        setGenerazioneId(null);
        setVista('garage');
      }

      const { data } = await supabase
        .from('moto')
        .select('*')
        .eq('utente_id', user.id)
        .order('created_at', { ascending: false });
      const elenco = (data ?? []) as GarageMoto[];
      const arricchite = await Promise.all(elenco.map(async (item) => {
        const [principale, secondaria] = await Promise.all([
          item.foto_sx_url
            ? supabase.storage.from('foto-moto').createSignedUrl(item.foto_sx_url, 3600)
            : Promise.resolve({ data: null }),
          item.foto_dx_url
            ? supabase.storage.from('foto-moto').createSignedUrl(item.foto_dx_url, 3600)
            : Promise.resolve({ data: null }),
        ]);
        return {
          ...item,
          foto_sx_signed_url: principale.data?.signedUrl ?? null,
          foto_dx_signed_url: secondaria.data?.signedUrl ?? null,
        };
      }));

      setMoto(arricchite);
      setSelezionataId((attuale) => {
        if (attuale && attuale !== idRimosso) return attuale;
        return arricchite[0]?.id ?? null;
      });
    } catch (error) {
      setErrore(error instanceof Error ? error.message : 'Eliminazione non riuscita.');
    } finally {
      setSalvando(false);
    }
  }

  if (loading || (!user && !loading)) {
    return <div className="garage-ambiente-loader" />;
  }

  if (vista === 'viewer' && selezionata && urlModello(selezionata)) {
    return (
      <main className="fixed inset-0 z-[80] bg-black">
        <GarageModelViewer moto={[selezionata]} selezionataId={selezionata.id} onSeleziona={() => {}} modalitaViewer />
        <button type="button" onClick={() => setVista('garage')} className="absolute left-4 top-4 z-20 rounded-full border border-white/15 bg-black/70 px-4 py-3 font-mono text-xs font-bold uppercase text-white backdrop-blur">
          ← Chiudi viewer
        </button>
        <a href={urlModello(selezionata)!} download className="absolute bottom-4 right-4 z-20 rounded-app bg-brand px-5 py-3 font-mono text-xs font-bold uppercase text-white">
          Scarica {selezionata.model_format?.toUpperCase() ?? 'modello'}
        </a>
      </main>
    );
  }

  const inElaborazione = moto.some((item) => item.stato === 'elaborazione');
  const inApprovazione = moto.some((item) => richiedeApprovazioneAdmin(item.provider));
  const fotoAnteprima = selezionata?.foto_sx_signed_url
    ?? moto.find((item) => item.foto_sx_signed_url)?.foto_sx_signed_url
    ?? null;

  return (
    <main className="garage-pagina-wrap">
      <GarageAmbiente
        motoPronte={pronte}
        selezionataId={selezionataId}
        onSeleziona={setSelezionataId}
        fotoAnteprima={pronte.length === 0 ? fotoAnteprima : null}
        mostraViewer={vista === 'garage'}
      >
        {/* Mobile: selettore moto sotto il viewer */}
        {moto.length > 1 && vista === 'garage' && (
          <div className="garage-moto-scroll-mobile">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-cemento/50">Le tue moto</p>
            <div className="garage-moto-scroll-track">
              {moto.map((item) => (
                <div key={item.id} className="garage-moto-chip-wrap">
                  <button
                    type="button"
                    onClick={() => setSelezionataId(item.id)}
                    className={`garage-moto-chip ${item.id === selezionata?.id ? 'garage-moto-chip-attiva' : ''}`}
                  >
                    <span className="block truncate font-display text-sm font-black uppercase text-white">{nomeMoto(item)}</span>
                    <span className="font-mono text-[9px] uppercase text-cemento/45">{statoMotoLabel(item.stato, item.provider)}</span>
                  </button>
                  <button
                    type="button"
                    title={`Elimina ${nomeMoto(item)}`}
                    disabled={salvando}
                    onClick={() => eliminaMoto(item.id)}
                    className="garage-moto-chip-elimina"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="garage-ui-pannello">
          <div className="garage-ui-header">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-brand-chiaro">
                {profilo?.username ?? 'Rider'} / MotoGarage
              </p>
              <h1 className="mt-1 font-display text-2xl font-black uppercase leading-none tracking-tight text-white sm:text-3xl">
                Il mio Garage
              </h1>
            </div>
            <button
              type="button"
              onClick={() => setVista(vista === 'crea' ? 'garage' : 'crea')}
              className="shrink-0 rounded-app bg-brand px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-wide text-white shadow-brand"
            >
              {vista === 'crea' ? '← Garage' : '＋ Gemello'}
            </button>
          </div>

          {vista === 'crea' ? (
            <div className="garage-ui-scroll mt-4">
              <CreaGemello onInviato={async (motoId, tipo) => {
                await caricaMoto();
                if (tipo === 'generazione') {
                  setGenerazioneId(motoId);
                  setVista('generazione');
                } else {
                  setSelezionataId(motoId);
                  setVista('garage');
                }
              }} />
            </div>
          ) : vista === 'generazione' && motoGenerazione ? (
            <div className="garage-ui-scroll mt-4">
              <GenerazioneProgress
                marca={motoGenerazione.marca}
                modello={motoGenerazione.modello}
                anno={motoGenerazione.anno}
                percentualeReale={motoGenerazione.progress ?? null}
                completato={motoGenerazione.stato === 'pronto'}
                errore={motoGenerazione.stato === 'errore' ? motoGenerazione.errore : null}
                onApriGarage={async () => {
                  const id = generazioneId;
                  await caricaMoto();
                  if (id) setSelezionataId(id);
                  setVista('garage');
                  setGenerazioneId(null);
                }}
              />
            </div>
          ) : (
            <>
              {(inElaborazione || inApprovazione) && (
                <div className="mt-4 rounded-app border border-white/10 bg-black/50 p-4 backdrop-blur">
                  {inElaborazione && (
                    <button
                      type="button"
                      onClick={() => {
                        const item = moto.find((m) => m.stato === 'elaborazione');
                        if (item) {
                          setGenerazioneId(item.id);
                          setVista('generazione');
                        }
                      }}
                      className="w-full rounded-app border border-brand/30 bg-brand/10 px-4 py-3 font-mono text-[10px] font-bold uppercase text-brand-chiaro"
                    >
                      Segui generazione in corso
                    </button>
                  )}
                  {inApprovazione && (
                    <p className="font-mono text-[10px] uppercase leading-relaxed text-amber-300/80">
                      Una richiesta è in attesa di approvazione admin (limite 1/ora).
                    </p>
                  )}
                </div>
              )}

              <div className="mt-4 rounded-[20px] border border-white/10 bg-black/55 p-4 backdrop-blur-xl">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-brand-chiaro">Moto selezionata</p>
                {selezionata ? (
                  <>
                    <h2 className="mt-2 font-display text-2xl font-black uppercase leading-none tracking-tight text-white">
                      {nomeMoto(selezionata)}
                    </h2>
                    <p className="mt-2 font-mono text-[10px] uppercase text-cemento/45">
                      {selezionata.anno ?? 'Anno non indicato'} · {statoMotoLabel(selezionata.stato, selezionata.provider)}
                    </p>
                    <p className="mt-2 text-[11px] text-cemento/40">Richiesta del {dataMoto(selezionata.created_at)}</p>

                    {richiedeApprovazioneAdmin(selezionata.provider) && (
                      <p className="mt-4 rounded-app border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-200/90">
                        In attesa della mia approvazione. Riceverai il gemello 3D appena avviata la generazione.
                      </p>
                    )}

                    {selezionata.stato === 'pronto' && (
                      <label className="mt-4 flex items-center justify-between gap-4 rounded-app border border-white/10 p-3">
                        <span>
                          <span className="block font-mono text-[10px] font-bold uppercase text-white">Garage pubblico</span>
                          <span className="block text-[10px] text-cemento/45">Visibile dal tuo profilo</span>
                        </span>
                        <input type="checkbox" checked={selezionata.is_public} onChange={(event) => aggiornaMoto({ is_public: event.target.checked })} disabled={salvando} className="h-5 w-5 accent-brand" />
                      </label>
                    )}

                    <div className="mt-4 border-t border-white/10 pt-4">
                      <EditorSchedaMoto
                        scheda={normalizzaScheda(selezionata.scheda_modifiche)}
                        salvando={salvando}
                        onSalva={async (scheda: SchedaModifiche) => {
                          const categoria = risolviCategoriaMoto(
                            selezionata.categoria,
                            `${selezionata.marca} ${selezionata.modello}`,
                          );
                          await aggiornaMoto({ scheda_modifiche: scheda, categoria });
                        }}
                      />
                    </div>

                    <div className="mt-4 flex flex-col gap-2">
                      {urlModello(selezionata) && (
                        <button type="button" onClick={() => setVista('viewer')} className="rounded-app bg-white px-4 py-3 font-mono text-[10px] font-bold uppercase text-asfalto">
                          Apri viewer 3D
                        </button>
                      )}
                      {profilo?.username && selezionata.stato === 'pronto' && (
                        <Link href={`/garage/${profilo.username}`} className="rounded-app border border-white/15 px-4 py-3 text-center font-mono text-[10px] font-bold uppercase text-cemento/70">
                          Anteprima visitatore
                        </Link>
                      )}
                      <button
                        type="button"
                        onClick={() => eliminaMoto()}
                        disabled={salvando}
                        className="rounded-app border border-red-500/35 bg-red-500/10 px-4 py-3 font-mono text-[10px] font-bold uppercase text-red-300 transition-colors hover:bg-red-500/20 disabled:opacity-40"
                      >
                        {salvando ? 'Eliminazione…' : 'Elimina moto'}
                      </button>
                    </div>
                    {errore && (
                      <p className="mt-3 rounded-app border border-red-500/30 bg-red-950/50 px-3 py-2 text-xs text-red-200">
                        {errore}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="mt-3 text-sm text-cemento/55">Non hai ancora moto nel garage.</p>
                )}
              </div>

              {moto.length > 1 && (
                <div className="garage-moto-list-desktop mt-4 rounded-[20px] border border-white/10 bg-black/40 p-3 backdrop-blur">
                  <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-cemento/45">Le tue moto</p>
                  <div className="max-h-40 space-y-2 overflow-y-auto">
                    {moto.map((item) => (
                      <div key={item.id} className="flex items-stretch gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelezionataId(item.id)}
                          className={`min-w-0 flex-1 rounded-app border p-2.5 text-left ${item.id === selezionata?.id ? 'border-brand bg-brand/10' : 'border-white/10 bg-black/20'}`}
                        >
                          <span className="block truncate font-display text-base font-black uppercase text-white">{nomeMoto(item)}</span>
                          <span className="font-mono text-[9px] uppercase text-cemento/45">{statoMotoLabel(item.stato, item.provider)}</span>
                        </button>
                        <button
                          type="button"
                          title={`Elimina ${nomeMoto(item)}`}
                          disabled={salvando}
                          onClick={() => eliminaMoto(item.id)}
                          className="shrink-0 rounded-app border border-red-500/30 bg-red-500/10 px-2.5 font-mono text-sm text-red-300 hover:bg-red-500/20 disabled:opacity-40"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </GarageAmbiente>
    </main>
  );
}
