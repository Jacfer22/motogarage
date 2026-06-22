'use client';

import { Punto } from '@/lib/geo';
import { filtriFotoCanvas, type FiltroFoto } from '@/lib/card-foto-filtri';

const LARGHEZZA = 1080;
const ALTEZZA = 1920;

const ASFALTO = '#15181A';
const SEGNALE = '#F2B705';
const CEMENTO = '#F0F1F2';

/** Legge il nome reale del font generato da next/font da una variabile CSS. */
function leggiFont(variabile: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  const valore = getComputedStyle(document.documentElement).getPropertyValue(variabile).trim();
  return valore || fallback;
}

async function attendiFont(famiglia: string, peso: string) {
  try {
    await document.fonts.load(`${peso} 40px ${famiglia}`);
    await document.fonts.ready;
  } catch {
    // se il font non carica, si procede con il fallback del browser
  }
}

interface DatiCard {
  titolo: string; // es. "Giro libero" o nome itinerario
  km: string; // già formattato, es. "84,3"
  durata: string; // già formattato, es. "2:14"
  data: string; // es. "13 giugno 2026"
  punti: Punto[];
  // tema della card
  tema?: 'tracciato' | 'foto';
  // 'scuro' (default, sfondo nero testo bianco) o 'chiaro' (sfondo bianco testo nero)
  palette?: 'scuro' | 'chiaro';
  luogo?: string | null;
  // statistiche opzionali
  fotoDataUrl?: string | null;
  dislivelloM?: number | null;
  velMediaKmh?: number | null;
  velMaxKmh?: number | null;
  curve?: number | null;
  // posizione del tracciato 3D nella card (0.0-1.0)
  tracciatoOffsetX?: number; // spostamento orizzontale relativo
  tracciatoOffsetY?: number; // spostamento verticale relativo
  /** Zoom foto di sfondo: 1 = cover, >1 ingrandisce, <1 rimpicciolisce */
  fotoScala?: number;
  /** Luminosità foto di sfondo: 1 = normale */
  fotoLuminosita?: number;
  /** Centro foto 0–1 (0.5 = centrata) */
  fotoOffsetX?: number;
  fotoOffsetY?: number;
  /** Contrasto foto: 1 = normale */
  fotoContrasto?: number;
  /** Saturazione foto: 1 = normale */
  fotoSaturazione?: number;
  /** Filtro colore rapido */
  filtroFoto?: FiltroFoto;
  /** Tracciato GPS sopra la foto (default off: foto pulita) */
  mostraTracciatoSuFoto?: boolean;
  /** Mostra data del giro (default on) */
  mostraData?: boolean;
}

