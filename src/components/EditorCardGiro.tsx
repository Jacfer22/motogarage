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
  attivo,
  onToggle,
}: {
  label: string;
  attivo: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`tap flex items-center justify-between gap-2 rounded-app border px-3 py-2.5 font-mono text-[10px] font-bold uppercase tracking-wide transition-colors ${
        attivo
          ? 'border-brand/50 bg-brand/10 text-white'
          : 'border-white/10 bg-transparent text-cemento/40'
      }`}
    >
      <span>{label}</span>
      <span className={`h-2 w-2 rounded-full ${attivo ? 'bg-brand' : 'bg-white/20'}`} />
    </button>
  );
}

export default function EditorCardGiro({ giro, onNomeChange, onPubblicoChange }: Props) {
  const { toast } = useFeedback();
  const [temaCard, setTemaCard] = useState<'tracciato' | 'foto'>('tracciato');
  const [paletteCard, setPaletteCard] = useState<'scuro' | 'chiaro'>('scuro');
  const [luogoCard, setLuogoCard] = useState(giro.nome === 'Giro libero' ? '' : giro.nome);
  const [mostraMedia, setMostraMedia] = useState(true);
  const [mostraMax, setMostraMax] = useState(false);
  const [mostraCurve, setMostraCurve] = useState(true);
  const [mostraDislivello, setMostraDislivello] = useState(true);
  const [tracciatoX, setTracciatoX] = useState(0.5);
  const [tracciatoY, setTracciatoY] = useState(0.5);
  const [modalitaEdit, setModalitaEdit] = useState<'foto' | 'tracciato'>('foto');
  const [fotoSalvata, setFotoSalvata] = useState<string | null>(null);
  const [preferFoto, setPreferFoto] = useState(false);
  const [fotoZoom, setFotoZoom] = useState(1);
  const [fotoLuminosita, setFotoLuminosita] = useState(1);
  const [fotoOffsetX, setFotoOffsetX] = useState(0.5);
  const [fotoOffsetY, setFotoOffsetY] = useState(0.5);
  const panRef = useRef<HTMLDivElement>(null);
  const anteprimaRef = useRef<HTMLDivElement>(null);
  const trascinaRef = useRef({ attivo: false, x: 0, y: 0, offX: 0.5, offY: 0.5 });
  const touchRef = useRef({
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
          fotoOffsetX: preferFotoRef.current || foto !== undefined ? fotoOffsetX : undefined,
          fotoOffsetY: preferFotoRef.current || foto !== undefined ? fotoOffsetY : undefined,
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
      fotoOffsetX,
      fotoOffsetY,
    ],
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

  function iniziaTrascina(clientX: number, clientY: number) {
    trascinaRef.current = {
      attivo: true,
      x: clientX,
      y: clientY,
      offX: fotoOffsetX,
      offY: fotoOffsetY,
    };
  }

  function muoviTrascina(clientX: number, clientY: number) {
    if (!trascinaRef.current.attivo || !panRef.current) return;
    const rect = panRef.current.getBoundingClientRect();
    const dx = clientX - trascinaRef.current.x;
    const dy = clientY - trascinaRef.current.y;
    const sens = 0.85;
    setFotoOffsetX(
      Math.min(1, Math.max(0, trascinaRef.current.offX + (dx / rect.width) * sens)),
    );
    setFotoOffsetY(
      Math.min(1, Math.max(0, trascinaRef.current.offY + (dy / rect.height) * sens)),
    );
  }

  function terminaTrascina() {
    trascinaRef.current.attivo = false;
  }

  function distanzaDita(touches: React.TouchList | TouchList) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.hypot(dx, dy);
  }

  function iniziaTouchMobile(e: React.TouchEvent) {
    if (e.touches.length === 2 && preferFoto && modalitaEdit === 'foto') {
      touchRef.current = {
        tipo: 'pinch',
        x: 0,
        y: 0,
        offX: fotoOffsetX,
        offY: fotoOffsetY,
        trX: tracciatoX,
        trY: tracciatoY,
        zoom: fotoZoom,
        dist: distanzaDita(e.touches),
      };
    } else if (e.touches.length === 1) {
      touchRef.current = {
        tipo: 'pan',
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        offX: fotoOffsetX,
        offY: fotoOffsetY,
        trX: tracciatoX,
        trY: tracciatoY,
        zoom: fotoZoom,
        dist: 0,
      };
    }
  }

  function muoviTouchMobile(e: React.TouchEvent) {
    const st = touchRef.current;
    const rect = anteprimaRef.current?.getBoundingClientRect();
    if (!rect) return;

    if (st.tipo === 'pinch' && e.touches.length === 2 && preferFoto && modalitaEdit === 'foto') {
      const ratio = distanzaDita(e.touches) / st.dist;
      setFotoZoom(Math.min(2, Math.max(0.6, st.zoom * ratio)));
      return;
    }

    if (st.tipo === 'pan' && e.touches.length === 1) {
      const dx = e.touches[0].clientX - st.x;
      const dy = e.touches[0].clientY - st.y;
      const sens = 0.95;
      if (modalitaEdit === 'foto' && preferFoto) {
        setFotoOffsetX(Math.min(1, Math.max(0, st.offX + (dx / rect.width) * sens)));
        setFotoOffsetY(Math.min(1, Math.max(0, st.offY + (dy / rect.height) * sens)));
      } else {
        setTracciatoX(Math.min(1, Math.max(0, st.trX + (dx / rect.width) * sens)));
        setTracciatoY(Math.min(1, Math.max(0, st.trY + (dy / rect.height) * sens)));
      }
    }
  }

  function terminaTouchMobile() {
    touchRef.current.tipo = 'none';
  }

  return (
    <div className="editor-card space-y-5 rounded-app-lg border border-white/10 bg-[#0e1012] p-4 text-cemento shadow-app-lg sm:p-5">
      <header>
        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-brand">Card social</p>
        <h2 className="mt-1 font-display text-xl font-black uppercase leading-tight tracking-tight text-white sm:text-2xl">
          Personalizza e condividi
        </h2>
        <p className="mt-2 font-mono text-[11px] uppercase tracking-wide text-cemento/45">
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

      <section className="space-y-4">
        <div>
          <p className="editor-card-label">Tema colore</p>
          <div className="mt-2 flex gap-2">
            <Chip attivo={paletteCard === 'scuro'} onClick={() => setPaletteCard('scuro')}>Scuro</Chip>
            <Chip attivo={paletteCard === 'chiaro'} onClick={() => setPaletteCard('chiaro')}>Chiaro</Chip>
          </div>
        </div>

        <div>
          <p className="editor-card-label">Layout stats</p>
          <div className="mt-2 flex gap-2">
            <Chip attivo={temaCard === 'tracciato'} onClick={() => setTemaCard('tracciato')}>In basso</Chip>
            <Chip attivo={temaCard === 'foto'} onClick={() => setTemaCard('foto')}>Laterale</Chip>
          </div>
        </div>

        <div>
          <label className="editor-card-label" htmlFor="luogo-card">Luogo</label>
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

        <div>
          <p className="editor-card-label">Statistiche</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <StatChip label="Vel. media" attivo={mostraMedia} onToggle={() => setMostraMedia((v) => !v)} />
            <StatChip label="Vel. max" attivo={mostraMax} onToggle={() => setMostraMax((v) => !v)} />
            <StatChip label="Curve" attivo={mostraCurve} onToggle={() => setMostraCurve((v) => !v)} />
            <StatChip label="Dislivello" attivo={mostraDislivello} onToggle={() => setMostraDislivello((v) => !v)} />
          </div>
        </div>
      </section>

      <div className="flex flex-wrap gap-2 border-t border-white/8 pt-4">
        <label className="tap btn-primary cursor-pointer">
          {generandoCard ? 'Genero…' : 'Aggiungi foto'}
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
              setFotoOffsetX(0.5);
              setFotoOffsetY(0.5);
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
          className="tap editor-card-btn-secondary disabled:opacity-50"
        >
          Solo tracciato
        </button>
      </div>

      {fotoSalvata && preferFoto && (
        <section className="hidden space-y-4 rounded-app border border-white/10 bg-black/35 p-4 md:block">
          <p className="editor-card-label">Regola foto di sfondo (desktop)</p>
          <div
            ref={panRef}
            className="relative mx-auto aspect-[9/16] w-full max-w-[220px] cursor-grab overflow-hidden rounded-app border border-white/15 bg-black touch-none active:cursor-grabbing"
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              iniziaTrascina(e.clientX, e.clientY);
            }}
            onPointerMove={(e) => muoviTrascina(e.clientX, e.clientY)}
            onPointerUp={terminaTrascina}
            onPointerCancel={terminaTrascina}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={fotoSalvata}
              alt="Anteprima posizione foto"
              draggable={false}
              className="pointer-events-none absolute left-1/2 top-1/2 max-w-none select-none"
              style={{
                filter: `brightness(${fotoLuminosita})`,
                minWidth: `${fotoZoom * 100}%`,
                minHeight: `${fotoZoom * 100}%`,
                width: 'auto',
                height: 'auto',
                transform: `translate(calc(-50% + ${(fotoOffsetX - 0.5) * 80}%), calc(-50% + ${(fotoOffsetY - 0.5) * 80}%))`,
              }}
            />
            <p className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 py-2 text-center font-mono text-[9px] font-bold uppercase tracking-wide text-cemento/70">
              Trascina per spostare
            </p>
          </div>
          <SliderFoto etichetta="Luminosità" valore={Math.round(fotoLuminosita * 100)} min={50} max={150} onChange={(v) => setFotoLuminosita(v / 100)} />
          <SliderFoto etichetta="Zoom" valore={Math.round(fotoZoom * 100)} min={60} max={200} onChange={(v) => setFotoZoom(v / 100)} />
        </section>
      )}

      {cardUrl && (
        <section className="space-y-3 border-t border-white/8 pt-4">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <p className="editor-card-label mb-0">Anteprima card</p>
            <div className="flex gap-2 md:hidden">
              {preferFoto && (
                <Chip attivo={modalitaEdit === 'foto'} onClick={() => setModalitaEdit('foto')} className="flex-none px-2.5">
                  Foto
                </Chip>
              )}
              <Chip attivo={modalitaEdit === 'tracciato'} onClick={() => setModalitaEdit('tracciato')} className="flex-none px-2.5">
                Tracciato
              </Chip>
            </div>
          </div>
          <p className="font-mono text-[9px] uppercase tracking-wide text-cemento/40 md:hidden">
            {modalitaEdit === 'foto' && preferFoto
              ? '1 dito sposta · 2 dita zoom'
              : '1 dito sposta il tracciato sulla card'}
          </p>
          {preferFoto && (
            <div className="md:hidden">
              <SliderFoto etichetta="Luminosità" valore={Math.round(fotoLuminosita * 100)} min={50} max={150} onChange={(v) => setFotoLuminosita(v / 100)} />
            </div>
          )}
          <div className="mx-auto w-full max-w-[300px] rounded-[18px] border border-white/10 bg-[#08090b] p-2 md:max-w-[260px]">
            <div className="hidden items-center gap-2 px-1 py-1 md:flex">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand text-[9px] font-bold text-white">MG</div>
              <span className="font-mono text-[9px] font-bold uppercase text-cemento/70">motogarage</span>
            </div>
            <div
              ref={anteprimaRef}
              className={`aspect-[4/5] overflow-hidden rounded-[12px] bg-black md:touch-auto ${generandoCard ? 'opacity-70' : ''} touch-none`}
              onTouchStart={iniziaTouchMobile}
              onTouchMove={muoviTouchMobile}
              onTouchEnd={terminaTouchMobile}
              onTouchCancel={terminaTouchMobile}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={cardUrl} alt="Anteprima card" className="h-full w-full select-none object-cover" draggable={false} />
            </div>
          </div>
        </section>
      )}

      {cardUrl && (
        <section className="hidden space-y-3 border-t border-white/8 pt-4 md:block">
          <p className="editor-card-label">Posizione tracciato (desktop)</p>
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
        <span className="font-mono text-xs tabular-nums text-cemento/70">{valore}%</span>
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
