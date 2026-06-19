'use client';

import { useState, useRef } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase-browser';
import { useAuth } from './AuthProvider';

interface Props {
  onAvviato: (motoId: string, marca: string, modello: string, anno?: number) => void;
}

const MARCHE = ['Aprilia','Benelli','BMW','Ducati','Honda','Husqvarna','Indian','Kawasaki','KTM','Moto Guzzi','Royal Enfield','Suzuki','Triumph','Yamaha','Altro'];

export default function CreaGemello({ onAvviato }: Props) {
  const { user } = useAuth();
  const [step, setStep] = useState<'dati' | 'foto' | 'invio'>('dati');
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
    if (lato === 'sx') { setFotoSx(file); setPrevSx(url); }
    else { setFotoDx(file); setPrevDx(url); }
  }

  async function avvia() {
    if (!user || !fotoSx) return;
    setCaricando(true);
    setErrore('');
    const sb = getSupabaseBrowser();
    if (!sb) { setErrore('Supabase non disponibile'); setCaricando(false); return; }

    try {
      // 1. Crea record moto nel DB
      const { data: moto, error: mErr } = await sb.from('moto').insert({
        utente_id: user.id,
        marca: marca.trim(),
        modello: modello.trim(),
        anno: anno ? parseInt(anno) : null,
        stato: 'bozza',
      }).select('id').single();
      if (mErr || !moto) throw new Error(mErr?.message ?? 'Errore creazione moto');

      const motoId = moto.id;

      // 2. Upload foto sinistra in Supabase Storage
      const extSx = fotoSx.name.split('.').pop() ?? 'jpg';
      const pathSx = `${user.id}/${motoId}/sx.${extSx}`;
      const { error: upSxErr } = await sb.storage.from('foto-moto').upload(pathSx, fotoSx, { upsert: true });
      if (upSxErr) throw new Error(`Upload foto SX: ${upSxErr.message}`);

      // URL firmato per 1h (foto privata)
      const { data: signedSx } = await sb.storage.from('foto-moto').createSignedUrl(pathSx, 3600);
      const fotoSxUrl = signedSx?.signedUrl ?? '';

      // 3. Upload foto destra (opzionale)
      let fotoDxUrl = '';
      if (fotoDx) {
        const extDx = fotoDx.name.split('.').pop() ?? 'jpg';
        const pathDx = `${user.id}/${motoId}/dx.${extDx}`;
        await sb.storage.from('foto-moto').upload(pathDx, fotoDx, { upsert: true });
        const { data: signedDx } = await sb.storage.from('foto-moto').createSignedUrl(pathDx, 3600);
        fotoDxUrl = signedDx?.signedUrl ?? '';
      }

      // Salva URL foto nel record
      await sb.from('moto').update({ foto_sx_url: pathSx, foto_dx_url: fotoDx ? `${user.id}/${motoId}/dx.${fotoDx.name.split('.').pop()}` : null }).eq('id', motoId);

      // 4. Avvia generazione via API route
      const res = await fetch('/api/genera-moto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motoId, fotoSxUrl, fotoDxUrl }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.errore ?? 'Errore avvio generazione');

      onAvviato(motoId, marca.trim(), modello.trim(), anno ? parseInt(anno) : undefined);

    } catch (e: unknown) {
      setErrore(e instanceof Error ? e.message : String(e));
      setCaricando(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-segnale">Nuovo gemello digitale</p>
        <h2 className="mt-1 font-display text-3xl font-bold uppercase tracking-tight">Crea la tua moto in 3D</h2>
        <p className="mt-2 text-sm text-asfalto/60">Servono solo 2 foto. L'AI ricostruisce il resto.</p>
      </div>

      {/* Stepper */}
      <div className="flex gap-2">
        {(['dati','foto','invio'] as const).map((s, i) => (
          <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${step === s || (i < ['dati','foto','invio'].indexOf(step)) ? 'bg-segnale' : 'bg-asfalto/20'}`}/>
        ))}
      </div>

      {step === 'dati' && (
        <div className="space-y-4">
          <div>
            <label className="label-app">Marca</label>
            <select value={marca} onChange={e => setMarca(e.target.value)} className="input-app">
              <option value="">Seleziona marca…</option>
              {MARCHE.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="label-app">Modello</label>
            <input value={modello} onChange={e => setModello(e.target.value)} placeholder="es. TRK 502X, R1250GS, MT-07…"
              className="input-app" maxLength={60}/>
          </div>
          <div>
            <label className="label-app">Anno (opzionale)</label>
            <input type="number" value={anno} onChange={e => setAnno(e.target.value)} placeholder="es. 2022"
              className="input-app" min={1950} max={2030}/>
          </div>
          <button type="button" disabled={!marca || !modello}
            onClick={() => setStep('foto')}
            className="tap w-full rounded-app bg-segnale py-3 font-mono font-medium uppercase text-asfalto disabled:opacity-40">
            Avanti →
          </button>
        </div>
      )}

      {step === 'foto' && (
        <div className="space-y-5">
          <div className="rounded-app border border-dashed border-bosco/40 bg-bosco/5 p-4">
            <p className="font-mono text-xs uppercase text-bosco mb-2">📸 Guida fotografica</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="font-medium text-bosco mb-1">✅ Corretto</p>
                <ul className="text-asfalto/60 space-y-0.5 text-xs">
                  <li>• Moto completa nel frame</li>
                  <li>• Luce naturale diffusa</li>
                  <li>• Sfondo semplice/neutro</li>
                  <li>• Inquadratura laterale</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-red-400 mb-1">❌ Da evitare</p>
                <ul className="text-asfalto/60 space-y-0.5 text-xs">
                  <li>• Moto tagliata</li>
                  <li>• Controluce</li>
                  <li>• Oggetti davanti</li>
                  <li>• Foto troppo vicina</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Upload lato sinistro */}
          <div>
            <p className="label-app">Foto lato sinistro <span className="text-red-400">*</span></p>
            <div onClick={() => refSx.current?.click()}
              className={`tap relative flex cursor-pointer items-center justify-center rounded-app border-2 border-dashed transition-colors ${fotoSx ? 'border-bosco' : 'border-guardrail/30 hover:border-segnale'}`}
              style={{ height: 140 }}>
              {prevSx
                ? <img src={prevSx} alt="" className="h-full w-full object-contain rounded-app p-1"/>
                : <div className="text-center"><p className="text-3xl">📷</p><p className="mt-1 font-mono text-xs uppercase text-asfalto/50">Lato sinistro</p></div>
              }
              <input ref={refSx} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                onChange={e => e.target.files?.[0] && onFile(e.target.files[0], 'sx')}/>
            </div>
          </div>

          {/* Upload lato destro */}
          <div>
            <p className="label-app">Foto lato destro <span className="text-asfalto/40">(consigliato)</span></p>
            <div onClick={() => refDx.current?.click()}
              className={`tap relative flex cursor-pointer items-center justify-center rounded-app border-2 border-dashed transition-colors ${fotoDx ? 'border-bosco' : 'border-guardrail/30 hover:border-segnale'}`}
              style={{ height: 140 }}>
              {prevDx
                ? <img src={prevDx} alt="" className="h-full w-full object-contain rounded-app p-1"/>
                : <div className="text-center"><p className="text-3xl">📷</p><p className="mt-1 font-mono text-xs uppercase text-asfalto/50">Lato destro</p></div>
              }
              <input ref={refDx} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                onChange={e => e.target.files?.[0] && onFile(e.target.files[0], 'dx')}/>
            </div>
          </div>

          {errore && <p className="font-mono text-xs text-red-400">{errore}</p>}

          <div className="flex gap-3">
            <button type="button" onClick={() => setStep('dati')}
              className="tap flex-1 rounded-app border border-guardrail/30 py-3 font-mono text-sm uppercase text-asfalto/60">
              ← Indietro
            </button>
            <button type="button" disabled={!fotoSx || caricando} onClick={avvia}
              className="tap flex-[2] rounded-app bg-segnale py-3 font-mono font-medium uppercase text-asfalto disabled:opacity-40">
              {caricando ? 'Caricamento…' : 'Genera il gemello 🏍'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
