'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { formattaDurata, formattaKm, statisticheGiro } from '@/lib/geo';
import { generaCardGiro } from '@/lib/card-canvas';
import type { GiroUtente } from '@/lib/giri-store';
import { useFeedback } from '@/components/FeedbackProvider';

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

type FiltroFoto = 'none' | 'cinema' | 'caldo' | 'bw';

interface Props {
  giro: GiroUtente;
  onNomeChange?: (nome: string) => void;
  onPubblicoChange?: (pubblico: boolean) => void;
}

function Chip({
  attivo,
  onClick,
  children,
  className = '',
}: {
  attivo: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`tap flex-1 rounded-app border px-3 py-2.5 font-mono text-[10px] font-bold uppercase tracking-wide transition-colors ${
        attivo
          ? 'border-brand bg-brand/20 text-white'
          : 'border-white/12 bg-white/[0.03] text-cemento/55 hover:border-white/22 hover:text-cemento/85'
      } ${className}`}
    >
      {children}
    </button>
  );
}

function StatChip({
  label,
  hint,
  attivo,
  onToggle,
}: {
  label: string;
  hint?: string;
  attivo: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`tap flex flex-col gap-0.5 rounded-app border px-3 py-2.5 text-left transition-colors ${
        attivo
          ? 'border-brand/50 bg-brand/10'
          : 'border-white/10 bg-transparent hover:border-white/18'
      }`}
    >
      <span className="flex items-center justify-between gap-2">
        <span className={`font-mono text-[10px] font-bold uppercase tracking-wide ${attivo ? 'text-white' : 'text-cemento/45'}`}>
          {label}
        </span>
        <span className={`h-2 w-2 shrink-0 rounded-full ${attivo ? 'bg-brand' : 'bg-white/20'}`} />
      </span>
      {hint && (
        <span className={`font-mono text-[9px] leading-snug ${attivo ? 'text-cemento/55' : 'text-cemento/30'}`}>
          {hint}
        </span>
      )}
    </button>
  );
}

function ToolBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="tap rounded-app border border-white/12 bg-white/[0.04] px-3 py-2 font-mono text-[9px] font-bold uppercase tracking-wide text-cemento/70 hover:border-white/22 hover:text-white"
    >
      {children}
    </button>
  );
}

