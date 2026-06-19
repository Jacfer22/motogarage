'use client';

import { useEffect, useRef, useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase-browser';
import { useAuth } from './AuthProvider';
import { risolviCategoriaMoto } from '@/lib/foto-categoria-moto';
import Logo from './Logo';

interface Props {
  onInviato: (motoId: string, tipo: 'generazione' | 'approvazione') => void;
}

const MARCHE = [
  'Aprilia', 'Benelli', 'BMW', 'Ducati', 'Harley-Davidson', 'Honda',
  'Husqvarna', 'Indian', 'Kawasaki', 'KTM', 'Moto Guzzi', 'MV Agusta',
  'Royal Enfield', 'Suzuki', 'Triumph', 'Yamaha', 'Altro',
];
const MAX_FILE_BYTES = 15 * 1024 * 1024;
type Step = 'dati' | 'foto' | 'conferma';

export default function CreaGemello({ onInviato }: Props) {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('dati');
  const [marca, setMarca] = useState('');
  const [modello, setModello] = useState('');
  const [anno, setAnno] = useState('');
  const [fotoPrincipale, setFotoPrincipale] = useState<File | null>(null);
  const [fotoSecondaria, setFotoSecondaria] = useState<File | null>(null);
  const [previewPrincipale, setPreviewPrincipale] = useState('');
  const [previewSecondaria, setPreviewSecondaria] = useState('');
  const [caricando, setCaricando] = useState(false);
  const [errore, setErrore] = useState('');
  const [confermaTipo, setConfermaTipo] = useState<'generazione' | 'approvazione' | null>(null);
  const refPrincipale = useRef<HTMLInputElement>(null);
  const refSecondaria = useRef<HTMLInputElement>(null);
  const urlsCreate = useRef<string[]>([]);

  useEffect(() => () => {
    urlsCreate.current.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  function onFile(file: File, tipo: 'principale' | 'secondaria') {
    setErrore('');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setErrore('Usa un file JPG, PNG o WebP.');
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setErrore('Ogni foto può pesare al massimo 15 MB.');
      return;
    }
    const url = URL.createObjectURL(file);
    urlsCreate.current.push(url);
    if (tipo === 'principale') {
      setFotoPrincipale(file);
      setPreviewPrincipale(url);
    } else {
      setFotoSecondaria(file);
      setPreviewSecondaria(url);
    }
  }

  async function inviaRichiesta() {
    if (!user || !fotoPrincipale || !marca.trim() || !modello.trim()) return;
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setErrore('Supabase non è configurato.');
      return;
    }
    setCaricando(true);
    setErrore('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Sessione scaduta. Accedi di nuovo.');

      const annoNumero = anno ? Number.parseInt(anno, 10) : null;
      const categoria = risolviCategoriaMoto(null, `${marca} ${modello}`);
      const { data: moto, error: erroreMoto } = await supabase
        .from('moto')
        .insert({
          utente_id: user.id,
          marca: marca.trim(),
          modello: modello.trim(),
          anno: annoNumero,
          categoria,
          stato: 'in_attesa',
          progress: 0,
          colore_primario: '#d91414',
          colore_secondario: '#15181a',
          model_format: 'ply',
          is_public: false,
        })
        .select('id')
        .single();
      if (erroreMoto || !moto) throw new Error(erroreMoto?.message ?? 'Non riesco a creare la richiesta.');

      const estensione = (file: File) => file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
      const pathPrincipale = `${user.id}/${moto.id}/principale.${estensione(fotoPrincipale)}`;
      const { error: uploadPrincipale } = await supabase.storage
        .from('foto-moto')
        .upload(pathPrincipale, fotoPrincipale, { upsert: true, contentType: fotoPrincipale.type });
      if (uploadPrincipale) throw new Error(`Foto principale: ${uploadPrincipale.message}`);

      let pathSecondaria: string | null = null;
      if (fotoSecondaria) {
        pathSecondaria = `${user.id}/${moto.id}/secondaria.${estensione(fotoSecondaria)}`;
        const { error } = await supabase.storage
          .from('foto-moto')
          .upload(pathSecondaria, fotoSecondaria, { upsert: true, contentType: fotoSecondaria.type });
        if (error) throw new Error(`Seconda foto: ${error.message}`);
      }

      const { error: aggiornamento } = await supabase
        .from('moto')
        .update({ foto_sx_url: pathPrincipale, foto_dx_url: pathSecondaria })
        .eq('id', moto.id);
      if (aggiornamento) throw new Error(aggiornamento.message);

      const risposta = await fetch('/api/garage/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ motoId: moto.id }),
      });
      const json = await risposta.json() as { errore?: string; richiedeApprovazione?: boolean };
      if (!risposta.ok) throw new Error(json.errore ?? 'Avvio generazione fallito.');

      if (json.richiedeApprovazione) {
        setConfermaTipo('approvazione');
        setStep('conferma');
        onInviato(moto.id, 'approvazione');
        return;
      }

      setConfermaTipo('generazione');
      setStep('conferma');
      onInviato(moto.id, 'generazione');
    } catch (error) {
      setErrore(error instanceof Error ? error.message : 'Errore imprevisto.');
    } finally {
      setCaricando(false);
    }
  }

  if (step === 'conferma') {
    const inApprovazione = confermaTipo === 'approvazione';
    return (
      <section className="mx-auto max-w-2xl rounded-[30px] border border-white/10 bg-black/75 p-8 text-center text-cemento shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl">
        <div className={`mx-auto grid h-20 w-20 place-items-center rounded-[24px] text-4xl text-white ${inApprovazione ? 'bg-amber-500' : 'bg-emerald-500'}`}>
          {inApprovazione ? '⏳' : '✓'}
        </div>
        <h1 className="mt-6 font-display text-4xl font-black uppercase leading-none sm:text-5xl">
          {inApprovazione ? 'Richiesta inviata' : 'Generazione avviata'}
        </h1>
        <p className="mt-4 text-sm leading-6 text-cemento/65">
          {inApprovazione
            ? `Hai già usato la generazione automatica nell'ultima ora. La tua ${marca} ${modello} è in coda: verrà elaborata dopo la mia approvazione.`
            : `Stiamo creando il gemello digitale della tua ${marca} ${modello}.`}
        </p>
      </section>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <section className="rounded-[30px] border border-asfalto/10 bg-white p-5 shadow-app-lg dark:bg-carbone sm:p-8">
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-brand">Gemello digitale</p>
        <h1 className="mt-3 font-display text-4xl font-black uppercase leading-none tracking-tight sm:text-6xl">Gemello digitale</h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-asfalto/60 dark:text-cemento/60">
          Carica una foto laterale pulita: generiamo il modello 3D nel tuo garage. Una generazione automatica all&apos;ora; le successive richiedono approvazione.
        </p>

        <div className="mt-7 grid grid-cols-2 gap-2">
          <span className="h-2 rounded-full bg-brand" />
          <span className={`h-2 rounded-full ${step === 'foto' ? 'bg-brand' : 'bg-asfalto/10 dark:bg-white/10'}`} />
        </div>

        {step === 'dati' && (
          <div className="mt-8 space-y-5">
            <Campo label="Marca">
              <select value={marca} onChange={(event) => setMarca(event.target.value)} className="input-app">
                <option value="">Seleziona marca…</option>
                {MARCHE.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </Campo>
            <Campo label="Modello">
              <input
                value={modello}
                onChange={(event) => setModello(event.target.value)}
                placeholder="es. Panigale V4, Monster 937, MT-07"
                className="input-app"
                maxLength={60}
                autoComplete="off"
                spellCheck={false}
              />
            </Campo>
            <Campo label="Anno">
              <input type="number" value={anno} onChange={(event) => setAnno(event.target.value)} placeholder="es. 2024" className="input-app" min={1950} max={new Date().getFullYear() + 1} />
            </Campo>
            <button type="button" disabled={!marca || !modello.trim()} onClick={() => setStep('foto')} className="w-full rounded-app bg-brand py-4 font-mono text-sm font-bold uppercase text-white disabled:opacity-40">
              Continua con le foto →
            </button>
          </div>
        )}

        {step === 'foto' && (
          <div className="mt-8 space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <UploadBox titolo="Foto principale" nota="Obbligatoria" anteprima={previewPrincipale} onClick={() => refPrincipale.current?.click()} />
              <UploadBox titolo="Seconda foto" nota="Facoltativa" anteprima={previewSecondaria} onClick={() => refSecondaria.current?.click()} />
              <input ref={refPrincipale} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => event.target.files?.[0] && onFile(event.target.files[0], 'principale')} />
              <input ref={refSecondaria} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => event.target.files?.[0] && onFile(event.target.files[0], 'secondaria')} />
            </div>
            {errore && <p role="alert" className="rounded-app border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">{errore}</p>}
            <div className="flex gap-3">
              <button type="button" onClick={() => setStep('dati')} className="flex-1 rounded-app border border-asfalto/15 py-4 font-mono text-xs font-bold uppercase dark:border-white/15">← Indietro</button>
              <button type="button" disabled={!fotoPrincipale || caricando} onClick={inviaRichiesta} className="flex-[2] rounded-app bg-brand py-4 font-mono text-xs font-bold uppercase text-white disabled:opacity-40">
                {caricando ? 'Avvio generazione…' : 'Genera gemello digitale'}
              </button>
            </div>
          </div>
        )}
      </section>

      <aside className="rounded-[30px] border border-white/10 bg-[#08090d] p-5 text-cemento shadow-app-lg sm:p-6">
        <Logo variante="card" className="mx-auto mb-5" />
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-brand-chiaro">Come fotografarla</p>
        <h2 className="mt-2 font-display text-3xl font-black uppercase leading-none">Una foto pulita basta</h2>
        <ul className="mt-5 space-y-2 font-mono text-[11px] uppercase tracking-wide text-cemento/55">
          <li>✓ Moto intera, vista laterale</li>
          <li>✓ Sfondo semplice</li>
          <li>✓ Luce naturale e uniforme</li>
          <li>✓ Ruote e specchietti visibili</li>
          <li>× Niente persone davanti</li>
        </ul>
        <p className="mt-6 text-xs leading-relaxed text-cemento/45">
          Al primo utilizzo la generazione può richiedere 1–2 minuti.
        </p>
      </aside>
    </div>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="label-app">{label}</span>{children}</label>;
}

function UploadBox({ titolo, nota, anteprima, onClick }: { titolo: string; nota: string; anteprima: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`min-h-52 overflow-hidden rounded-[22px] border-2 border-dashed text-left ${anteprima ? 'border-emerald-500/60 bg-emerald-500/5' : 'border-asfalto/15 hover:border-brand dark:border-white/15'}`}>
      {anteprima ? (
        <>
          <img src={anteprima} alt={`Anteprima ${titolo.toLowerCase()}`} className="h-44 w-full bg-black/5 object-contain" />
          <p className="px-4 py-3 font-mono text-xs font-bold uppercase text-emerald-600">✓ {titolo}</p>
        </>
      ) : (
        <div className="grid h-52 place-items-center p-5 text-center">
          <div>
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-asfalto text-2xl text-white">＋</div>
            <p className="mt-3 font-mono text-xs font-bold uppercase">{titolo}</p>
            <p className="mt-1 font-mono text-[10px] uppercase text-brand">{nota} · max 15 MB</p>
          </div>
        </div>
      )}
    </button>
  );
}
