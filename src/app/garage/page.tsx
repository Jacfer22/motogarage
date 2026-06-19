'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { getSupabaseBrowser } from '@/lib/supabase-browser';
import ConfiguratoreMoto from '@/components/ConfiguratoreMoto';
import MotoSVG from '@/components/MotoSVG';
import type { TipoMoto, MotoConfig } from '@/components/MotoSVG';
import type { Profilo } from '@/components/AuthProvider';

interface GiroSummary {
  id: string;
  nome: string;
  km: number;
  durata_sec: number;
  created_at: string;
  curve: number;
  itinerario: { titolo: string; slug: string } | null;
}

function formattaDurata(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return `${h}h ${m.toString().padStart(2, '0')}m`;
}
function formattaData(iso: string) {
  return new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' });
}

function motoConfigDaProfilo(profilo: Profilo | null): MotoConfig {
  return {
    tipo: (profilo?.moto_tipo as TipoMoto) || 'naked',
    colorePrimario: profilo?.moto_colore_primario || '#F2B705',
    coloreSecondario: profilo?.moto_colore_secondario || '#15181A',
    accessori: (profilo?.moto_accessori as string[]) || [],
  };
}

export default function PaginaGarage() {
  const { user, profilo, loading, nonConfigurato } = useAuth();
  const router = useRouter();
  const [giri, setGiri] = useState<GiroSummary[] | null>(null);
  const [mostraConfig, setMostraConfig] = useState(false);
  const [motoConfig, setMotoConfig] = useState<MotoConfig | null>(null);

  useEffect(() => {
    if (!loading && !user && !nonConfigurato) router.push('/accedi');
  }, [loading, user, nonConfigurato, router]);

  useEffect(() => {
    if (profilo) setMotoConfig(motoConfigDaProfilo(profilo));
  }, [profilo]);

  const caricaGiri = useCallback(async () => {
    const supabase = getSupabaseBrowser();
    if (!supabase || !user) return;
    const { data } = await supabase
      .from('giri')
      .select('id, nome, km, durata_sec, created_at, curve, itinerario:itinerari(titolo, slug)')
      .eq('utente_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    setGiri((data ?? []) as unknown as GiroSummary[]);
  }, [user]);

  useEffect(() => { caricaGiri(); }, [caricaGiri]);

  if (loading) return <div className="mx-auto max-w-2xl px-4 py-14"><div className="skeleton h-8 w-48 rounded-app" /></div>;

  const kmTotali = (giri ?? []).reduce((s, g) => s + (Number(g.km) || 0), 0);
  const config = motoConfig ?? motoConfigDaProfilo(profilo);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 space-y-10">
      {/* Header */}
      <div>
        <p className="font-mono text-sm uppercase tracking-[0.2em] text-cartello">
          {profilo?.username ?? 'Biker'}
        </p>
        <h1 className="mt-1 font-display text-5xl font-bold uppercase leading-none tracking-tight sm:text-6xl">
          Il mio garage
        </h1>
      </div>

      {/* La mia moto */}
      <section>
        <div className="flex items-center justify-between gap-3 border-b-2 border-asfalto pb-3">
          <h2 className="font-display text-2xl font-bold uppercase tracking-tight">La mia moto</h2>
          <button
            type="button"
            onClick={() => setMostraConfig(!mostraConfig)}
            className="tap font-mono text-xs uppercase tracking-wide text-cartello hover:underline"
          >
            {mostraConfig ? 'Chiudi' : 'Personalizza'}
          </button>
        </div>

        {mostraConfig ? (
          <div className="mt-4">
            <ConfiguratoreMoto
              configIniziale={config}
              onSalvato={(c) => { setMotoConfig(c); setMostraConfig(false); }}
            />
          </div>
        ) : (
          <div className="mt-4 rounded-app-lg bg-asfalto p-4 flex items-center justify-center">
            <MotoSVG
              tipo={config.tipo}
              colorePrimario={config.colorePrimario}
              coloreSecondario={config.coloreSecondario}
              accessori={config.accessori}
              className="w-full max-w-sm"
            />
          </div>
        )}
      </section>

      {/* Statistiche */}
      <section>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Giri registrati', val: giri?.length ?? '—' },
            { label: 'Km totali', val: giri ? `${Math.round(kmTotali)}` : '—' },
            { label: 'Itinerari fatti', val: giri ? giri.filter((g) => g.itinerario).length : '—' },
          ].map((s) => (
            <div key={s.label} className="card-app p-4 text-center">
              <p className="font-display text-3xl font-bold">{s.val}</p>
              <p className="font-mono text-[11px] uppercase tracking-wide text-asfalto/55">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Giri registrati */}
      <section>
        <div className="flex items-center justify-between gap-3 border-b-2 border-asfalto pb-3">
          <h2 className="font-display text-2xl font-bold uppercase tracking-tight">Giri registrati</h2>
          <Link href="/traccia" className="tap font-mono text-xs uppercase tracking-wide text-bosco hover:underline">
            + Registra giro
          </Link>
        </div>

        {giri === null ? (
          <div className="mt-4 space-y-3">
            {[0, 1, 2].map((i) => <div key={i} className="skeleton h-16 rounded-app" />)}
          </div>
        ) : giri.length === 0 ? (
          <div className="mt-6 rounded-app border border-dashed border-asfalto/20 p-8 text-center">
            <p className="font-display text-xl uppercase tracking-tight text-asfalto/40">Nessun giro ancora</p>
            <Link href="/traccia" className="tap mt-3 inline-block rounded-app bg-segnale px-5 py-2.5 font-mono text-sm font-medium uppercase text-asfalto">
              Traccia il primo giro
            </Link>
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {giri.map((g) => (
              <li key={g.id} className="card-app flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="font-mono text-sm font-medium uppercase truncate">{g.nome}</p>
                  {g.itinerario && (
                    <Link href={`/itinerari/${g.itinerario.slug}`}
                      className="font-mono text-[11px] uppercase text-bosco hover:underline truncate block">
                      → {g.itinerario.titolo}
                    </Link>
                  )}
                  <p className="font-mono text-[11px] text-asfalto/50">{formattaData(g.created_at)}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-display text-2xl font-bold">{Math.round(g.km)}<span className="text-sm"> km</span></p>
                  <p className="font-mono text-[11px] text-asfalto/50">{formattaDurata(g.durata_sec)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Link al profilo pubblico */}
      {profilo?.username && (
        <div className="text-center">
          <Link href={`/profilo/${profilo.username}`}
            className="tap font-mono text-sm uppercase tracking-wide text-asfalto/60 hover:text-asfalto">
            Vedi il mio profilo pubblico →
          </Link>
        </div>
      )}
    </div>
  );
}