function caricaImmagine(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function scriviTestoMultilinea(
  ctx: CanvasRenderingContext2D,
  testo: string,
  x: number,
  y: number,
  larghezzaMax: number,
  interlinea: number
) {
  const parole = testo.split(' ');
  let riga = '';
  let righe: string[] = [];
  for (const parola of parole) {
    const prova = riga ? `${riga} ${parola}` : parola;
    if (ctx.measureText(prova).width > larghezzaMax && riga) {
      righe.push(riga);
      riga = parola;
    } else {
      riga = prova;
    }
  }
  if (riga) righe.push(riga);
  righe = righe.slice(0, 3);
  righe.forEach((r, i) => ctx.fillText(r, x, y + i * interlinea));
}

/** Genera la card come PNG (data URL) pronta da scaricare o condividere. */
interface AreaTracciato {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Tracciato GPS piatto 2D — tutto il percorso visibile nell'area (contain). */
function disegnaTracciato2D(
  ctx: CanvasRenderingContext2D,
  punti: Punto[],
  area: AreaTracciato,
  opt: { segnale: string; cemento: string; spessore?: number },
) {
  if (punti.length < 2) return;

  const lats = punti.map((p) => p.lat);
  const lngs = punti.map((p) => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const spanLat = Math.max(maxLat - minLat, 0.0005);
  const spanLng = Math.max(maxLng - minLng, 0.0005);

  const pad = 0.08;
  const innerW = area.w * (1 - 2 * pad);
  const innerH = area.h * (1 - 2 * pad);
  const scale = Math.min(innerW / spanLng, innerH / spanLat);

  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;
  const cx = area.x + area.w / 2;
  const cy = area.y + area.h / 2;

  const proietta = (p: Punto) => ({
    x: cx + (p.lng - centerLng) * scale,
    y: cy + (centerLat - p.lat) * scale,
  });

  const pts = punti.map(proietta);
  const spessore = opt.spessore ?? 10;

  const traccia = () => {
    ctx.beginPath();
    pts.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
  };

  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.lineWidth = spessore + 8;
  traccia();
  ctx.stroke();

  ctx.strokeStyle = opt.segnale;
  ctx.lineWidth = spessore;
  ctx.shadowColor = 'rgba(0,0,0,0.35)';
  ctx.shadowBlur = 14;
  traccia();
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = Math.max(2, spessore * 0.25);
  traccia();
  ctx.stroke();

  const start = pts[0];
  const end = pts[pts.length - 1];

  ctx.fillStyle = '#22c55e';
  ctx.beginPath();
  ctx.arc(start.x, start.y, spessore * 0.55, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = opt.cemento;
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = opt.segnale;
  ctx.beginPath();
  ctx.arc(end.x, end.y, spessore * 0.55, 0, Math.PI * 2);
  ctx.fill();
}

async function disegnaLogoAltoSinistra(
  ctx: CanvasRenderingContext2D,
  fontDisplay: string,
  testoColor: string,
  conFoto: boolean,
) {
  const x = 56;
  const y = 52;
  const logoH = 46;
  ctx.save();
  if (conFoto) {
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 14;
  }
  try {
    const logo = await caricaImmagine('/logo-motogarage.png');
    const logoW = (logo.width / logo.height) * logoH;
    ctx.drawImage(logo, x, y, logoW, logoH);
    ctx.font = `700 34px ${fontDisplay}`;
    ctx.fillStyle = testoColor;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('MOTO GARAGE', x + logoW + 12, y + logoH - 6);
  } catch {
    ctx.font = `700 38px ${fontDisplay}`;
    ctx.fillStyle = testoColor;
    ctx.textAlign = 'left';
    ctx.fillText('MOTO GARAGE', x, y + logoH);
  }
  ctx.restore();
}

function areaTracciatoConOffset(
  base: AreaTracciato,
  offsetX: number | undefined,
  offsetY: number | undefined,
  panX: number,
  panY: number,
): AreaTracciato {
  const ox = ((offsetX ?? 0.5) - 0.5) * panX;
  const oy = ((offsetY ?? 0.5) - 0.5) * panY;
  return { x: base.x + ox, y: base.y + oy, w: base.w, h: base.h };
}

function filtriFotoCss(
  luminosita: number,
  contrasto: number,
  saturazione: number,
  filtro: FiltroFoto,
): string {
  return filtriFotoCanvas(luminosita, contrasto, saturazione, filtro);
}

/** Striscia scura in basso per testi leggibili sulla foto */
function disegnaPannelloBasso(ctx: CanvasRenderingContext2D, altezza: number) {
  const y = ALTEZZA - altezza;
  const grad = ctx.createLinearGradient(0, y - 120, 0, ALTEZZA);
  grad.addColorStop(0, 'rgba(8,9,11,0)');
  grad.addColorStop(0.35, 'rgba(8,9,11,0.72)');
  grad.addColorStop(1, 'rgba(8,9,11,0.94)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, y - 120, LARGHEZZA, altezza + 120);
}

/** Badge data in alto a destra — sempre leggibile */
function disegnaBadgeData(
  ctx: CanvasRenderingContext2D,
  data: string,
  fontHand: string,
  fontMono: string,
  segnale: string,
) {
  ctx.save();
  ctx.font = `600 38px ${fontHand}`;
  const testoW = ctx.measureText(data).width;
  const padX = 28;
  const padY = 18;
  const badgeW = testoW + padX * 2;
  const badgeH = 56;
  const x = LARGHEZZA - 56 - badgeW;
  const y = 44;

  ctx.fillStyle = 'rgba(8,9,11,0.82)';
  ctx.strokeStyle = 'rgba(242,183,5,0.45)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y, badgeW, badgeH, 14);
  ctx.fill();
  ctx.stroke();

  ctx.font = `700 20px ${fontMono}`;
  ctx.fillStyle = 'rgba(242,183,5,0.85)';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('GIRO DEL', x + padX, y + badgeH * 0.38);

  ctx.font = `600 34px ${fontHand}`;
  ctx.fillStyle = segnale;
  ctx.fillText(data, x + padX, y + badgeH * 0.72);
  ctx.restore();
}

function disegnaTracciatoMini(
  ctx: CanvasRenderingContext2D,
  punti: Punto[],
  area: AreaTracciato,
  opt: { segnale: string; cemento: string },
) {
  ctx.save();
  ctx.globalAlpha = 0.92;
  disegnaTracciato2D(ctx, punti, area, { ...opt, spessore: 5 });
  ctx.restore();
}

export async function generaCardGiro(dati: DatiCard): Promise<string> {
  const fontDisplay = leggiFont('--font-display', 'Arial');
  const fontHand = leggiFont('--font-hand', 'cursive');
  const fontMono = leggiFont('--font-mono', 'monospace');

  await Promise.all([
    attendiFont(fontDisplay, '700'),
    attendiFont(fontHand, '600'),
    attendiFont(fontMono, '500'),
  ]);

  const canvas = document.createElement('canvas');
  canvas.width = LARGHEZZA;
  canvas.height = ALTEZZA;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas non disponibile');

  const tema = dati.tema ?? 'tracciato';
  const palette = dati.palette ?? 'scuro';
  const paletteChiara = palette === 'chiaro';

  // Colori in base alla palette (senza foto)
  let SFONDO_CARD = paletteChiara ? '#f0f1f2' : ASFALTO;
  let TESTO_PRIMARIO = paletteChiara ? ASFALTO : CEMENTO;
  let TESTO_SECONDARIO = paletteChiara ? 'rgba(21,24,26,0.55)' : 'rgba(240,241,242,0.6)';
  let SEGNALE_CARD = paletteChiara ? '#c49200' : SEGNALE;
  const TRACCIATO_COLORE = SEGNALE;

  // Sfondo: foto (se presente, su entrambi i temi) oppure gradiente
  let conFoto = false;
  if (dati.fotoDataUrl) {
    try {
      const foto = await caricaImmagine(dati.fotoDataUrl);
      const zoom = Math.min(2, Math.max(0.6, dati.fotoScala ?? 1));
      const luminosita = Math.min(1.5, Math.max(0.5, dati.fotoLuminosita ?? 1));
      const contrasto = Math.min(1.4, Math.max(0.75, dati.fotoContrasto ?? 1));
      const saturazione = Math.min(1.5, Math.max(0.5, dati.fotoSaturazione ?? 1));
      const offsetX = (dati.fotoOffsetX ?? 0.5) - 0.5;
      const offsetY = (dati.fotoOffsetY ?? 0.5) - 0.5;
      const scalaBase = Math.max(LARGHEZZA / foto.width, ALTEZZA / foto.height);
      const w = foto.width * scalaBase * zoom;
      const h = foto.height * scalaBase * zoom;
      const panX = offsetX * LARGHEZZA * 0.8;
      const panY = offsetY * ALTEZZA * 0.8;

      ctx.save();
      ctx.filter = filtriFotoCss(luminosita, contrasto, saturazione, dati.filtroFoto ?? 'none');
      ctx.drawImage(foto, (LARGHEZZA - w) / 2 + panX, (ALTEZZA - h) / 2 + panY, w, h);
      ctx.restore();

      const velo = ctx.createLinearGradient(0, 0, 0, ALTEZZA);
      velo.addColorStop(0, 'rgba(8,9,11,0.62)');
      velo.addColorStop(0.18, 'rgba(8,9,11,0.12)');
      velo.addColorStop(0.55, 'rgba(8,9,11,0.08)');
      velo.addColorStop(0.78, 'rgba(8,9,11,0.55)');
      velo.addColorStop(1, 'rgba(8,9,11,0.92)');
      ctx.fillStyle = velo;
      ctx.fillRect(0, 0, LARGHEZZA, ALTEZZA);
      conFoto = true;
      // Sulla foto: testo chiaro sempre, indipendentemente dalla palette
      TESTO_PRIMARIO = CEMENTO;
      TESTO_SECONDARIO = 'rgba(240,241,242,0.78)';
      SEGNALE_CARD = SEGNALE;
    } catch {
      conFoto = false;
    }
  }

  if (!conFoto) {
    if (paletteChiara) {
      ctx.fillStyle = '#f0f1f2';
    } else if (tema === 'foto') {
      const sfondo = ctx.createLinearGradient(0, 0, 0, ALTEZZA);
      sfondo.addColorStop(0, '#cfe3d6');
      sfondo.addColorStop(0.45, '#9fc1ad');
      sfondo.addColorStop(0.62, '#5b7a64');
      sfondo.addColorStop(0.62, ASFALTO);
      sfondo.addColorStop(1, ASFALTO);
      ctx.fillStyle = sfondo;
    } else {
      ctx.fillStyle = ASFALTO;
    }
    ctx.fillRect(0, 0, LARGHEZZA, ALTEZZA);
  }

  ctx.textBaseline = 'alphabetic';

  await disegnaLogoAltoSinistra(ctx, fontDisplay, TESTO_PRIMARIO, conFoto);

  const mostraData = dati.mostraData !== false;
  if (mostraData) {
    disegnaBadgeData(ctx, dati.data, fontHand, fontMono, SEGNALE_CARD);
  }

  const tracciatoOpt = { segnale: TRACCIATO_COLORE, cemento: TESTO_PRIMARIO };
  const tracciaSuFoto = conFoto && (dati.mostraTracciatoSuFoto ?? false);
  const tracciaGrande = !conFoto || tracciaSuFoto;

  if (conFoto) {
    disegnaPannelloBasso(ctx, tema === 'foto' ? 520 : 480);
  }

  // Tracciato mini in angolo — solo se richiesto esplicitamente sulla foto
  if (tracciaSuFoto && dati.punti.length > 1) {
    disegnaTracciatoMini(
      ctx,
      dati.punti,
      areaTracciatoConOffset(
        { x: 48, y: ALTEZZA - 620, w: 220, h: 180 },
        dati.tracciatoOffsetX,
        dati.tracciatoOffsetY,
        80,
        60,
      ),
      tracciatoOpt,
    );
  }

  // ===== TEMA "FOTO" (laterale): stats a destra =====
  if (tema === 'foto') {
    if (tracciaGrande && !conFoto && dati.punti.length > 1) {
      const areaBase: AreaTracciato = { x: 48, y: 180, w: LARGHEZZA * 0.58, h: ALTEZZA * 0.42 };
      disegnaTracciato2D(
        ctx,
        dati.punti,
        areaTracciatoConOffset(areaBase, dati.tracciatoOffsetX, dati.tracciatoOffsetY, LARGHEZZA * 0.38, ALTEZZA * 0.28),
        { ...tracciatoOpt, spessore: 9 },
      );
    }

    const statX = LARGHEZZA - 56;
    let statY = conFoto ? ALTEZZA - 480 : 220;
    ctx.textAlign = 'right';
    const blocchi: Array<{ label: string; valore: string }> = [
      { label: 'DISTANZA', valore: `${dati.km} km` },
      { label: 'DURATA', valore: dati.durata },
    ];
    if (dati.velMediaKmh != null && dati.velMediaKmh > 0)
      blocchi.push({ label: 'MEDIA', valore: `${dati.velMediaKmh} km/h` });
    if (dati.velMaxKmh != null && dati.velMaxKmh > 0)
      blocchi.push({ label: 'MAX', valore: `${dati.velMaxKmh} km/h` });
    if (dati.dislivelloM != null && dati.dislivelloM > 0)
      blocchi.push({ label: 'DISLIVELLO', valore: `+${dati.dislivelloM} m` });
    if (dati.curve != null && dati.curve > 0)
      blocchi.push({ label: 'CURVE', valore: `${dati.curve}` });
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    for (const b of blocchi) {
      ctx.shadowBlur = conFoto ? 12 : 0;
      ctx.fillStyle = TESTO_SECONDARIO;
      ctx.font = `500 24px ${fontMono}`;
      ctx.fillText(b.label, statX, statY);
      ctx.fillStyle = TESTO_PRIMARIO;
      ctx.font = `700 ${conFoto ? 56 : 64}px ${fontDisplay}`;
      ctx.fillText(b.valore, statX, statY + (conFoto ? 58 : 64));
      statY += conFoto ? 118 : 138;
    }
    ctx.shadowBlur = 0;
    ctx.textAlign = 'left';

    ctx.fillStyle = TESTO_PRIMARIO;
    ctx.shadowColor = conFoto ? 'rgba(0,0,0,0.65)' : 'transparent';
    ctx.shadowBlur = conFoto ? 14 : 0;
    ctx.font = `700 ${conFoto ? 52 : 56}px ${fontDisplay}`;
    const luogo = (dati.luogo || dati.titolo).toUpperCase();
    scriviTestoMultilinea(ctx, luogo, 56, conFoto ? ALTEZZA - 130 : ALTEZZA - 180, LARGHEZZA * 0.62, conFoto ? 58 : 62);
    ctx.shadowBlur = 0;
  } else {
    // ===== TEMA "TRACCIATO" (in basso): tracciato grande solo senza foto =====
    const statsH = conFoto ? 420 : 460;
    const areaBase: AreaTracciato = {
      x: 56,
      y: 130,
      w: LARGHEZZA - 112,
      h: ALTEZZA - statsH - 150,
    };
    if (tracciaGrande && !conFoto && dati.punti.length > 1) {
      disegnaTracciato2D(
        ctx,
        dati.punti,
        areaTracciatoConOffset(areaBase, dati.tracciatoOffsetX, dati.tracciatoOffsetY, LARGHEZZA * 0.42, areaBase.h * 0.35),
        { ...tracciatoOpt, spessore: 11 },
      );
    }

    ctx.fillStyle = TESTO_PRIMARIO;
    ctx.shadowColor = conFoto ? 'rgba(0,0,0,0.65)' : 'transparent';
    ctx.shadowBlur = conFoto ? 14 : 0;
    ctx.font = `700 ${conFoto ? 54 : 58}px ${fontDisplay}`;
    const luogo = (dati.luogo || dati.titolo).toUpperCase();
    scriviTestoMultilinea(ctx, luogo, 56, ALTEZZA - statsH + (conFoto ? 8 : 20), LARGHEZZA - 112, conFoto ? 60 : 64);
    ctx.shadowBlur = 0;

    const linaY = ALTEZZA - statsH + (conFoto ? 88 : 100);
    ctx.strokeStyle = paletteChiara ? 'rgba(21,24,26,0.15)' : 'rgba(240,241,242,0.22)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(56, linaY);
    ctx.lineTo(LARGHEZZA - 56, linaY);
    ctx.stroke();

    const disegnaStat = (
      label: string,
      valore: string,
      x: number,
      y: number,
      grande: boolean,
      giallo: boolean,
    ) => {
      if (conFoto) {
        ctx.shadowColor = 'rgba(0,0,0,0.6)';
        ctx.shadowBlur = 10;
      }
      ctx.fillStyle = TESTO_SECONDARIO;
      ctx.font = `500 24px ${fontMono}`;
      ctx.fillText(label, x, y);
      ctx.fillStyle = giallo ? SEGNALE_CARD : TESTO_PRIMARIO;
      ctx.font = `700 ${grande ? (conFoto ? 62 : 68) : conFoto ? 44 : 48}px ${fontDisplay}`;
      ctx.fillText(valore, x, y + (grande ? (conFoto ? 62 : 68) : conFoto ? 44 : 50));
      ctx.shadowBlur = 0;
    };

    disegnaStat('DISTANZA', `${dati.km} km`, 56, linaY + 44, true, false);
    disegnaStat('DURATA', dati.durata, LARGHEZZA / 2 + 16, linaY + 44, true, false);

    const rigaBassa: Array<{ label: string; valore: string; giallo: boolean }> = [];
    if (dati.velMediaKmh != null && dati.velMediaKmh > 0)
      rigaBassa.push({ label: 'MEDIA', valore: `${dati.velMediaKmh} km/h`, giallo: false });
    if (dati.velMaxKmh != null && dati.velMaxKmh > 0)
      rigaBassa.push({ label: 'MAX', valore: `${dati.velMaxKmh} km/h`, giallo: false });
    if (dati.curve != null && dati.curve > 0)
      rigaBassa.push({ label: 'CURVE', valore: `${dati.curve}`, giallo: true });
    if (dati.dislivelloM != null && dati.dislivelloM > 0)
      rigaBassa.push({ label: 'DISLIVELLO', valore: `+${dati.dislivelloM} m`, giallo: true });

    const yBassa = linaY + (conFoto ? 168 : 190);
    const larghColonna = (LARGHEZZA - 112) / Math.max(rigaBassa.length, 1);
    rigaBassa.forEach((s, i) => {
      disegnaStat(s.label, s.valore, 56 + i * larghColonna, yBassa, false, s.giallo);
    });
  }

  // Marchio discreto in basso a destra
  const margine = 64;
  const baseY = ALTEZZA - 64;
  const testoMarchio = 'MOTO GARAGE';
  ctx.font = `700 44px ${fontDisplay}`;
  const testoW = ctx.measureText(testoMarchio).width;
  const logoH = 56;
  const gap = 16;
  ctx.shadowColor = conFoto ? 'rgba(0,0,0,0.5)' : 'transparent';
  ctx.shadowBlur = conFoto ? 8 : 0;
  try {
    const logo = await caricaImmagine('/logo-motogarage.png');
    const logoW = (logo.width / logo.height) * logoH;
    const startX = LARGHEZZA - margine - logoW - gap - testoW;
    ctx.drawImage(logo, startX, baseY - logoH, logoW, logoH);
    ctx.textAlign = 'left';
    ctx.fillStyle = TESTO_PRIMARIO;
    ctx.fillText(testoMarchio, startX + logoW + gap, baseY - 10);
  } catch {
    ctx.textAlign = 'right';
    ctx.fillStyle = TESTO_PRIMARIO;
    ctx.fillText(testoMarchio, LARGHEZZA - margine, baseY);
  }
  ctx.shadowBlur = 0;
  ctx.textAlign = 'left';

  return canvas.toDataURL('image/png');
}
