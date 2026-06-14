'use client';

import { useRef, useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase-browser';
import { useAuth } from './AuthProvider';

// Ridimensiona e comprime l'immagine lato browser prima dell'upload:
// lato lungo max 1600px, JPEG qualità ~0.82. Tiene leggero lo storage.
async function comprimi(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const max = 1600;
  let { width, height } = bitmap;
  if (width > max || height > max) {
    if (width >= height) {
      height = Math.round((height * max) / width);
      width = max;
    } else {
      width = Math.round((width * max) / height);
      height = max;
    }
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, width, height);
  return new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b ?? file), 'image/jpeg', 0.82);
  });
}

export default function CaricaFoto({
  itinerarioId = null,
  onCaricata,
  compatto = false,
}: {
  itinerarioId?: string | null;
  onCaricata?: () => void;
  compatto?: boolean;
}) {
  const { user, profilo, nonConfigurato } = useAuth();
  const [anteprima, setAnteprima] = useState<string | null>(null);
  const [didascalia, setDidascalia] = useState('');
  const [stato, setStato] = useState<'idle' | 'invio' | 'fatto' | 'errore'>('idle');
  const [errore, setErrore] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const fileScelto = useRef<File | null>(null);

  const loggato = !!user || nonConfigurato;

  if (!loggato) {
    return (
      <div className="rounded-app border border-dashed border-asfalto/25 bg-white/50 p-5 text-center">
        <p className="text-sm text-asfalto/70">
          Vuoi aggiungere una tua foto?{' '}
          <a href="/accedi#registrati" className="font-medium text-cartello underline">
            Crea un account gratuito
          </a>
          .
        </p>
      </div>
    );
  }

  function scegli(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    fileScelto.current = f;
    setAnteprima(URL.createObjectURL(f));
    setStato('idle');
    setErrore(null);
  }

  async function invia() {
    const supabase = getSupabaseBrowser();
    const f = fileScelto.current;
    if (!supabase || !f || !user) return;

    setStato('invio');
    setErrore(null);
    try {
      const blob = await comprimi(f);
      const nome = `${user.id}/${Date.now()}.jpg`;
      const up = await supabase.storage
        .from('foto-bikers')
        .upload(nome, blob, { contentType: 'image/jpeg', upsert: false });
      if (up.error) throw up.error;

      const ins = await supabase.from('foto').insert({
        autore_id: user.id,
        itinerario_id: itinerarioId,
        storage_path: nome,
        didascalia: didascalia.trim() || null,
      });
      if (ins.error) throw ins.error;

      setStato('fatto');
      setAnteprima(null);
      setDidascalia('');
      fileScelto.current = null;
      if (fileRef.current) fileRef.current.value = '';
      onCaricata?.();
    } catch (err) {
      setStato('errore');
      setErrore(err instanceof Error ? err.message : 'Caricamento non riuscito');
    }
  }

  return (
    <div className={compatto ? '' : 'rounded-app border border-asfalto/10 bg-white p-5 shadow-app-sm'}>
      {!anteprima ? (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="tap flex w-full items-center justify-center gap-2 rounded-app border-2 border-dashed border-asfalto/25 py-6 font-mono text-sm uppercase tracking-wide text-asfalto/60 hover:border-segnale hover:text-asfalto"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <circle cx="8.5" cy="10" r="1.5" />
            <path d="m21 16-4.5-4.5L7 21" />
          </svg>
          {profilo?.username ? 'Aggiungi una foto' : 'Carica una foto'}
        </button>
      ) : (
        <div className="space-y-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={anteprima} alt="Anteprima" className="max-h-72 w-full rounded-app object-cover" />
          <input
            type="text"
            value={didascalia}
            onChange={(e) => setDidascalia(e.target.value)}
            placeholder="Didascalia (dove? com'era la strada?)"
            maxLength={140}
            className="w-full rounded-app border border-asfalto/15 px-3 py-2 text-sm focus:border-segnale focus:outline-none"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={invia}
              disabled={stato === 'invio'}
              className="tap rounded-app bg-segnale px-5 py-2.5 font-mono text-sm font-medium uppercase text-asfalto disabled:opacity-60"
            >
              {stato === 'invio' ? 'Carico…' : 'Pubblica'}
            </button>
            <button
              type="button"
              onClick={() => {
                setAnteprima(null);
                fileScelto.current = null;
                if (fileRef.current) fileRef.current.value = '';
              }}
              className="tap rounded-app border border-asfalto/15 px-4 py-2.5 font-mono text-sm uppercase text-asfalto/60"
            >
              Annulla
            </button>
          </div>
        </div>
      )}

      {stato === 'fatto' && (
        <p className="mt-3 font-mono text-xs uppercase tracking-wide text-bosco">
          Foto pubblicata
        </p>
      )}
      {stato === 'errore' && (
        <p className="mt-3 text-sm text-cartello">{errore}</p>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={scegli}
        className="hidden"
      />
    </div>
  );
}
