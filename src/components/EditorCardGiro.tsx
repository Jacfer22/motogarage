'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { formattaDurata, formattaKmDisplay, statisticheGiro } from '@/lib/geo';
import { generaCardGiro } from '@/lib/card-canvas';
import { PRESET_LOOK, type FiltroFoto, type PresetLook } from '@/lib/card-foto-filtri';
import type { GiroUtente } from '@/lib/giri-store';
import { useFeedback } from '@/components/FeedbackProvider';
import AnteprimaCardLive, { type LayoutCard, type SelezioneCard } from '@/components/AnteprimaCardLive';
import ModalSalvaImmagine from '@/components/ModalSalvaImmagine';
import {
  condividiImmagineSocial,
  isDispositivoMobile,
  preparaImmagineStory,
  salvaInGalleria,
  scaricaBlob,
} from '@/lib/condividi-immagine';
import { generaDidascaliaGiro } from '@/lib/caption-giro';

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

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 3;
const ROT_MIN = -180;
const ROT_MAX = 180;

function normalizzaGradi(gradi: number): number {
  let v = ((gradi + 180) % 360 + 360) % 360 - 180;
  return Math.round(v);
}

function RegolaZoom({
  label,
  value,
  onChange,
  attivo,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  attivo?: boolean;
}) {
  const pct = Math.round(value * 100);
  return (
    <div className={`rounded-app border px-3 py-2.5 ${attivo ? 'border-brand/40 bg-brand/5' : 'border-white/10 bg-white/[0.03]'}`}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="font-mono text-[9px] font-bold uppercase tracking-wide text-white/70">{label}</span>
        <span className="font-mono text-[10px] tabular-nums text-brand">{pct}%</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label={`Riduci ${label}`}
          onClick={() => onChange(Math.max(ZOOM_MIN, Math.round((value - 0.08) * 100) / 100))}
          className="tap flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] font-mono text-sm text-white"
        >
          −
        </button>
        <input
          type="range"
          min={ZOOM_MIN}
          max={ZOOM_MAX}
          step={0.02}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="editor-card-range flex-1"
        />
        <button
          type="button"
          aria-label={`Aumenta ${label}`}
          onClick={() => onChange(Math.min(ZOOM_MAX, Math.round((value + 0.08) * 100) / 100))}
          className="tap flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] font-mono text-sm text-white"
        >
          +
        </button>
      </div>
    </div>
  );
}

