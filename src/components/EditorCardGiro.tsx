'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { formattaDurata, formattaKm, statisticheGiro } from '@/lib/geo';
import { generaCardGiro } from '@/lib/card-canvas';
import type { GiroUtente } from '@/lib/giri-store';

function formattaDataBreve(iso: string): string {
  return new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
}

async function scegliFotoCard(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const max = 1280;
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
  const c = document.createElement('canvas');
  c.width = width;
  c.height = height;
  const cx = c.getContext('2d');
  if (cx) cx.drawImage(bitmap, 0, 0, width, height);
  return c.toDataURL('image/jpeg', 0.85);
}

interface Props {
  giro: GiroUtente;
  onNomeChange?: (nome: string) => void;
  onPubblicoChange?: (pubblico: boolean) => void;
}

export default function EditorCardGiro({ giro, onNomeChange, onPubblicoChange }: Props) {
  const [temaCard, setTemaCard] = useState<'tracciato' | 'foto'>('tracciato');
  const [paletteCard, setPaletteCard] = useState<'scuro' | 'chiaro'>('scuro');
  const [luogoCard, setLuogoCard] = useState(giro.nome === 'Giro libero' ? '' : giro.nome);
  const [mostraMedia, setMostraMedia] = useState(true);
  const [mostraMax, setMostraMax] = useState(false);
  const [mostraCurve, setMostraCurve] = useState(true);
  const [mostraDislivello, setMostraDislivello] = useState(true);
  const [tracciatoX, setTracciatoX] = useState(0.5);
  const [tracciatoY, setTracciatoY] = useState(0.5);
  const [fotoSalvata, setFotoSalvata] = useState<string | null>(null);
  const [preferFoto, setPreferFoto] = useState(false);
  const [fotoZoom, setFotoZoom] = useState(1);
  const [fotoLuminosita, setFotoLuminosita] = useState(1);
  const [cardUrl, setCardUrl] = useState<string | null>(null);
  const [generandoCard, setGenerandoCard] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);
  const rigeneraAbilitato = useRef(false);
  const fotoSalvataRef = useRef(fotoSalvata);
  const preferFotoRef = useRef(preferFoto);

  useEffect(() => {
    fotoSalvataRef.current = fotoSalvata;
  }, [fotoSalvata]);

  useEffect(() => {
    preferFotoRef.current = preferFoto;
  }, [preferFoto]);

  const creaCard = useCallback(
    async (foto?: string | null) => {
      if (giro.punti.length < 2) {
        setErrore('Tracciato GPS insufficiente per generare la card.');
        return;
      }
      setGenerandoCard(true);
      setErrore(null);
      try {
        const stat = statisticheGiro(giro.punti, giro.durataSec, giro.km);
        const titolo = luogoCard.trim() || giro.nome;
        if (onNomeChange && titolo !== giro.nome) onNomeChange(titolo);

        const fotoDataUrl =
          foto !== undefined ? foto : preferFotoRef.current ? fotoSalvataRef.current : null;

        const url = await generaCardGiro({
          titolo,
          km: formattaKm(giro.km),
          durata: formattaDurata(giro.durataSec),
          data: formattaDataBreve(giro.data),
          punti: giro.punti,
          tema: temaCard,
          palette: paletteCard,
          luogo: luogoCard.trim() || null,
          fotoDataUrl,
          dislivelloM: mostraDislivello ? (stat.dislivelloPositivoM || giro.dislivelloM) : null,
          velMediaKmh: mostraMedia ? (stat.velMediaKmh || giro.velMediaKmh) : null,
          velMaxKmh: mostraMax ? (stat.velMaxKmh || giro.velMaxKmh) : null,
          curve: mostraCurve ? (stat.curve || giro.curve) : null,
          tracciatoOffsetX: tracciatoX,
          tracciatoOffsetY: tracciatoY,
          fotoScala: preferFotoRef.current || foto !== undefined ? fotoZoom : undefined,
          fotoLuminosita: preferFotoRef.current || foto !== undefined ? fotoLuminosita : undefined,
        });
        setCardUrl(url);
        rigeneraAbilitato.current = true;
      } catch {
        setErrore('Non sono riuscito a generare la card. Riprova.');
      } finally {
        setGenerandoCard(false);
      }
    },
    [
      giro,
      luogoCard,
      onNomeChange,
      temaCard,
      paletteCard,
      mostraDislivello,
      mostraMedia,
      mostraMax,
      mostraCurve,
      tracciatoX,
      tracciatoY,
      fotoZoom,
      fotoLuminosita,
    ]
  );

  useEffect(() => {
    if (!rigeneraAbilitato.current && !fotoSalvata) return;
    const timer = setTimeout(() => {
      void creaCard();
    }, 400);
    return () => clearTimeout(timer);
  }, [
    temaCard,
    paletteCard,
    luogoCard,
    mostraMedia,
    mostraMax,
    mostraCurve,
    mostraDislivello,
    tracciatoX,
    tracciatoY,
    fotoZoom,
    fotoLuminosita,
    creaCard,
  ]);

  function scaricaCard() {
    if (!cardUrl) return;
    const a = document.createElement('a');
    a.href = cardUrl;
    a.download = 'motogarage-giro.png';
    a.click();
  }

  async function condividiCard() {
    if (!cardUrl) return;
    const titolo = luogoCard.trim() || giro.nome;
    const testo =
      `${titolo !== 'Giro libero' ? `${titolo} · ` : ''}` +
      `${formattaKm(giro.km)} km in moto 🏍️\n` +
      `Il mio giro su MotoGarage`;
    try {
      const res = await fetch(cardUrl);
      const blob = await res.blob();
      const file = new File([blob], 'motogarage-giro.png', { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Il mio giro su MotoGarage', text: testo });
        return;
      }
      if (navigator.share) {
        await navigator.share({ title: 'MotoGarage', text: testo });
        return;
      }
    } catch {
      // fallback download
    }
    scaricaCard();
  }

  return (
    <div className="space-y-4 rounded-app-lg border border-asfalto/12 bg-white/80 p-5 dark:bg-carbone/60">
      <div>
        <p className="font-mono text-xs uppercase tracking-wide text-asfalto/50">
          Crea la card da condividere
        </p>
        <p className="mt-1 text-sm text-asfalto/65">
          {formattaKm(giro.km)} km · {formattaDurata(giro.durataSec)} · {formattaDataBreve(giro.data)}
        </p>
      </div>

      {giro.cloudId && onPubblicoChange && (
        <button
          type="button"
          onClick={() => onPubblicoChange(!giro.pubblico)}
          className={`tap flex w-full items-center justify-between gap-3 rounded-app border-2 p-3 text-left ${
            giro.pubblico ? 'border-bosco bg-bosco/10' : 'border-asfalto/15'
          }`}
        >
          <span>
            <span className="block font-mono text-sm font-medium uppercase">
              {giro.pubblico ? '✓ Visibile nella community' : 'Condividi nella community'}
            </span>
            <span className="block font-mono text-[11px] text-asfalto/55">
              Mostra questo giro nel feed pubblico
            </span>
          </span>
          <span className={`relative h-6 w-11 shrink-0 rounded-full ${giro.pubblico ? 'bg-bosco' : 'bg-asfalto/20'}`}>
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${giro.pubblico ? 'left-[22px]' : 'left-0.5'}`} />
          </span>
        </button>
      )}

      <div>
        <p className="mb-1.5 font-mono text-[11px] uppercase tracking-wide text-asfalto/40">Tema</p>
        <div className="flex gap-2">
          {(['scuro', 'chiaro'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPaletteCard(p)}
              className={`tap flex-1 rounded-app border-2 px-3 py-2.5 font-mono text-xs font-medium uppercase ${
                paletteCard === p ? 'border-segnale bg-segnale/10' : 'border-asfalto/15 text-asfalto/60'
              }`}
            >
              {p === 'scuro' ? '🌑 Scuro' : '☀️ Chiaro'}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1.5 font-mono text-[11px] uppercase tracking-wide text-asfalto/40">Stile</p>
        <div className="flex gap-2">
          {(['tracciato', 'foto'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTemaCard(t)}
              className={`tap flex-1 rounded-app border-2 px-3 py-2.5 font-mono text-xs font-medium uppercase ${
                temaCard === t ? 'border-segnale bg-segnale/10' : 'border-asfalto/15 text-asfalto/60'
              }`}
            >
              {t === 'tracciato' ? 'Tracciato 3D' : 'Con foto'}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1.5 font-mono text-[11px] uppercase tracking-wide text-asfalto/40">Luogo (opzionale)</p>
        <input
          type="text"
          value={luogoCard}
          onChange={(e) => setLuogoCard(e.target.value)}
          placeholder="Es. Passo dello Stelvio"
          maxLength={40}
          className="input-app w-full"
        />
      </div>

      <div>
        <p className="mb-2 font-mono text-[11px] uppercase tracking-wide text-asfalto/40">Statistiche nella card</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Vel. media', attivo: mostraMedia, set: setMostraMedia },
            { label: 'Vel. massima', attivo: mostraMax, set: setMostraMax },
            { label: 'Curve', attivo: mostraCurve, set: setMostraCurve },
            { label: 'Dislivello', attivo: mostraDislivello, set: setMostraDislivello },
          ].map(({ label, attivo, set }) => (
            <button
              key={label}
              type="button"
              onClick={() => set(!attivo)}
              className={`tap flex items-center gap-2 rounded-app border px-3 py-2 font-mono text-xs font-medium ${
                attivo ? 'border-bosco bg-bosco/10 text-bosco' : 'border-asfalto/15 text-asfalto/40'
              }`}
            >
              <span>{attivo ? '✓' : '○'}</span>
              {label}
            </button>
          ))}
        </div>
      </div>

      {cardUrl && (
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cardUrl} alt="Card del giro" className="w-full max-w-xs rounded-app border-2 border-asfalto/20 shadow-app" />
        </div>
      )}

      {errore && <p className="text-sm text-red-700 dark:text-red-300">{errore}</p>}

      <div className="flex flex-wrap gap-3">
        <label className="tap cursor-pointer rounded-app bg-segnale px-5 py-2.5 font-mono text-sm font-medium uppercase text-asfalto hover:bg-white">
          {generandoCard ? 'Genero…' : '📷 Con foto'}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const foto = await scegliFotoCard(f);
              setFotoSalvata(foto);
              setPreferFoto(true);
              setFotoZoom(1);
              setFotoLuminosita(1);
              rigeneraAbilitato.current = true;
              await creaCard(foto);
            }}
          />
        </label>
        <button
          type="button"
          onClick={() => {
            setPreferFoto(false);
            void creaCard(null);
          }}
          disabled={generandoCard}
          className="tap rounded-app border border-asfalto/20 px-5 py-2.5 font-mono text-sm font-medium uppercase hover:bg-asfalto hover:text-cemento disabled:opacity-60"
        >
          Senza foto
        </button>
      </div>

      {fotoSalvata && preferFoto && (
        <div className="space-y-3 rounded-app border border-asfalto/12 bg-asfalto/[0.03] p-4">
          <p className="font-mono text-[11px] uppercase tracking-wide text-asfalto/40">Regola foto</p>
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-xs text-asfalto/65">Dimensione</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={fotoZoom <= 0.6 || generandoCard}
                onClick={() => setFotoZoom((z) => Math.max(0.6, Math.round((z - 0.1) * 10) / 10))}
                className="tap flex h-9 w-9 items-center justify-center rounded-app border border-asfalto/20 font-mono text-lg font-bold hover:bg-asfalto hover:text-cemento disabled:opacity-35"
                aria-label="Rimpicciolisci foto"
              >
                −
              </button>
              <span className="min-w-[3rem] text-center font-mono text-xs tabular-nums text-asfalto/55">
                {Math.round(fotoZoom * 100)}%
              </span>
              <button
                type="button"
                disabled={fotoZoom >= 2 || generandoCard}
                onClick={() => setFotoZoom((z) => Math.min(2, Math.round((z + 0.1) * 10) / 10))}
                className="tap flex h-9 w-9 items-center justify-center rounded-app border border-asfalto/20 font-mono text-lg font-bold hover:bg-asfalto hover:text-cemento disabled:opacity-35"
                aria-label="Ingrandisci foto"
              >
                +
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-xs text-asfalto/65">Luminosità</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={fotoLuminosita <= 0.5 || generandoCard}
                onClick={() => setFotoLuminosita((l) => Math.max(0.5, Math.round((l - 0.1) * 10) / 10))}
                className="tap flex h-9 w-9 items-center justify-center rounded-app border border-asfalto/20 font-mono text-lg font-bold hover:bg-asfalto hover:text-cemento disabled:opacity-35"
                aria-label="Riduci luminosità"
              >
                −
              </button>
              <span className="min-w-[3rem] text-center font-mono text-xs tabular-nums text-asfalto/55">
                {Math.round(fotoLuminosita * 100)}%
              </span>
              <button
                type="button"
                disabled={fotoLuminosita >= 1.5 || generandoCard}
                onClick={() => setFotoLuminosita((l) => Math.min(1.5, Math.round((l + 0.1) * 10) / 10))}
                className="tap flex h-9 w-9 items-center justify-center rounded-app border border-asfalto/20 font-mono text-lg font-bold hover:bg-asfalto hover:text-cemento disabled:opacity-35"
                aria-label="Aumenta luminosità"
              >
                +
              </button>
            </div>
          </div>
        </div>
      )}

      {cardUrl && (
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={condividiCard} className="tap rounded-app bg-segnale px-5 py-2.5 font-mono font-medium uppercase text-asfalto hover:bg-white">
            Condividi
          </button>
          <button type="button" onClick={scaricaCard} className="tap rounded-app border-2 border-asfalto px-5 py-2.5 font-mono font-medium uppercase hover:bg-asfalto hover:text-cemento">
            Salva card
          </button>
        </div>
      )}
    </div>
  );
}
