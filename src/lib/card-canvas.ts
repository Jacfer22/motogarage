'use client';

import { Punto } from '@/lib/geo';

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
  // opzionali, in stile Strava
  fotoDataUrl?: string | null; // foto di sfondo scelta dall'utente
  dislivelloM?: number | null; // metri di dislivello positivo
  velMediaKmh?: number | null; // velocità media
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

  // Sfondo: foto scelta dall'utente (stile Strava) oppure gradiente paesaggio
  let conFoto = false;
  if (dati.fotoDataUrl) {
    try {
      const foto = await caricaImmagine(dati.fotoDataUrl);
      // copertura "cover": riempie tutta la card mantenendo le proporzioni
      const scala = Math.max(LARGHEZZA / foto.width, ALTEZZA / foto.height);
      const w = foto.width * scala;
      const h = foto.height * scala;
      ctx.drawImage(foto, (LARGHEZZA - w) / 2, (ALTEZZA - h) / 2, w, h);

      // velo scuro dall'alto per far risaltare tracciato e testo
      const velo = ctx.createLinearGradient(0, 0, 0, ALTEZZA);
      velo.addColorStop(0, 'rgba(14,16,18,0.55)');
      velo.addColorStop(0.4, 'rgba(14,16,18,0.15)');
      velo.addColorStop(0.72, 'rgba(14,16,18,0.35)');
      velo.addColorStop(1, 'rgba(14,16,18,0.85)');
      ctx.fillStyle = velo;
      ctx.fillRect(0, 0, LARGHEZZA, ALTEZZA);
      conFoto = true;
    } catch {
      conFoto = false;
    }
  }

  if (!conFoto) {
    const sfondo = ctx.createLinearGradient(0, 0, 0, ALTEZZA);
    sfondo.addColorStop(0, '#cfe3d6');
    sfondo.addColorStop(0.45, '#9fc1ad');
    sfondo.addColorStop(0.62, '#5b7a64');
    sfondo.addColorStop(0.62, ASFALTO);
    sfondo.addColorStop(1, ASFALTO);
    ctx.fillStyle = sfondo;
    ctx.fillRect(0, 0, LARGHEZZA, ALTEZZA);
  }

  // Tracciato: "firma" dorata. Con foto: compatto in alto a sinistra (stile Strava).
  if (dati.punti.length > 1) {
    const lats = dati.punti.map((p) => p.lat);
    const lngs = dati.punti.map((p) => p.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const spanLat = Math.max(maxLat - minLat, 0.0005);
    const spanLng = Math.max(maxLng - minLng, 0.0005);

    // area di disegno: con foto è un riquadro in alto a sinistra, senza è metà card
    const margine = 140;
    const areaX = conFoto ? 80 : margine;
    const areaY = conFoto ? 200 : margine;
    const areaW = conFoto ? LARGHEZZA * 0.5 : LARGHEZZA - margine * 2;
    const areaH = conFoto ? ALTEZZA * 0.32 : ALTEZZA * 0.5 - margine * 2;
    const scala = Math.min(areaW / spanLng, areaH / spanLat);

    const offsetX = areaX + (areaW - spanLng * scala) / 2;
    const offsetY = areaY + (areaH - spanLat * scala) / 2;

    const toXY = (p: Punto) => ({
      x: offsetX + (p.lng - minLng) * scala,
      y: offsetY + (maxLat - p.lat) * scala,
    });

    ctx.lineWidth = conFoto ? 12 : 14;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = SEGNALE;
    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    dati.punti.forEach((p, i) => {
      const { x, y } = toXY(p);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.shadowBlur = 0;

    [dati.punti[0], dati.punti[dati.punti.length - 1]].forEach((p) => {
      const { x, y } = toXY(p);
      ctx.fillStyle = conFoto ? CEMENTO : ASFALTO;
      ctx.beginPath();
      ctx.arc(x, y, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = SEGNALE;
      ctx.lineWidth = 5;
      ctx.stroke();
    });
  }

  // Statistiche stile Strava (etichetta piccola + numero grande), colonna destra,
  // solo quando c'è la foto di sfondo.
  if (conFoto) {
    const statX = LARGHEZZA - 80;
    let statY = 300;
    ctx.textAlign = 'right';
    const blocchi: Array<{ label: string; valore: string }> = [
      { label: 'DISTANZA', valore: `${dati.km} km` },
    ];
    if (dati.dislivelloM != null && dati.dislivelloM > 0) {
      blocchi.push({ label: 'DISLIVELLO', valore: `${dati.dislivelloM} m` });
    }
    blocchi.push({ label: 'DURATA', valore: dati.durata });
    if (dati.velMediaKmh != null && dati.velMediaKmh > 0) {
      blocchi.push({ label: 'MEDIA', valore: `${dati.velMediaKmh} km/h` });
    }
    for (const b of blocchi) {
      ctx.fillStyle = 'rgba(240,241,242,0.85)';
      ctx.font = `500 30px ${fontMono}`;
      ctx.fillText(b.label, statX, statY);
      ctx.fillStyle = CEMENTO;
      ctx.font = `700 76px ${fontDisplay}`;
      ctx.fillText(b.valore, statX, statY + 76);
      ctx.shadowColor = 'rgba(0,0,0,0.4)';
      statY += 170;
    }
    ctx.shadowBlur = 0;
    ctx.textAlign = 'left';
  }

  // Logo in alto a destra
  try {
    const logo = await caricaImmagine('/icon-bike.png');
    const dimLogo = 90;
    ctx.drawImage(logo, LARGHEZZA - dimLogo - 48, 48, dimLogo, dimLogo);
  } catch {
    // se il logo non carica, si procede senza
  }

  // Titolo (nome itinerario o "Giro libero") in basso a sinistra
  ctx.fillStyle = CEMENTO;
  ctx.textBaseline = 'alphabetic';
  ctx.shadowColor = conFoto ? 'rgba(0,0,0,0.5)' : 'transparent';
  ctx.shadowBlur = conFoto ? 10 : 0;
  ctx.font = `700 64px ${fontDisplay}`;
  scriviTestoMultilinea(ctx, dati.titolo.toUpperCase(), 64, ALTEZZA - 540, LARGHEZZA - 128, 70);

  // Riga statistiche/data in Caveat giallo. Con foto mostra solo la data
  // (le statistiche sono già nella colonna), senza foto mostra tutto.
  ctx.fillStyle = SEGNALE;
  ctx.font = `600 56px ${fontHand}`;
  const rigaSotto = conFoto ? dati.data : `${dati.km} km · ${dati.durata} · ${dati.data}`;
  ctx.fillText(rigaSotto, 64, ALTEZZA - 400);
  ctx.shadowBlur = 0;

  // Marchio
  ctx.fillStyle = SEGNALE;
  ctx.font = `600 80px ${fontHand}`;
  ctx.textAlign = 'right';
  ctx.fillText('GiroSecco', LARGHEZZA - 64, ALTEZZA - 64);
  ctx.textAlign = 'left';

  // Etichetta in mono, angolo basso sinistra
  ctx.fillStyle = 'rgba(240,241,242,0.6)';
  ctx.font = `500 32px ${fontMono}`;
  ctx.fillText('GIROSECCO.IT', 64, ALTEZZA - 64);

  return canvas.toDataURL('image/png');
}