function RegolaRotazione({
  label,
  value,
  onChange,
  attivo,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  attivo?: boolean;
}) {
  return (
    <div className={`rounded-app border px-3 py-2.5 ${attivo ? 'border-brand/40 bg-brand/5' : 'border-white/10 bg-white/[0.03]'}`}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="font-mono text-[9px] font-bold uppercase tracking-wide text-white/70">{label}</span>
        <span className="font-mono text-[10px] tabular-nums text-brand">{Math.round(value)}°</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label={`Ruota ${label} a sinistra`}
          onClick={() => onChange(normalizzaGradi(value - 5))}
          className="tap flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] font-mono text-sm text-white"
        >
          ↺
        </button>
        <input
          type="range"
          min={ROT_MIN}
          max={ROT_MAX}
          step={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="editor-card-range flex-1"
        />
        <button
          type="button"
          aria-label={`Ruota ${label} a destra`}
          onClick={() => onChange(normalizzaGradi(value + 5))}
          className="tap flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] font-mono text-sm text-white"
        >
          ↻
        </button>
        <button
          type="button"
          aria-label={`Azzera rotazione ${label}`}
          onClick={() => onChange(0)}
          className="tap shrink-0 rounded-full border border-white/15 bg-white/[0.04] px-2 py-1 font-mono text-[9px] text-white/70"
        >
          0°
        </button>
      </div>
    </div>
  );
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
          ? 'border-brand bg-brand text-white shadow-[0_0_16px_rgba(237,33,0,0.35)]'
          : 'border-white/15 bg-white/[0.04] text-cemento/60 hover:border-white/25'
      }`}
    >
      {children}
    </button>
  );
}

export default function EditorCardGiro({ giro, onNomeChange, onPubblicoChange }: Props) {
  const { toast } = useFeedback();
  const stat = statisticheGiro(giro.punti, giro.durataSec, giro.km * 1000);
  const giroMontagna = (stat.dislivelloPositivoM || giro.dislivelloM) >= 150;

  const [layout, setLayout] = useState<LayoutCard>('laterale');
  const [luogoCard, setLuogoCard] = useState(giro.nome === 'Giro libero' ? '' : giro.nome);
  const [mostraMax, setMostraMax] = useState(true);
  const [mostraMedia, setMostraMedia] = useState(false);
  const [mostraCurve, setMostraCurve] = useState(false);
  const [mostraDislivello, setMostraDislivello] = useState(false);
  const [mostraData, setMostraData] = useState(false);
  const [selezione, setSelezione] = useState<SelezioneCard>('foto');
  const [tracciatoX, setTracciatoX] = useState(0.35);
  const [tracciatoY, setTracciatoY] = useState(0.22);
  const [tracciatoZoom, setTracciatoZoom] = useState(1);
  const [tracciatoRotazione, setTracciatoRotazione] = useState(0);

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
  const [fotoRotazione, setFotoRotazione] = useState(0);

  const anteprimaRef = useRef<HTMLDivElement>(null);
  const gestiRef = useRef({
    tipo: 'none' as 'none' | 'pan' | 'pinch',
    x: 0,
    y: 0,
    offX: 0.5,
    offY: 0.5,
    trX: 0.35,
    trY: 0.22,
    zoom: 1,
    rotazione: 0,
    dist: 0,
    angolo: 0,
  });
  const tapRef = useRef({ x: 0, y: 0, mosso: false });
  const selezioneRef = useRef<SelezioneCard>('foto');

  const [cardUrl, setCardUrl] = useState<string | null>(null);
  const [generandoCard, setGenerandoCard] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);
  const [mobile, setMobile] = useState(false);
  const [modalSalvaUrl, setModalSalvaUrl] = useState<string | null>(null);

  useEffect(() => {
    setMobile(isDispositivoMobile());
  }, []);

  const dataBreve = formattaDataBreve(giro.data);
  const luogo = (luogoCard.trim() || giro.nome).toUpperCase();
  const didascaliaSocial = useMemo(
    () =>
      generaDidascaliaGiro(
        {
          nome: luogoCard.trim() || giro.nome,
          km: giro.km,
          durataSec: giro.durataSec,
          curve: stat.curve,
          dislivelloM: stat.dislivelloPositivoM || giro.dislivelloM,
          velMediaKmh: stat.velMediaKmh,
        },
        luogoCard.trim() || undefined,
      ),
    [giro, luogoCard, stat],
  );
  const selezioneAttiva: SelezioneCard = preferFoto ? selezione : 'percorso';

  useEffect(() => {
    selezioneRef.current = selezioneAttiva;
  }, [selezioneAttiva]);

  useEffect(() => {
    const el = anteprimaRef.current;
    if (!el) return;

    const onTouchMove = (e: TouchEvent) => {
      const st = gestiRef.current;
      if (st.tipo === 'pinch' && e.touches.length === 2) {
        e.preventDefault();
        const ratio = distanzaDitaTouch(e.touches) / st.dist;
        const nextZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, st.zoom * ratio));
        const deltaAng = angoloDitaTouch(e.touches) - st.angolo;
        const nextRot = normalizzaGradi(st.rotazione + (deltaAng * 180) / Math.PI);
        if (selezioneRef.current === 'percorso') {
          setTracciatoZoom(nextZoom);
          setTracciatoRotazione(nextRot);
        } else {
          setFotoZoom(nextZoom);
          setFotoRotazione(nextRot);
        }
        return;
      }
      if (st.tipo === 'pan' && e.touches.length === 1) {
        e.preventDefault();
        const rect = el.getBoundingClientRect();
        if (Math.abs(e.touches[0].clientX - tapRef.current.x) > 6 || Math.abs(e.touches[0].clientY - tapRef.current.y) > 6) {
          tapRef.current.mosso = true;
        }
        applicaPanTouch(e.touches[0].clientX - st.x, e.touches[0].clientY - st.y, rect);
      }
    };

    el.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => el.removeEventListener('touchmove', onTouchMove);
  }, []);

  function distanzaDitaTouch(touches: TouchList) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.hypot(dx, dy);
  }

  function angoloDitaTouch(touches: TouchList) {
    return Math.atan2(touches[1].clientY - touches[0].clientY, touches[1].clientX - touches[0].clientX);
  }

  function applicaPanTouch(dx: number, dy: number, rect: DOMRect) {
    const sens = 0.95;
    const st = gestiRef.current;
    if (selezioneRef.current === 'foto') {
      setFotoOffsetX(Math.min(1, Math.max(0, st.offX + (dx / rect.width) * sens)));
      setFotoOffsetY(Math.min(1, Math.max(0, st.offY + (dy / rect.height) * sens)));
    } else {
      setTracciatoX(Math.min(1, Math.max(0, st.trX + (dx / rect.width) * sens)));
      setTracciatoY(Math.min(1, Math.max(0, st.trY + (dy / rect.height) * sens)));
    }
  }

  const statsLive = useMemo(() => {
    const s: { label: string; valore: string; accent?: boolean }[] = [
      { label: 'Distanza', valore: `${formattaKmDisplay(giro.km)} km` },
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
        km: formattaKmDisplay(giro.km),
        durata: formattaDurata(giro.durataSec),
        data: dataBreve,
        punti: giro.punti,
        tema: layout === 'laterale' ? 'foto' : 'tracciato',
        palette: 'scuro',
        luogo: luogoCard.trim() || null,
        fotoDataUrl: preferFoto ? fotoSalvata : null,
        dislivelloM: mostraDislivello ? (stat.dislivelloPositivoM || giro.dislivelloM) : null,
        velMediaKmh: mostraMedia ? (stat.velMediaKmh || giro.velMediaKmh) : null,
        velMaxKmh: mostraMax ? (stat.velMaxKmh || giro.velMaxKmh) : null,
        curve: mostraCurve ? (stat.curve || giro.curve) : null,
        tracciatoOffsetX: tracciatoX,
        tracciatoOffsetY: tracciatoY,
        tracciatoScala: tracciatoZoom,
        tracciatoRotazione,
        fotoScala: preferFoto ? fotoZoom : undefined,
        fotoRotazione: preferFoto ? fotoRotazione : undefined,
        fotoLuminosita: preferFoto ? fotoLuminosita : undefined,
        fotoContrasto: preferFoto ? fotoContrasto : undefined,
        fotoSaturazione: preferFoto ? fotoSaturazione : undefined,
        filtroFoto: preferFoto ? filtroFoto : undefined,
        fotoOffsetX: preferFoto ? fotoOffsetX : undefined,
        fotoOffsetY: preferFoto ? fotoOffsetY : undefined,
        mostraTracciatoSuFoto: preferFoto ? true : undefined,
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
    tracciatoX,
    tracciatoY,
    tracciatoZoom,
    tracciatoRotazione,
    fotoZoom,
    fotoRotazione,
    fotoLuminosita,
    fotoContrasto,
    fotoSaturazione,
    filtroFoto,
    fotoOffsetX,
    fotoOffsetY,
    stat,
  ]);

  function selezionaDaTap(clientX: number, clientY: number) {
    const rect = anteprimaRef.current?.getBoundingClientRect();
    if (!rect || !preferFoto) {
      setSelezione('percorso');
      return;
    }
    const lx = (clientX - rect.left) / rect.width;
    const ly = (clientY - rect.top) / rect.height;
    if (lx < 0.44 && ly < 0.42) setSelezione('percorso');
    else setSelezione('foto');
  }

  function distanzaDita(touches: React.TouchList | TouchList) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.hypot(dx, dy);
  }

  function angoloDita(touches: React.TouchList | TouchList) {
    return Math.atan2(touches[1].clientY - touches[0].clientY, touches[1].clientX - touches[0].clientX);
  }

  function applicaPan(dx: number, dy: number, rect: DOMRect) {
    tapRef.current.mosso = true;
    const sens = 0.95;
    const st = gestiRef.current;
    if (selezioneAttiva === 'foto') {
      setFotoOffsetX(Math.min(1, Math.max(0, st.offX + (dx / rect.width) * sens)));
      setFotoOffsetY(Math.min(1, Math.max(0, st.offY + (dy / rect.height) * sens)));
    } else {
      setTracciatoX(Math.min(1, Math.max(0, st.trX + (dx / rect.width) * sens)));
      setTracciatoY(Math.min(1, Math.max(0, st.trY + (dy / rect.height) * sens)));
    }
  }

  function iniziaPan(clientX: number, clientY: number) {
    tapRef.current = { x: clientX, y: clientY, mosso: false };
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
    if (Math.abs(clientX - tapRef.current.x) > 6 || Math.abs(clientY - tapRef.current.y) > 6) {
      tapRef.current.mosso = true;
    }
    applicaPan(clientX - st.x, clientY - st.y, rect);
  }

  function terminaGesto(clientX?: number, clientY?: number) {
    if (gestiRef.current.tipo === 'pan' && !tapRef.current.mosso && clientX != null && clientY != null) {
      selezionaDaTap(clientX, clientY);
    }
    gestiRef.current.tipo = 'none';
  }

  function iniziaTouch(e: React.TouchEvent) {
    if (e.touches.length === 2) {
      gestiRef.current = {
        ...gestiRef.current,
        tipo: 'pinch',
        zoom: selezioneAttiva === 'percorso' ? tracciatoZoom : fotoZoom,
        rotazione: selezioneAttiva === 'percorso' ? tracciatoRotazione : fotoRotazione,
        dist: distanzaDita(e.touches),
        angolo: angoloDita(e.touches),
      };
    } else if (e.touches.length === 1) {
      iniziaPan(e.touches[0].clientX, e.touches[0].clientY);
    }
  }

  function onPointerDown(e: React.PointerEvent) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    iniziaPan(e.clientX, e.clientY);
  }

  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    if (e.shiftKey) {
      const delta = e.deltaY > 0 ? -3 : 3;
      if (selezioneAttiva === 'percorso') {
        setTracciatoRotazione((r) => normalizzaGradi(r + delta));
      } else if (preferFoto) {
        setFotoRotazione((r) => normalizzaGradi(r + delta));
      }
      return;
    }
    const delta = e.deltaY > 0 ? -0.06 : 0.06;
    if (selezioneAttiva === 'percorso') {
      setTracciatoZoom((z) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z + delta)));
    } else if (preferFoto) {
      setFotoZoom((z) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z + delta)));
    }
  }

  async function ottieniImmagineStory() {
    const url = cardUrl ?? (await esportaCard());
    if (!url) return null;
    return preparaImmagineStory(url, { nomeBase: 'motogarage-giro' });
  }

  async function scaricaCard() {
    const immagine = await ottieniImmagineStory();
    if (!immagine) return;

    if (mobile) {
      const esito = await salvaInGalleria(immagine.file);
      if (esito === 'ok') {
        toast('Scegli «Salva immagine» o «Foto» per aggiungerla in galleria');
        return;
      }
      if (esito === 'annullato') return;
      setModalSalvaUrl(immagine.anteprimaUrl);
      return;
    }

    scaricaBlob(immagine.blob, `motogarage-giro.${immagine.estensione}`);
    toast('Card salvata');
  }

  async function condividiCard() {
    const immagine = await ottieniImmagineStory();
    if (!immagine) return;
    if (onNomeChange && luogoCard.trim() && luogoCard.trim() !== giro.nome) {
      onNomeChange(luogoCard.trim());
    }
    try {
      const esito = await condividiImmagineSocial(immagine.file);
      if (esito === 'ok') return;
      if (esito === 'annullato') return;

      if (mobile) {
        setModalSalvaUrl(immagine.anteprimaUrl);
        return;
      }

      scaricaBlob(immagine.blob, `motogarage-giro.${immagine.estensione}`);
      toast('Condivisione non disponibile — immagine scaricata');
    } catch {
      scaricaBlob(immagine.blob, `motogarage-giro.${immagine.estensione}`);
      toast('Condivisione non riuscita — immagine scaricata');
    }
  }

  return (
    <div className="editor-card space-y-4 rounded-app-lg border border-white/10 bg-notte p-4 text-cemento shadow-app-lg sm:p-5">
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

      <section className="editor-card-preview space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="editor-card-label mb-0">Anteprima</p>
          {preferFoto && (
            <div className="flex gap-1.5">
              <Pill attivo={selezione === 'foto'} onClick={() => setSelezione('foto')}>Foto</Pill>
              <Pill attivo={selezione === 'percorso'} onClick={() => setSelezione('percorso')}>Percorso</Pill>
            </div>
          )}
        </div>
        <div
          ref={anteprimaRef}
          className="editor-card-preview-canvas mx-auto w-full max-w-[300px] overflow-hidden rounded-[16px] shadow-[0_12px_40px_rgba(0,0,0,0.5)] touch-none sm:max-w-[280px]"
          onTouchStart={iniziaTouch}
          onTouchEnd={(e) => terminaGesto(e.changedTouches[0]?.clientX, e.changedTouches[0]?.clientY)}
          onTouchCancel={() => terminaGesto()}
          onPointerDown={onPointerDown}
          onPointerMove={(e) => gestiRef.current.tipo === 'pan' && muoviPan(e.clientX, e.clientY)}
          onPointerUp={(e) => terminaGesto(e.clientX, e.clientY)}
          onPointerCancel={() => terminaGesto()}
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
            tracciatoGrande={!preferFoto}
            tracciatoX={tracciatoX}
            tracciatoY={tracciatoY}
            tracciatoZoom={tracciatoZoom}
            fotoRotazione={fotoRotazione}
            tracciatoRotazione={tracciatoRotazione}
            selezione={preferFoto ? selezione : 'percorso'}
          />
        </div>
        <p className="text-center font-mono text-[9px] uppercase tracking-wide text-cemento/50">
          Trascina per spostare · pinch per zoom e rotazione · Shift+rotella ruota
        </p>

        <div className="space-y-2 pt-1">
          {preferFoto && (
            <>
              <RegolaZoom
                label="Zoom foto"
                value={fotoZoom}
                onChange={setFotoZoom}
                attivo={selezioneAttiva === 'foto'}
              />
              <RegolaRotazione
                label="Rotazione foto"
                value={fotoRotazione}
                onChange={setFotoRotazione}
                attivo={selezioneAttiva === 'foto'}
              />
            </>
          )}
          <RegolaZoom
            label="Zoom percorso"
            value={tracciatoZoom}
            onChange={setTracciatoZoom}
            attivo={selezioneAttiva === 'percorso'}
          />
          <RegolaRotazione
            label="Rotazione percorso"
            value={tracciatoRotazione}
            onChange={setTracciatoRotazione}
            attivo={selezioneAttiva === 'percorso'}
          />
        </div>
      </section>

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
              setLayout('laterale');
              setFotoOffsetX(0.5);
              setFotoOffsetY(0.5);
              setFotoZoom(1);
              setFotoRotazione(0);
              setTracciatoX(0.35);
              setTracciatoY(0.22);
              setTracciatoZoom(1);
              setTracciatoRotazione(0);
              setSelezione('foto');
              applicaPreset('normale');
            }}
          />
        </label>
        {preferFoto && (
          <button
            type="button"
            onClick={() => {
              setPreferFoto(false);
              setSelezione('percorso');
            }}
            className="tap editor-card-btn-secondary flex-1 sm:flex-none"
          >
            Solo tracciato
          </button>
        )}
      </div>

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

      <div>
        <p className="editor-card-label mb-2">Layout</p>
        <div className="flex gap-2">
          <Pill attivo={layout === 'laterale'} onClick={() => setLayout('laterale')}>
            Laterale
          </Pill>
          <Pill attivo={layout === 'basso'} onClick={() => setLayout('basso')}>
            In basso
          </Pill>
        </div>
        <p className="mt-1.5 font-mono text-[9px] text-cemento/40">
          Laterale = stats a destra · In basso = stats sotto al luogo
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

      <div>
        <p className="editor-card-label mb-2">Aggiungi dati</p>
        <div className="flex flex-wrap gap-2">
          <Pill attivo={mostraData} onClick={() => setMostraData((v) => !v)}>Data</Pill>
          <Pill attivo={mostraMax} onClick={() => setMostraMax((v) => !v)}>Vel. max</Pill>
          <Pill attivo={mostraMedia} onClick={() => setMostraMedia((v) => !v)}>Vel. media</Pill>
          <Pill attivo={mostraCurve} onClick={() => setMostraCurve((v) => !v)}>Curve</Pill>
          <Pill attivo={mostraDislivello} onClick={() => setMostraDislivello((v) => !v)}>Dislivello</Pill>
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

      {errore && (
        <p className="rounded-app border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{errore}</p>
      )}

      <div className="rounded-app border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="editor-card-label !mb-0">Didascalia Instagram</p>
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(didascaliaSocial);
                toast('Didascalia copiata');
              } catch {
                toast('Copia manualmente il testo sotto');
              }
            }}
            className="tap font-mono text-[10px] font-bold uppercase text-brand"
          >
            Copia
          </button>
        </div>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-cemento/80">{didascaliaSocial}</p>
      </div>

      <div className="flex flex-col gap-2 border-t border-white/8 pt-4 sm:flex-row">
        <button type="button" onClick={() => void condividiCard()} disabled={generandoCard} className="tap btn-primary flex-1">
          {generandoCard ? 'Preparo…' : mobile ? 'Condividi story' : 'Condividi'}
        </button>
        <button type="button" onClick={() => void scaricaCard()} disabled={generandoCard} className="tap editor-card-btn-secondary flex-1">
          {mobile ? 'Salva in galleria' : 'Salva immagine'}
        </button>
      </div>

      {modalSalvaUrl && (
        <ModalSalvaImmagine url={modalSalvaUrl} onChiudi={() => setModalSalvaUrl(null)} />
      )}
    </div>
  );
}
