'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { formattaDurata, formattaKm, statisticheGiro } from '@/lib/geo';
import { generaCardGiro } from '@/lib/card-canvas';
import { PRESET_LOOK, type FiltroFoto, type PresetLook } from '@/lib/card-foto-filtri';
import type { GiroUtente } from '@/lib/giri-store';
import { useFeedback } from '@/components/FeedbackProvider';
import AnteprimaCardLive from '@/components/AnteprimaCardLive';

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

function Pill({
  attivo,
  onClick,
  children,
}: {
  attivo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`tap rounded-full border px-3.5 py-2 font-mono text-[10px] font-bold uppercase tracking-wide transition-all ${
        attivo
          ? 'border-brand bg-brand text-white shadow-[0_0_16px_rgba(209,25,25,0.35)]'
          : 'border-white/15 bg-white/[0.04] text-cemento/60 hover:border-white/25'
      }`}
    >
      {children}
    </button>
  );
}

export default function EditorCardGiro({ giro, onNomeChange, onPubblicoChange }: Props) {
  const { toast } = useFeedback();
  const stat = statisticheGiro(giro.punti, giro.durataSec, giro.km);
  const giroMontagna = (stat.dislivelloPositivoM || giro.dislivelloM) >= 150;

  const [layout, setLayout] = useState<'strava' | 'story'>('strava');
  const [luogoCard, setLuogoCard] = useState(giro.nome === 'Giro libero' ? '' : giro.nome);
  const [mostraMax, setMostraMax] = useState(true);
  const [mostraMedia, setMostraMedia] = useState(false);
  const [mostraCurve, setMostraCurve] = useState(false);
  const [mostraDislivello, setMostraDislivello] = useState(false);
  const [mostraData, setMostraData] = useState(true);
  const [mostraTracciato, setMostraTracciato] = useState(false);
  const [tracciatoX, setTracciatoX] = useState(0.35);
  const [tracciatoY, setTracciatoY] = useState(0.25);
  const [elementoTrascina, setElementoTrascina] = useState<'foto' | 'tracciato'>('foto');

  const [fotoSalvata, setFotoSalvata] = useState<string | null>(null);
  const [preferFoto, setPreferFoto] = useState(false);
  const [presetLook, setPresetLook] = useState<PresetLook>('normale');
  const [fotoZoom, setFotoZoom] = useState(1);
  const [fotoLuminosita, setFotoLuminosita] = useState(1);
  const [fotoContrasto, setFotoContrasto] = useState(1);
  const [fotoSaturazione, setFotoSaturazione] = useState(1);
  const [filtroFoto, setFiltroFoto] = useState<FiltroFoto>('none');
  const [fotoOffsetX, setFotoOffsetX] = useState(0.5);
  const [fotoOffsetY, setFotoOffsetY] = useState(0.5);

  const anteprimaRef = useRef<HTMLDivElement>(null);
  const gestiRef = useRef({
    tipo: 'none' as 'none' | 'pan' | 'pinch',
    x: 0,
    y: 0,
    offX: 0.5,
    offY: 0.5,
    trX: 0.35,
    trY: 0.25,
    zoom: 1,
    dist: 0,
  });

  const [cardUrl, setCardUrl] = useState<string | null>(null);
  const [generandoCard, setGenerandoCard] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);

  const dataBreve = formattaDataBreve(giro.data);
  const luogo = (luogoCard.trim() || giro.nome).toUpperCase();

  const statsLive = useMemo(() => {
    const s: { label: string; valore: string; accent?: boolean }[] = [
      { label: 'Distanza', valore: `${formattaKm(giro.km)} km` },
      { label: 'Durata', valore: formattaDurata(giro.durataSec) },
    ];
    if (mostraMedia && (stat.velMediaKmh || giro.velMediaKmh))
      s.push({ label: 'Media', valore: `${stat.velMediaKmh || giro.velMediaKmh} km/h` });
    if (mostraMax && (stat.velMaxKmh || giro.velMaxKmh))
      s.push({ label: 'Max', valore: `${stat.velMaxKmh || giro.velMaxKmh} km/h` });
    if (mostraDislivello && (stat.dislivelloPositivoM || giro.dislivelloM))
      s.push({ label: 'Dislivello', valore: `+${stat.dislivelloPositivoM || giro.dislivelloM} m`, accent: true });
    if (mostraCurve && (stat.curve || giro.curve))
      s.push({ label: 'Curve', valore: `${stat.curve || giro.curve}`, accent: true });
    return s;
  }, [giro, stat, mostraMedia, mostraMax, mostraDislivello, mostraCurve]);

  function applicaPreset(id: PresetLook) {
    setPresetLook(id);
    const p = PRESET_LOOK.find((x) => x.id === id);
    if (!p) return;
    setFotoLuminosita(p.luminosita);
    setFotoContrasto(p.contrasto);
    setFotoSaturazione(p.saturazione);
    setFiltroFoto(p.filtro);
  }

  const esportaCard = useCallback(async (): Promise<string | null> => {
    if (giro.punti.length < 2) {
      setErrore('Tracciato GPS insufficiente per generare la card.');
      return null;
    }
    setGenerandoCard(true);
    setErrore(null);
    try {
      const titolo = luogoCard.trim() || giro.nome;
      const url = await generaCardGiro({
        titolo,
        km: formattaKm(giro.km),
        durata: formattaDurata(giro.durataSec),
        data: dataBreve,
        punti: giro.punti,
        tema: layout === 'strava' ? 'foto' : 'tracciato',
        palette: 'scuro',
        luogo: luogoCard.trim() || null,
        fotoDataUrl: preferFoto ? fotoSalvata : null,
        dislivelloM: mostraDislivello ? (stat.dislivelloPositivoM || giro.dislivelloM) : null,
        velMediaKmh: mostraMedia ? (stat.velMediaKmh || giro.velMediaKmh) : null,
        velMaxKmh: mostraMax ? (stat.velMaxKmh || giro.velMaxKmh) : null,
        curve: mostraCurve ? (stat.curve || giro.curve) : null,
        tracciatoOffsetX: tracciatoX,
        tracciatoOffsetY: tracciatoY,
        fotoScala: preferFoto ? fotoZoom : undefined,
        fotoLuminosita: preferFoto ? fotoLuminosita : undefined,
        fotoContrasto: preferFoto ? fotoContrasto : undefined,
        fotoSaturazione: preferFoto ? fotoSaturazione : undefined,
        filtroFoto: preferFoto ? filtroFoto : undefined,
        fotoOffsetX: preferFoto ? fotoOffsetX : undefined,
        fotoOffsetY: preferFoto ? fotoOffsetY : undefined,
        mostraTracciatoSuFoto: preferFoto ? mostraTracciato : undefined,
        mostraData,
      });
      setCardUrl(url);
      return url;
    } catch {
      setErrore('Non sono riuscito a generare la card. Riprova.');
      return null;
    } finally {
      setGenerandoCard(false);
    }
  }, [
    giro,
    luogoCard,
    dataBreve,
    layout,
    preferFoto,
    fotoSalvata,
    mostraDislivello,
    mostraMedia,
    mostraMax,
    mostraCurve,
    mostraData,
    mostraTracciato,
    tracciatoX,
    tracciatoY,
    fotoZoom,
    fotoLuminosita,
    fotoContrasto,
    fotoSaturazione,
    filtroFoto,
    fotoOffsetX,
    fotoOffsetY,
    stat,
  ]);

  function cosaTrascina(): 'foto' | 'tracciato' {
    if (preferFoto) return mostraTracciato && elementoTrascina === 'tracciato' ? 'tracciato' : 'foto';
    return 'tracciato';
  }

  function distanzaDita(touches: React.TouchList | TouchList) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.hypot(dx, dy);
  }

  function applicaPan(dx: number, dy: number, rect: DOMRect) {
    const sens = 0.95;
    const st = gestiRef.current;
    if (cosaTrascina() === 'foto') {
      setFotoOffsetX(Math.min(1, Math.max(0, st.offX + (dx / rect.width) * sens)));
      setFotoOffsetY(Math.min(1, Math.max(0, st.offY + (dy / rect.height) * sens)));
    } else {
      setTracciatoX(Math.min(1, Math.max(0, st.trX + (dx / rect.width) * sens)));
      setTracciatoY(Math.min(1, Math.max(0, st.trY + (dy / rect.height) * sens)));
    }
  }

  function iniziaPan(clientX: number, clientY: number) {
    gestiRef.current = {
      ...gestiRef.current,
      tipo: 'pan',
      x: clientX,
      y: clientY,
      offX: fotoOffsetX,
      offY: fotoOffsetY,
      trX: tracciatoX,
      trY: tracciatoY,
    };
  }

  function muoviPan(clientX: number, clientY: number) {
    const st = gestiRef.current;
    const rect = anteprimaRef.current?.getBoundingClientRect();
    if (!rect || st.tipo !== 'pan') return;
    applicaPan(clientX - st.x, clientY - st.y, rect);
  }

  function terminaGesto() {
    gestiRef.current.tipo = 'none';
  }

  function iniziaTouch(e: React.TouchEvent) {
    if (e.touches.length === 2 && preferFoto && cosaTrascina() === 'foto') {
      gestiRef.current = { ...gestiRef.current, tipo: 'pinch', zoom: fotoZoom, dist: distanzaDita(e.touches) };
    } else if (e.touches.length === 1) {
      iniziaPan(e.touches[0].clientX, e.touches[0].clientY);
    }
  }

  function muoviTouch(e: React.TouchEvent) {
    const st = gestiRef.current;
    if (st.tipo === 'pinch' && e.touches.length === 2 && preferFoto && cosaTrascina() === 'foto') {
      e.preventDefault();
      setFotoZoom(Math.min(2, Math.max(0.6, st.zoom * (distanzaDita(e.touches) / st.dist))));
      return;
    }
    if (st.tipo === 'pan' && e.touches.length === 1) {
      e.preventDefault();
      muoviPan(e.touches[0].clientX, e.touches[0].clientY);
    }
  }

  function onPointerDown(e: React.PointerEvent) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    iniziaPan(e.clientX, e.clientY);
  }

  function onWheel(e: React.WheelEvent) {
    if (!preferFoto || cosaTrascina() !== 'foto') return;
    e.preventDefault();
    setFotoZoom((z) => Math.min(2, Math.max(0.6, z + (e.deltaY > 0 ? -0.05 : 0.05))));
  }

  async function scaricaCard() {
    const url = cardUrl ?? (await esportaCard());
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = 'motogarage-giro.png';
    a.click();
    toast('Card salvata');
  }

  function testoDidascalia() {
    const titolo = luogoCard.trim() || giro.nome;
    return (
      `${titolo !== 'Giro libero' ? `${titolo} · ` : ''}` +
      `${formattaKm(giro.km)} km in moto\nIl mio giro su MotoGarage`
    );
  }

  async function condividiCard() {
    const url = cardUrl ?? (await esportaCard());
    if (!url) return;
    const testo = testoDidascalia();
    if (onNomeChange && luogoCard.trim() && luogoCard.trim() !== giro.nome) {
      onNomeChange(luogoCard.trim());
    }
    try {
      const res = await fetch(url);
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
      // fallback
    }
    scaricaCard();
  }

  return (
    <div className="editor-card space-y-4 rounded-app-lg border border-white/10 bg-[#0e1012] p-4 text-cemento shadow-app-lg sm:p-5">
      <header>
        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-brand">Condividi il giro</p>
        <h2 className="mt-1 font-display text-xl font-black uppercase leading-tight text-white">
          Crea la tua story
        </h2>
      </header>

      {giro.cloudId && onPubblicoChange && (
        <button
          type="button"
          onClick={() => onPubblicoChange(!giro.pubblico)}
          className={`tap flex w-full items-center justify-between gap-3 rounded-app border p-3 text-left ${
            giro.pubblico ? 'border-brand/40 bg-brand/10' : 'border-white/10 bg-white/[0.03]'
          }`}
        >
          <span className="font-mono text-xs font-bold uppercase text-white">
            {giro.pubblico ? 'In community' : 'Pubblica in community'}
          </span>
          <span className={`relative h-6 w-11 shrink-0 rounded-full ${giro.pubblico ? 'bg-brand' : 'bg-white/15'}`}>
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${giro.pubblico ? 'left-[22px]' : 'left-0.5'}`} />
          </span>
        </button>
      )}

      {/* Anteprima live — aggiornamento istantaneo */}
      <section className="editor-card-preview space-y-2">
        <div
          ref={anteprimaRef}
          className="editor-card-preview-canvas mx-auto w-full max-w-[300px] overflow-hidden rounded-[16px] shadow-[0_12px_40px_rgba(0,0,0,0.5)] touch-none sm:max-w-[280px]"
          onTouchStart={iniziaTouch}
          onTouchMove={muoviTouch}
          onTouchEnd={terminaGesto}
          onTouchCancel={terminaGesto}
          onPointerDown={onPointerDown}
          onPointerMove={(e) => gestiRef.current.tipo === 'pan' && muoviPan(e.clientX, e.clientY)}
          onPointerUp={terminaGesto}
          onPointerCancel={terminaGesto}
          onWheel={onWheel}
        >
          <AnteprimaCardLive
            fotoUrl={preferFoto ? fotoSalvata : null}
            fotoZoom={fotoZoom}
            fotoOffsetX={fotoOffsetX}
            fotoOffsetY={fotoOffsetY}
            fotoLuminosita={fotoLuminosita}
            fotoContrasto={fotoContrasto}
            fotoSaturazione={fotoSaturazione}
            filtroFoto={filtroFoto}
            luogo={luogo}
            data={dataBreve}
            mostraData={mostraData}
            stats={statsLive}
            layout={layout}
            punti={giro.punti}
            mostraTracciato={mostraTracciato || !preferFoto}
            tracciatoGrande={!preferFoto}
            tracciatoX={tracciatoX}
            tracciatoY={tracciatoY}
          />
        </div>
        <p className="text-center font-mono text-[9px] uppercase tracking-wide text-cemento/45">
          {preferFoto
            ? 'Trascina per spostare · 2 dita o rotella per zoom'
            : 'Trascina per spostare il tracciato'}
        </p>
      </section>

      {/* Azioni foto */}
      <div className="flex flex-wrap gap-2">
        <label className="tap btn-primary flex-1 cursor-pointer sm:flex-none">
          {preferFoto ? 'Cambia foto' : 'Scegli foto'}
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
              setLayout('strava');
              setMostraTracciato(false);
              setFotoOffsetX(0.5);
              setFotoOffsetY(0.5);
              setFotoZoom(1);
              applicaPreset('normale');
              setElementoTrascina('foto');
            }}
          />
        </label>
        {preferFoto && (
          <button
            type="button"
            onClick={() => {
              setPreferFoto(false);
              setMostraTracciato(true);
            }}
            className="tap editor-card-btn-secondary flex-1 sm:flex-none"
          >
            Solo tracciato
          </button>
        )}
      </div>

      {/* Look — preset visibili subito */}
      {preferFoto && (
        <div>
          <p className="editor-card-label mb-2">Stile foto</p>
          <div className="flex flex-wrap gap-2">
            {PRESET_LOOK.map((p) => (
              <Pill key={p.id} attivo={presetLook === p.id} onClick={() => applicaPreset(p.id)}>
                {p.label}
              </Pill>
            ))}
          </div>
        </div>
      )}

      {/* Layout stile Strava */}
      <div>
        <p className="editor-card-label mb-2">Layout</p>
        <div className="flex gap-2">
          <Pill attivo={layout === 'strava'} onClick={() => setLayout('strava')}>
            Strava
          </Pill>
          <Pill attivo={layout === 'story'} onClick={() => setLayout('story')}>
            Story
          </Pill>
        </div>
        <p className="mt-1.5 font-mono text-[9px] text-cemento/40">
          Strava = stats a destra, foto libera · Story = stats in basso
        </p>
      </div>

      <div>
        <label className="editor-card-label" htmlFor="luogo-card">Luogo</label>
        <input
          id="luogo-card"
          type="text"
          value={luogoCard}
          onChange={(e) => setLuogoCard(e.target.value)}
          placeholder="Es. Marina San Nicola"
          maxLength={40}
          className="editor-card-input mt-2"
        />
      </div>

      {/* Dati opzionali — pill semplici */}
      <div>
        <p className="editor-card-label mb-2">Aggiungi dati</p>
        <div className="flex flex-wrap gap-2">
          <Pill attivo={mostraData} onClick={() => setMostraData((v) => !v)}>Data</Pill>
          <Pill attivo={mostraMax} onClick={() => setMostraMax((v) => !v)}>Vel. max</Pill>
          <Pill attivo={mostraMedia} onClick={() => setMostraMedia((v) => !v)}>Vel. media</Pill>
          <Pill attivo={mostraCurve} onClick={() => setMostraCurve((v) => !v)}>Curve</Pill>
          <Pill attivo={mostraDislivello} onClick={() => setMostraDislivello((v) => !v)}>Dislivello</Pill>
          {preferFoto && (
            <Pill attivo={mostraTracciato} onClick={() => setMostraTracciato((v) => !v)}>Tracciato</Pill>
          )}
        </div>
        {giroMontagna && !mostraDislivello && (
          <button
            type="button"
            onClick={() => setMostraDislivello(true)}
            className="tap mt-2 w-full rounded-app border border-segnale/30 bg-segnale/10 px-3 py-2 font-mono text-[9px] uppercase text-segnale"
          >
            +{stat.dislivelloPositivoM || giro.dislivelloM} m dislivello — mostra?
          </button>
        )}
      </div>

      {preferFoto && mostraTracciato && (
        <div className="flex gap-2">
          <Pill attivo={elementoTrascina === 'foto'} onClick={() => setElementoTrascina('foto')}>Sposta foto</Pill>
          <Pill attivo={elementoTrascina === 'tracciato'} onClick={() => setElementoTrascina('tracciato')}>Sposta tracciato</Pill>
        </div>
      )}

      {errore && (
        <p className="rounded-app border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{errore}</p>
      )}

      <div className="flex flex-col gap-2 border-t border-white/8 pt-4 sm:flex-row">
        <button type="button" onClick={() => void condividiCard()} disabled={generandoCard} className="tap btn-primary flex-1">
          {generandoCard ? 'Preparo…' : 'Condividi'}
        </button>
        <button type="button" onClick={() => void scaricaCard()} disabled={generandoCard} className="tap editor-card-btn-secondary flex-1">
          Salva PNG
        </button>
      </div>
    </div>
  );
}
