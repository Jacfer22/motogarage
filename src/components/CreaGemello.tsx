'use client';

import { useRef, useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase-browser';
import { useAuth } from './AuthProvider';
import MotoSVG from './MotoSVG';

interface Props {
  onAvviato: (motoId: string, marca: string, modello: string, anno?: number) => void;
}

const MARCHE = ['Aprilia', 'Benelli', 'BMW', 'Ducati', 'Honda', 'Husqvarna', 'Indian', 'Kawasaki', 'KTM', 'Moto Guzzi', 'Royal Enfield', 'Suzuki', 'Triumph', 'Yamaha', 'Altro'];

type Step = 'dati' | 'foto';

export default function CreaGemello({ onAvviato }: Props) {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('dati');
  const [marca, setMarca] = useState('');
  const [modello, setModello] = useState('');
  const [anno, setAnno] = useState('');
  const [fotoSx, setFotoSx] = useState<File | null>(null);
  const [fotoDx, setFotoDx] = useState<File | null>(null);
  const [prevSx, setPrevSx] = useState('');
  const [prevDx, setPrevDx] = useState('');
  const [caricando, setCaricando] = useState(false);
  const [errore, setErrore] = useState('');
  const refSx = useRef<HTMLInputElement>(null);
  const refDx = useRef<HTMLInputElement>(null);

  function onFile(file: File, lato: 'sx' | 'dx') {
    const url = URL.createObjectURL(file);
    if (lato === 'sx') {
      setFotoSx(file);
      setPrevSx(url);
    } else {
      setFotoDx(file);
      setPrevDx(url);
    }
  }

  async function avvia() {
    if (!user || !fotoSx || !fotoDx) return;

    setCaricando(true);
    setErrore('');

    const sb = getSupabaseBrowser();
    if (!sb) {
      setErrore('Supabase non disponibile');
      setCaricando(false);
      return;
    }

    try {
      const { data: moto, error: erroreMoto } = await sb
        .from('moto')
        .insert({
          utente_id: user.id,
          marca: marca.trim(),
          modello: modello.trim(),
          anno: anno ? parseInt(anno, 10) : null,
          stato: 'bozza',
          colore_primario: '#d91414',
          colore_secondario: '#15181a',
        })
        .select('id')
        .single();

      if (erroreMoto || !moto) throw new Error(erroreMoto?.message ?? 'Errore creazione moto');

      const motoId = moto.id;
      const extSx = fotoSx.name.split('.').pop() ?? 'jpg';
      const extDx = fotoDx.name.split('.').pop() ?? 'jpg';
      const pathSx = `${user.id}/${motoId}/sx.${extSx}`;
      const pathDx = `${user.id}/${motoId}/dx.${extDx}`;

      const { error: upSxErr } = await sb.storage.from('foto-moto').upload(pathSx, fotoSx, { upsert: true });
      if (upSxErr) throw new Error(`Upload foto sinistra: ${upSxErr.message}`);

      const { error: upDxErr } = await sb.storage.from('foto-moto').upload(pathDx, fotoDx, { upsert: true });
      if (upDxErr) throw new Error(`Upload foto destra: ${upDxErr.message}`);

      const { data: signedSx } = await sb.storage.from('foto-moto').createSignedUrl(pathSx, 3600);
      const { data: signedDx } = await sb.storage.from('foto-moto').createSignedUrl(pathDx, 3600);

      await sb.from('moto').update({ foto_sx_url: pathSx, foto_dx_url: pathDx }).eq('id', motoId);

      const res = await fetch('/api/genera-moto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motoId, fotoSxUrl: signedSx?.signedUrl ?? '', fotoDxUrl: signedDx?.signedUrl ?? '' }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.errore ?? 'Errore avvio generazione');

      onAvviato(motoId, marca.trim(), modello.trim(), anno ? parseInt(anno, 10) : undefined);
    } catch (e: unknown) {
      setErrore(e instanceof Error ? e.message : String(e));
      setCaricando(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section className="rounded-[30px] border border-asfalto/10 bg-white p-5 shadow-app-lg dark:bg-carbone sm:p-7">
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-segnale">Nuovo gemello digitale</p>
        <h1 className="mt-3 font-display text-4xl font-black uppercase leading-none tracking-tight sm:text-5xl">Crea la tua moto in 3D</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-asfalto/55 dark:text-cemento/55">
          Servono due foto laterali. MotoGarage userà l'AI per ricostruire fronte, retro e dettagli mancanti.
        </p>

        <div className="mt-6 flex gap-2">
          <span className={`h-2 flex-1 rounded-full ${step === 'dati' || step === 'foto' ? 'bg-segnale' : 'bg-asfalto/15'}`} />
          <span className={`h-2 flex-1 rounded-full ${step === 'foto' ? 'bg-segnale' : 'bg-asfalto/15'}`} />
        </div>

        {step === 'dati' && (
          <div className="mt-7 space-y-4">
            <div>
              <label className="label-app">Marca</label>
              <select value={marca} onChange={(e) => setMarca(e.target.value)} className="input-app">
                <option value="">Seleziona marca…</option>
                {MARCHE.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="label-app">Modello</label>
              <input value={modello} onChange={(e) => setModello(e.target.value)} placeholder="es. TRK 502X, MT-07, R1250GS…" className="input-app" maxLength={60} />
            </div>
            <div>
              <label className="label-app">Anno</label>
              <input type="number" value={anno} onChange={(e) => setAnno(e.target.value)} placeholder="es. 2022" className="input-app" min={1950} max={2030} />
            </div>
            <button type="button" disabled={!marca || !modello} onClick={() => setStep('foto')} className="tap w-full rounded-app bg-segnale py-4 font-mono text-sm font-bold uppercase text-asfalto shadow-segnale disabled:opacity-40">
              Continua con le foto →
            </button>
          </div>
        )}

        {step === 'foto' && (
          <div className="mt-7 space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <UploadBox titolo="Lato sinistro" anteprima={prevSx} obbligatorio onClick={() => refSx.current?.click()} />
              <UploadBox titolo="Lato destro" anteprima={prevDx} obbligatorio onClick={() => refDx.current?.click()} />
              <input ref={refSx} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0], 'sx')} />
              <input ref={refDx} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0], 'dx')} />
            </div>

            {errore && <p className="rounded-app bg-red-500/10 px-4 py-3 font-mono text-xs text-red-500">{errore}</p>}

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep('dati')} className="tap flex-1 rounded-app border border-asfalto/10 py-4 font-mono text-xs font-bold uppercase text-asfalto/55">
                ← Indietro
              </button>
              <button type="button" disabled={!fotoSx || !fotoDx || caricando} onClick={avvia} className="tap flex-[2] rounded-app bg-segnale py-4 font-mono text-xs font-bold uppercase text-asfalto shadow-segnale disabled:opacity-40">
                {caricando ? 'Caricamento…' : 'Genera il gemello'}
              </button>
            </div>
          </div>
        )}
      </section>

      <aside className="space-y-4">
        <div className="overflow-hidden rounded-[30px] border border-white/10 bg-[#08090d] p-5 text-cemento shadow-app-lg">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-segnale">Guida foto</p>
          <div className="mt-4 grid gap-3">
            <div className="rounded-[22px] border border-bosco/30 bg-bosco/10 p-4">
              <p className="font-mono text-xs font-bold uppercase text-bosco">Foto corretta</p>
              <div className="mt-3 aspect-[16/9] rounded-app bg-white/5 p-3">
                <MotoSVG tipo="adventure" colorePrimario="#d91414" coloreSecondario="#15181a" className="h-full w-full" />
              </div>
              <p className="mt-3 text-xs text-cemento/55">Moto intera, laterale, sfondo pulito, luce naturale.</p>
            </div>
            <div className="rounded-[22px] border border-red-500/25 bg-red-500/10 p-4 opacity-80">
              <p className="font-mono text-xs font-bold uppercase text-red-400">Da evitare</p>
              <div className="mt-3 aspect-[16/9] overflow-hidden rounded-app bg-white/5 p-3">
                <div className="translate-x-10 scale-125 opacity-60">
                  <MotoSVG tipo="adventure" colorePrimario="#d91414" coloreSecondario="#15181a" className="h-full w-full" />
                </div>
              </div>
              <p className="mt-3 text-xs text-cemento/55">Moto tagliata, troppo vicina, controluce o con oggetti davanti.</p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

function UploadBox({ titolo, anteprima, obbligatorio, onClick }: { titolo: string; anteprima: string; obbligatorio?: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`tap min-h-44 overflow-hidden rounded-[22px] border-2 border-dashed text-left transition-colors ${anteprima ? 'border-bosco bg-bosco/5' : 'border-asfalto/15 bg-asfalto/[0.03] hover:border-segnale'}`}>
      {anteprima ? (
        <img src={anteprima} alt="" className="h-44 w-full object-contain p-2" />
      ) : (
        <div className="grid h-44 place-items-center p-4 text-center">
          <div>
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-asfalto text-2xl text-cemento">📷</div>
            <p className="mt-3 font-mono text-xs font-bold uppercase text-asfalto/70 dark:text-cemento/70">{titolo}</p>
            {obbligatorio && <p className="mt-1 font-mono text-[10px] uppercase text-segnale">obbligatoria</p>}
          </div>
        </div>
      )}
    </button>
  );
}
