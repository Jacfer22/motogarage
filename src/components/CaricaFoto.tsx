'use client';

import { useRef, useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase-browser';
import { useAuth } from './AuthProvider';

// Ridimensiona e comprime l'immagine lato browser prima dell'upload:
// lato lungo max 1600px, JPEG qualità ~0.82. Tiene leggero lo storage.
// Prova a estrarre la posizione GPS dai metadati EXIF di una foto JPEG,
// leggendo i byte del file. Ritorna null se non c'è (molte foto non la hanno,
// o il browser l'ha rimossa). Nessuna libreria esterna.
async function leggiGpsExif(file: File): Promise<{ lat: number; lng: number } | null> {
  try {
    const buf = await file.arrayBuffer();
    const view = new DataView(buf);
    if (view.getUint16(0) !== 0xffd8) return null; // non è JPEG

    let offset = 2;
    const len = view.byteLength;
    while (offset < len) {
      const marker = view.getUint16(offset);
      offset += 2;
      if (marker === 0xffe1) {
        // APP1 (EXIF)
        const exifStart = offset + 2;
        if (view.getUint32(exifStart) !== 0x45786966) return null; // "Exif"
        const tiff = exifStart + 6;
        const little = view.getUint16(tiff) === 0x4949;
        const get16 = (o: number) => view.getUint16(o, little);
        const get32 = (o: number) => view.getUint32(o, little);

        const ifd0 = tiff + get32(tiff + 4);
        const entries = get16(ifd0);
        let gpsIfd = 0;
        for (let i = 0; i < entries; i++) {
          const e = ifd0 + 2 + i * 12;
          if (get16(e) === 0x8825) gpsIfd = tiff + get32(e + 8);
        }
        if (!gpsIfd) return null;

        const gpsEntries = get16(gpsIfd);
        let latRef = 'N';
        let lngRef = 'E';
        let lat: number | null = null;
        let lng: number | null = null;
        const leggiCoord = (o: number) => {
          const d = get32(o) / get32(o + 4);
          const m = get32(o + 8) / get32(o + 12);
          const s = get32(o + 16) / get32(o + 20);
          return d + m / 60 + s / 3600;
        };
        for (let i = 0; i < gpsEntries; i++) {
          const e = gpsIfd + 2 + i * 12;
          const tag = get16(e);
          const valOff = tiff + get32(e + 8);
          if (tag === 1) latRef = String.fromCharCode(view.getUint8(e + 8));
          else if (tag === 2) lat = leggiCoord(valOff);
          else if (tag === 3) lngRef = String.fromCharCode(view.getUint8(e + 8));
          else if (tag === 4) lng = leggiCoord(valOff);
        }
        if (lat == null || lng == null) return null;
        if (latRef === 'S') lat = -lat;
        if (lngRef === 'W') lng = -lng;
        return { lat, lng };
      } else if ((marker & 0xff00) !== 0xff00) {
        break;
      } else {
        offset += view.getUint16(offset);
      }
    }
    return null;
  } catch {
    return null;
  }
}

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
      // posizione: prima dall'EXIF della foto, poi (fallback) dal dispositivo
      let posizione = await leggiGpsExif(f);
      if (!posizione && 'geolocation' in navigator) {
        posizione = await new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            () => resolve(null),
            { timeout: 4000, maximumAge: 60000 }
          );
        });
      }

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
        lat: posizione?.lat ?? null,
        lng: posizione?.lng ?? null,
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
