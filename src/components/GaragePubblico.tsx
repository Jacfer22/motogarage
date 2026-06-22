'use client';

import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';
import type { GarageMoto } from '@/lib/garage';
import { dataMoto, nomeMoto } from '@/lib/garage';
import Logo from './Logo';

const GarageModelViewer = dynamic(() => import('./GarageModelViewer'), {
  ssr: false,
  loading: () => <div className="skeleton min-h-[600px] bg-black" />,
});

export default function GaragePubblico({ username, moto }: { username: string; moto: GarageMoto[] }) {
  const [selezionataId, setSelezionataId] = useState(moto[0]?.id ?? null);
  const selezionata = useMemo(
    () => moto.find((item) => item.id === selezionataId) ?? moto[0] ?? null,
    [moto, selezionataId],
  );

  return (
    <main className="min-h-[100dvh] bg-[#07080a] pb-20 text-cemento">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(220,38,38,0.18),transparent_32%),linear-gradient(135deg,#0F0B0A,#1B1813_55%,#28282B)]">
        <div className="mx-auto max-w-7xl px-4 py-9">
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-red-400">Garage pubblico</p>
          <h1 className="mt-2 font-display text-5xl font-black uppercase tracking-tight sm:text-7xl">{username}</h1>
          <p className="mt-3 text-sm text-cemento/55">Puoi guardare, ruotare e avvicinarti. Solo il proprietario può modificare le moto.</p>
        </div>
      </section>

      {moto.length === 0 ? (
        <section className="mx-auto grid min-h-[520px] max-w-xl place-items-center px-4 text-center">
          <div>
            <Logo variante="card" className="mx-auto opacity-90" />
            <h2 className="mt-6 font-display text-4xl font-black uppercase">Garage ancora privato</h2>
            <p className="mt-3 text-sm text-cemento/55">Non ci sono gemelli digitali pubblici da visitare.</p>
          </div>
        </section>
      ) : (
        <section className="mx-auto grid max-w-7xl gap-5 px-4 py-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="overflow-hidden rounded-[28px] border border-white/10 bg-black">
            <GarageModelViewer moto={moto} selezionataId={selezionataId} onSeleziona={setSelezionataId} />
          </div>
          <aside className="rounded-[24px] border border-white/10 bg-white/[0.05] p-5">
            {selezionata && (
              <>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-red-400">In esposizione</p>
                <h2 className="mt-2 font-display text-3xl font-black uppercase leading-none">{nomeMoto(selezionata)}</h2>
                <p className="mt-2 font-mono text-xs uppercase text-cemento/45">{selezionata.anno ?? 'Anno non indicato'} · {selezionata.model_format?.toUpperCase()}</p>
                <p className="mt-4 text-xs text-cemento/45">Avatar creato il {dataMoto(selezionata.created_at)}</p>
                {moto.length > 1 && (
                  <div className="mt-6 space-y-2">
                    {moto.map((item) => (
                      <button key={item.id} type="button" onClick={() => setSelezionataId(item.id)} className={`w-full rounded-app border p-3 text-left ${item.id === selezionata.id ? 'border-red-500 bg-red-500/10' : 'border-white/10'}`}>
                        <span className="block font-display text-lg font-black uppercase">{nomeMoto(item)}</span>
                        <span className="font-mono text-[10px] uppercase text-cemento/40">{item.anno ?? 'Anno n/d'}</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </aside>
        </section>
      )}
    </main>
  );
}
