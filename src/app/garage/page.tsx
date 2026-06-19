'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { getSupabaseBrowser } from '@/lib/supabase-browser';
import CreaGemello from '@/components/CreaGemello';
import { dataMoto, GarageMoto, nomeMoto, statoMotoLabel, urlModello } from '@/lib/garage';

const GarageModelViewer = dynamic(() => import('@/components/GarageModelViewer'), {
  ssr: false,
  loading: () => <div className="skeleton min-h-[580px] bg-black" />,
});

type Vista = 'garage' | 'crea' | 'viewer';

export default function PaginaGarage() {
  const { user, profilo, loading } = useAuth();
  const router = useRouter();
  const [moto, setMoto] = useState<GarageMoto[]>([]);
  const [vista, setVista] = useState<Vista>('garage');
  const [selezionataId, setSelezionataId] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

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
  const pronte = moto.filter((item) => item.stato === 'pronto' && urlModello(item));

  async function aggiornaMoto(valori: Partial<GarageMoto>) {
    const supabase = getSupabaseBrowser();
    if (!supabase || !selezionata) return;
    setSalvando(true);
    const { error } = await supabase.from('moto').update(valori).eq('id', selezionata.id);
    if (!error) {
      setMoto((elenco) => elenco.map((item) => item.id === selezionata.id ? { ...item, ...valori } : item));
    }
    setSalvando(false);
  }

  if (loading || (!user && !loading)) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="skeleton h-10 w-60 rounded-app" />
        <div className="skeleton mt-6 h-[580px] rounded-app-lg" />
      </div>
    );
  }

  if (vista === 'crea') {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-12">
        <button type="button" onClick={() => setVista('garage')} className="mb-5 rounded-full border border-asfalto/10 bg-white px-4 py-2 font-mono text-xs uppercase tracking-wide shadow-app-sm dark:bg-carbone">
          ← Torna al garage
        </button>
        <CreaGemello onInviato={async () => {
          await caricaMoto();
          setVista('garage');
        }} />
      </div>
    );
  }

  if (vista === 'viewer' && selezionata && urlModello(selezionata)) {
    return (
      <main className="fixed inset-0 z-[80] bg-black">
        <GarageModelViewer moto={[selezionata]} selezionataId={selezionata.id} onSeleziona={() => {}} modalitaViewer />
        <button type="button" onClick={() => setVista('garage')} className="absolute left-4 top-4 z-20 rounded-full border border-white/15 bg-black/70 px-4 py-3 font-mono text-xs font-bold uppercase text-white backdrop-blur">
          ← Chiudi viewer
        </button>
        <a href={urlModello(selezionata)!} download className="absolute bottom-4 right-4 z-20 rounded-app bg-red-600 px-5 py-3 font-mono text-xs font-bold uppercase text-white">
          Scarica {selezionata.model_format?.toUpperCase() ?? 'modello'}
        </a>
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] bg-[#08090b] pb-24 text-cemento sm:pb-12">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(220,38,38,0.20),transparent_30%),linear-gradient(135deg,#050608,#171a20_55%,#050506)]">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 sm:flex-row sm:items-end sm:justify-between sm:py-10">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-red-400">{profilo?.username ?? 'Rider'} / MotoGarage</p>
            <h1 className="mt-2 font-display text-5xl font-black uppercase leading-none tracking-tight sm:text-7xl">Il mio Garage</h1>
            <p className="mt-3 max-w-xl text-sm text-cemento/65 sm:text-base">
              Le tue moto ricostruite come Gaussian Splat fotorealistici, visitabili direttamente dal browser.
            </p>
          </div>
          <button type="button" onClick={() => setVista('crea')} className="inline-flex items-center justify-center rounded-app bg-red-600 px-5 py-4 font-mono text-sm font-bold uppercase tracking-wide text-white shadow-[0_8px_28px_rgba(220,38,38,0.3)]">
            ＋ Richiedi gemello digitale
          </button>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-black shadow-[0_28px_100px_rgba(0,0,0,0.35)]">
          {pronte.length > 0 ? (
            <GarageModelViewer moto={pronte} selezionataId={selezionataId} onSeleziona={setSelezionataId} />
          ) : (
            <div className="grid min-h-[580px] place-items-center bg-[radial-gradient(circle_at_top,rgba(220,38,38,0.18),transparent_30%),#030405] p-6 text-center">
              <div className="max-w-md rounded-[28px] border border-white/10 bg-black/65 p-7 backdrop-blur-xl">
                <img src="/logo-motogarage.svg" alt="" className="mx-auto h-20 w-20" />
                <h2 className="mt-5 font-display text-4xl font-black uppercase tracking-tight text-white">
                  {moto.some((item) => item.stato === 'in_attesa') ? 'Gemello in attesa' : 'Il garage ti aspetta'}
                </h2>
                <p className="mt-3 text-sm leading-6 text-cemento/60">
                  {moto.some((item) => item.stato === 'in_attesa')
                    ? 'La richiesta è arrivata al team MotoGarage. Il file PLY comparirà qui appena approvato.'
                    : 'Invia una foto della tua moto per richiedere il primo gemello digitale.'}
                </p>
                <button type="button" onClick={() => setVista('crea')} className="mt-6 rounded-app bg-red-600 px-6 py-3 font-mono text-xs font-bold uppercase text-white">
                  {profilo?.is_pro || profilo?.is_admin ? 'Invia la moto' : 'Scopri la funzione Pro'}
                </button>
              </div>
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-[24px] border border-white/10 bg-white/[0.06] p-5 backdrop-blur">
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-red-400">Moto selezionata</p>
            {selezionata ? (
              <>
                <h2 className="mt-2 font-display text-3xl font-black uppercase leading-none tracking-tight text-white">{nomeMoto(selezionata)}</h2>
                <p className="mt-2 font-mono text-xs uppercase text-cemento/45">{selezionata.anno ?? 'Anno non indicato'} · {statoMotoLabel(selezionata.stato)}</p>
                <p className="mt-3 text-xs text-cemento/45">Richiesta del {dataMoto(selezionata.created_at)}</p>

                {selezionata.stato !== 'pronto' && selezionata.foto_sx_signed_url && (
                  <div className="mt-5 grid grid-cols-2 gap-2">
                    <img src={selezionata.foto_sx_signed_url} alt="Foto principale" className="aspect-square w-full rounded-app bg-black object-contain" />
                    {selezionata.foto_dx_signed_url && <img src={selezionata.foto_dx_signed_url} alt="Foto secondaria" className="aspect-square w-full rounded-app bg-black object-contain" />}
                  </div>
                )}

                {selezionata.stato === 'pronto' && (
                  <label className="mt-5 flex items-center justify-between gap-4 rounded-app border border-white/10 p-3">
                    <span>
                      <span className="block font-mono text-xs font-bold uppercase text-white">Garage pubblico</span>
                      <span className="block text-[11px] text-cemento/45">Visibile dal tuo profilo</span>
                    </span>
                    <input type="checkbox" checked={selezionata.is_public} onChange={(event) => aggiornaMoto({ is_public: event.target.checked })} disabled={salvando} className="h-5 w-5 accent-red-600" />
                  </label>
                )}

                <div className="mt-5 flex flex-col gap-2">
                  {urlModello(selezionata) && (
                    <button type="button" onClick={() => setVista('viewer')} className="rounded-app bg-white px-4 py-3 font-mono text-xs font-bold uppercase text-asfalto">Apri viewer 3D</button>
                  )}
                  {profilo?.username && selezionata.stato === 'pronto' && (
                    <Link href={`/garage/${profilo.username}`} className="rounded-app border border-white/15 px-4 py-3 text-center font-mono text-xs font-bold uppercase text-cemento/70">Anteprima visitatore</Link>
                  )}
                </div>
              </>
            ) : (
              <p className="mt-3 text-sm text-cemento/55">Non hai ancora moto nel garage.</p>
            )}
          </div>

          {moto.length > 1 && (
            <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
              <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-cemento/45">Le tue moto</p>
              <div className="space-y-2">
                {moto.map((item) => (
                  <button key={item.id} type="button" onClick={() => setSelezionataId(item.id)} className={`w-full rounded-app border p-3 text-left ${item.id === selezionata?.id ? 'border-red-500 bg-red-500/10' : 'border-white/10 bg-black/20'}`}>
                    <span className="block truncate font-display text-lg font-black uppercase text-white">{nomeMoto(item)}</span>
                    <span className="font-mono text-[10px] uppercase text-cemento/45">{statoMotoLabel(item.stato)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}