export default function EditorCardGiro({ giro, onNomeChange, onPubblicoChange }: Props) {
  const { toast } = useFeedback();
  const stat = statisticheGiro(giro.punti, giro.durataSec, giro.km);
  const giroMontagna = (stat.dislivelloPositivoM || giro.dislivelloM) >= 150;

  const [temaCard, setTemaCard] = useState<'tracciato' | 'foto'>('tracciato');
  const [paletteCard, setPaletteCard] = useState<'scuro' | 'chiaro'>('scuro');
  const [luogoCard, setLuogoCard] = useState(giro.nome === 'Giro libero' ? '' : giro.nome);
  const [mostraMedia, setMostraMedia] = useState(true);
  const [mostraMax, setMostraMax] = useState(false);
  const [mostraCurve, setMostraCurve] = useState(true);
  const [mostraDislivello, setMostraDislivello] = useState(false);
  const [mostraData, setMostraData] = useState(true);
  const [mostraTracciatoSuFoto, setMostraTracciatoSuFoto] = useState(false);
  const [tracciatoX, setTracciatoX] = useState(0.5);
  const [tracciatoY, setTracciatoY] = useState(0.5);
  const [elementoTrascina, setElementoTrascina] = useState<'foto' | 'tracciato'>('foto');
  const [fotoSalvata, setFotoSalvata] = useState<string | null>(null);
  const [preferFoto, setPreferFoto] = useState(false);
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
    trX: 0.5,
    trY: 0.5,
    zoom: 1,
    dist: 0,
  });
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

  function resetFotoPosizione() {
    setFotoOffsetX(0.5);
    setFotoOffsetY(0.5);
    setFotoZoom(1);
    setFotoLuminosita(1);
    setFotoContrasto(1);
    setFotoSaturazione(1);
    setFiltroFoto('none');
    toast('Foto ripristinata');
  }

  const creaCard = useCallback(
    async (foto?: string | null) => {
      if (giro.punti.length < 2) {
        setErrore('Tracciato GPS insufficiente per generare la card.');
        return;
      }
      setGenerandoCard(true);
      setErrore(null);
      try {
        const statLocal = statisticheGiro(giro.punti, giro.durataSec, giro.km);
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
          dislivelloM: mostraDislivello ? (statLocal.dislivelloPositivoM || giro.dislivelloM) : null,
          velMediaKmh: mostraMedia ? (statLocal.velMediaKmh || giro.velMediaKmh) : null,
          velMaxKmh: mostraMax ? (statLocal.velMaxKmh || giro.velMaxKmh) : null,
          curve: mostraCurve ? (statLocal.curve || giro.curve) : null,
          tracciatoOffsetX: tracciatoX,
          tracciatoOffsetY: tracciatoY,
          fotoScala: preferFotoRef.current || foto !== undefined ? fotoZoom : undefined,
          fotoLuminosita: preferFotoRef.current || foto !== undefined ? fotoLuminosita : undefined,
          fotoContrasto: preferFotoRef.current || foto !== undefined ? fotoContrasto : undefined,
          fotoSaturazione: preferFotoRef.current || foto !== undefined ? fotoSaturazione : undefined,
          filtroFoto: preferFotoRef.current || foto !== undefined ? filtroFoto : undefined,
          fotoOffsetX: preferFotoRef.current || foto !== undefined ? fotoOffsetX : undefined,
          fotoOffsetY: preferFotoRef.current || foto !== undefined ? fotoOffsetY : undefined,
          mostraTracciatoSuFoto: preferFotoRef.current ? mostraTracciatoSuFoto : undefined,
          mostraData,
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
      mostraData,
      mostraTracciatoSuFoto,
      tracciatoX,
      tracciatoY,
      fotoZoom,
      fotoLuminosita,
      fotoContrasto,
      fotoSaturazione,
      filtroFoto,
      fotoOffsetX,
      fotoOffsetY,
    ],
  );

  useEffect(() => {
    if (!rigeneraAbilitato.current && !fotoSalvata) return;
    const timer = setTimeout(() => {
      void creaCard();
    }, 180);
    return () => clearTimeout(timer);
  }, [
    temaCard,
    paletteCard,
    luogoCard,
    mostraMedia,
    mostraMax,
    mostraCurve,
    mostraDislivello,
    mostraData,
    mostraTracciatoSuFoto,
    tracciatoX,
    tracciatoY,
    fotoZoom,
    fotoLuminosita,
    fotoContrasto,
    fotoSaturazione,
    filtroFoto,
    fotoOffsetX,
    fotoOffsetY,
    creaCard,
  ]);

  function scaricaCard() {
    if (!cardUrl) return;
    const a = document.createElement('a');
    a.href = cardUrl;
    a.download = 'motogarage-giro.png';
    a.click();
    toast('Card salvata');
  }

  function testoDidascalia() {
    const titolo = luogoCard.trim() || giro.nome;
    return (
      `${titolo !== 'Giro libero' ? `${titolo} · ` : ''}` +
      `${formattaKm(giro.km)} km in moto\n` +
      `Il mio giro su MotoGarage`
    );
  }

  async function copiaDidascalia() {
    try {
      await navigator.clipboard.writeText(testoDidascalia());
      toast('Didascalia copiata negli appunti');
    } catch {
      setErrore('Non sono riuscito a copiare la didascalia.');
    }
  }

  async function condividiCard() {
    if (!cardUrl) return;
    const testo = testoDidascalia();
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

  function cosaTrascina(): 'foto' | 'tracciato' {
    if (preferFoto) return mostraTracciatoSuFoto ? elementoTrascina : 'foto';
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
      gestiRef.current = {
        ...gestiRef.current,
        tipo: 'pinch',
        zoom: fotoZoom,
        dist: distanzaDita(e.touches),
      };
    } else if (e.touches.length === 1) {
      iniziaPan(e.touches[0].clientX, e.touches[0].clientY);
    }
  }

  function muoviTouch(e: React.TouchEvent) {
    const st = gestiRef.current;
    if (st.tipo === 'pinch' && e.touches.length === 2 && preferFoto && cosaTrascina() === 'foto') {
      e.preventDefault();
      const ratio = distanzaDita(e.touches) / st.dist;
      setFotoZoom(Math.min(2, Math.max(0.6, st.zoom * ratio)));
      return;
    }
    if (st.tipo === 'pan' && e.touches.length === 1) {
      e.preventDefault();
      muoviPan(e.touches[0].clientX, e.touches[0].clientY);
    }
  }

  function onPointerDownAnteprima(e: React.PointerEvent) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    iniziaPan(e.clientX, e.clientY);
  }

  function onPointerMoveAnteprima(e: React.PointerEvent) {
    if (gestiRef.current.tipo === 'pan') muoviPan(e.clientX, e.clientY);
  }

  function onWheelAnteprima(e: React.WheelEvent) {
    if (!preferFoto || cosaTrascina() !== 'foto') return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.04 : 0.04;
    setFotoZoom((z) => Math.min(2, Math.max(0.6, z + delta)));
  }

  const hintTrascina = preferFoto
    ? cosaTrascina() === 'foto'
      ? 'Trascina l\'anteprima per spostare la foto · 2 dita o rotella per lo zoom'
      : 'Trascina l\'anteprima per spostare il mini tracciato'
    : 'Trascina l\'anteprima per spostare il tracciato';

  const filtri: { id: FiltroFoto; label: string }[] = [
    { id: 'none', label: 'Originale' },
    { id: 'cinema', label: 'Cinema' },
    { id: 'caldo', label: 'Caldo' },
    { id: 'bw', label: 'B/N' },
  ];

  return (
    <div className="editor-card space-y-5 rounded-app-lg border border-white/10 bg-[#0e1012] p-4 text-cemento shadow-app-lg sm:p-5">
      <header>
        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-brand">Card social</p>
        <h2 className="mt-1 font-display text-xl font-black uppercase leading-tight tracking-tight text-white sm:text-2xl">
          Personalizza e condividi
        </h2>
        <p className="mt-2 font-mono text-[11px] uppercase tracking-wide text-cemento/55">
          {formattaKm(giro.km)} km · {formattaDurata(giro.durataSec)} · {formattaDataBreve(giro.data)}
        </p>
      </header>

      {giro.cloudId && onPubblicoChange && (
        <button
          type="button"
          onClick={() => onPubblicoChange(!giro.pubblico)}
          className={`tap flex w-full items-center justify-between gap-3 rounded-app border p-3.5 text-left transition-colors ${
            giro.pubblico
              ? 'border-brand/40 bg-brand/10'
              : 'border-white/10 bg-white/[0.03]'
          }`}
        >
          <span>
            <span className="block font-mono text-xs font-bold uppercase text-white">
              {giro.pubblico ? 'In community' : 'Pubblica in community'}
            </span>
            <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-wide text-cemento/45">
              Mostra questo giro nel feed
            </span>
          </span>
          <span className={`relative h-6 w-11 shrink-0 rounded-full ${giro.pubblico ? 'bg-brand' : 'bg-white/15'}`}>
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${giro.pubblico ? 'left-[22px]' : 'left-0.5'}`} />
          </span>
        </button>
      )}

      {/* Foto + anteprima in cima */}
      <div className="flex flex-wrap gap-2">
        <label className="tap btn-primary cursor-pointer flex-1 sm:flex-none">
          {generandoCard ? 'Genero…' : preferFoto ? 'Cambia foto' : 'Aggiungi foto'}
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
              setTemaCard('tracciato');
              setMostraTracciatoSuFoto(false);
              setFotoZoom(1);
              setFotoLuminosita(1);
              setFotoContrasto(1);
              setFotoSaturazione(1);
              setFiltroFoto('none');
              setFotoOffsetX(0.5);
              setFotoOffsetY(0.5);
              setElementoTrascina('foto');
              rigeneraAbilitato.current = true;
              await creaCard(foto);
            }}
          />
        </label>
        {preferFoto && (
          <button
            type="button"
            onClick={() => {
              setPreferFoto(false);
              setMostraTracciatoSuFoto(false);
              void creaCard(null);
            }}
            disabled={generandoCard}
            className="tap editor-card-btn-secondary flex-1 sm:flex-none disabled:opacity-50"
          >
            Solo tracciato
          </button>
        )}
        {!cardUrl && !preferFoto && (
          <button
            type="button"
            onClick={() => {
              rigeneraAbilitato.current = true;
              void creaCard(null);
            }}
            disabled={generandoCard}
            className="tap editor-card-btn-secondary flex-1 sm:flex-none disabled:opacity-50"
          >
            Genera card
          </button>
        )}
      </div>

      {cardUrl && (
        <section className="editor-card-preview space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <p className="editor-card-label mb-0">Anteprima</p>
            {preferFoto && mostraTracciatoSuFoto && (
              <div className="flex gap-2">
                <Chip attivo={elementoTrascina === 'foto'} onClick={() => setElementoTrascina('foto')} className="flex-none px-2.5">
                  Sposta foto
                </Chip>
                <Chip attivo={elementoTrascina === 'tracciato'} onClick={() => setElementoTrascina('tracciato')} className="flex-none px-2.5">
                  Sposta tracciato
                </Chip>
              </div>
            )}
          </div>
          <p className="font-mono text-[9px] uppercase tracking-wide text-cemento/50">
            {hintTrascina}
          </p>
          <div className="mx-auto w-full max-w-[280px] rounded-[18px] border border-white/12 bg-[#08090b] p-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.45)] sm:max-w-[260px]">
            <div
              ref={anteprimaRef}
              className={`editor-card-preview-canvas aspect-[4/5] overflow-hidden rounded-[12px] bg-black ${generandoCard ? 'opacity-70' : ''} touch-none`}
              onTouchStart={iniziaTouch}
              onTouchMove={muoviTouch}
              onTouchEnd={terminaGesto}
              onTouchCancel={terminaGesto}
              onPointerDown={onPointerDownAnteprima}
              onPointerMove={onPointerMoveAnteprima}
              onPointerUp={terminaGesto}
              onPointerCancel={terminaGesto}
              onWheel={onWheelAnteprima}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={cardUrl} alt="Anteprima card" className="pointer-events-none h-full w-full select-none object-cover" draggable={false} />
            </div>
          </div>
        </section>
      )}

      {preferFoto && (
        <section className="editor-card-tools space-y-4 rounded-app border border-white/10 bg-black/30 p-4">
          <div>
            <p className="editor-card-label">Regola foto</p>
            <p className="mt-1 font-mono text-[9px] uppercase tracking-wide text-cemento/38">
              Trascina l&apos;anteprima sopra per posizionare la foto — stesso gesto su mobile e desktop
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <ToolBtn onClick={() => { setFotoOffsetX(0.5); setFotoOffsetY(0.5); }}>Centra</ToolBtn>
            <ToolBtn onClick={resetFotoPosizione}>Reset</ToolBtn>
          </div>

          <div>
            <p className="editor-card-label mb-2">Filtro</p>
            <div className="flex flex-wrap gap-2">
              {filtri.map((f) => (
                <Chip
                  key={f.id}
                  attivo={filtroFoto === f.id}
                  onClick={() => setFiltroFoto(f.id)}
                  className="flex-none px-3"
                >
                  {f.label}
                </Chip>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <SliderFoto etichetta="Luminosità" valore={Math.round(fotoLuminosita * 100)} min={50} max={150} onChange={(v) => setFotoLuminosita(v / 100)} />
            <SliderFoto etichetta="Contrasto" valore={Math.round(fotoContrasto * 100)} min={75} max={140} onChange={(v) => setFotoContrasto(v / 100)} />
            <SliderFoto etichetta="Saturazione" valore={Math.round(fotoSaturazione * 100)} min={50} max={150} onChange={(v) => setFotoSaturazione(v / 100)} />
            <SliderFoto etichetta="Zoom" valore={Math.round(fotoZoom * 100)} min={60} max={200} onChange={(v) => setFotoZoom(v / 100)} />
          </div>
        </section>
      )}

      <section className="space-y-4 border-t border-white/8 pt-4">
        <div>
          <label className="editor-card-label" htmlFor="luogo-card">Luogo del giro</label>
          <input
            id="luogo-card"
            type="text"
            value={luogoCard}
            onChange={(e) => setLuogoCard(e.target.value)}
            placeholder="Es. Passo dello Stelvio"
            maxLength={40}
            className="editor-card-input mt-2"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="editor-card-label">Stile card</p>
            <div className="mt-2 flex gap-2">
              <Chip attivo={paletteCard === 'scuro'} onClick={() => setPaletteCard('scuro')}>Scuro</Chip>
              <Chip attivo={paletteCard === 'chiaro'} onClick={() => setPaletteCard('chiaro')}>Chiaro</Chip>
            </div>
          </div>
          <div>
            <p className="editor-card-label">Posizione stats</p>
            <div className="mt-2 flex gap-2">
              <Chip attivo={temaCard === 'tracciato'} onClick={() => setTemaCard('tracciato')}>In basso</Chip>
              <Chip attivo={temaCard === 'foto'} onClick={() => setTemaCard('foto')}>Laterale</Chip>
            </div>
          </div>
        </div>

        <div>
          <p className="editor-card-label">Cosa mostrare</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <StatChip label="Data giro" attivo={mostraData} onToggle={() => setMostraData((v) => !v)} hint="Badge in alto a destra" />
            <StatChip label="Vel. media" attivo={mostraMedia} onToggle={() => setMostraMedia((v) => !v)} />
            <StatChip label="Vel. max" attivo={mostraMax} onToggle={() => setMostraMax((v) => !v)} />
            <StatChip label="Curve" attivo={mostraCurve} onToggle={() => setMostraCurve((v) => !v)} />
            <StatChip
              label="Dislivello"
              attivo={mostraDislivello}
              onToggle={() => setMostraDislivello((v) => !v)}
              hint={giroMontagna ? `+${stat.dislivelloPositivoM || giro.dislivelloM} m · per giri in montagna` : 'Per passi e salite'}
            />
            {preferFoto && (
              <StatChip
                label="Mini tracciato"
                attivo={mostraTracciatoSuFoto}
                onToggle={() => {
                  setMostraTracciatoSuFoto((v) => {
                    const next = !v;
                    if (next) setElementoTrascina('foto');
                    return next;
                  });
                }}
                hint="Piccolo in basso · trascinalo sull'anteprima"
              />
            )}
          </div>
        </div>

        {giroMontagna && !mostraDislivello && (
          <button
            type="button"
            onClick={() => setMostraDislivello(true)}
            className="tap w-full rounded-app border border-segnale/35 bg-segnale/10 px-3 py-2.5 text-left font-mono text-[10px] uppercase tracking-wide text-segnale hover:bg-segnale/15"
          >
            Giro in montagna — mostra +{stat.dislivelloPositivoM || giro.dislivelloM} m dislivello?
          </button>
        )}
      </section>

      {cardUrl && !preferFoto && (
        <section className="hidden space-y-3 border-t border-white/8 pt-4 md:block">
          <p className="editor-card-label">Posizione tracciato (slider)</p>
          <SliderFoto etichetta="Orizzontale" valore={Math.round(tracciatoX * 100)} min={0} max={100} onChange={(v) => setTracciatoX(v / 100)} />
          <SliderFoto etichetta="Verticale" valore={Math.round(tracciatoY * 100)} min={0} max={100} onChange={(v) => setTracciatoY(v / 100)} />
        </section>
      )}

      {errore && (
        <p className="rounded-app border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{errore}</p>
      )}

      {cardUrl && (
        <div className="flex flex-col gap-2 border-t border-white/8 pt-4 sm:flex-row sm:flex-wrap">
          <button type="button" onClick={condividiCard} className="tap btn-primary flex-1 sm:flex-none">
            Condividi
          </button>
          <button type="button" onClick={() => void copiaDidascalia()} className="tap editor-card-btn-secondary flex-1 sm:flex-none">
            Copia didascalia
          </button>
          <button type="button" onClick={scaricaCard} className="tap editor-card-btn-secondary flex-1 sm:flex-none">
            Salva PNG
          </button>
        </div>
      )}
    </div>
  );
}

function SliderFoto({
  etichetta,
  valore,
  min,
  max,
  onChange,
}: {
  etichetta: string;
  valore: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="editor-card-label mb-0">{etichetta}</span>
        <span className="font-mono text-xs tabular-nums text-cemento/75">{valore}%</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={valore}
        onChange={(e) => onChange(Number(e.target.value))}
        className="editor-card-range h-2 w-full cursor-pointer"
        aria-label={`${etichetta} ${valore}%`}
      />
    </div>
  );
}
