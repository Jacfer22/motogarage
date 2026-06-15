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
  curve?: number | null; // numero di curve del percorso
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
// Smussa una serie di valori (media mobile) per togliere il rumore GPS
// dall'altitudine, così il rilievo 3D non sembra una sega.
function smussa(valori: number[], finestra = 2): number[] {
  if (valori.length === 0) return valori;
  return valori.map((_, i) => {
    let somma = 0;
    let n = 0;
    for (let j = i - finestra; j <= i + finestra; j++) {
      if (j >= 0 && j < valori.length) {
        somma += valori[j];
        n++;
      }
    }
    return somma / n;
  });
}

interface AreaTracciato {
  x: number;
  y: number;
  w: number;
  h: number;
}

// Disegna il tracciato in leggera prospettiva 3D: i punti sono proiettati su un
// piano inclinato (effetto vista a volo d'uccello) e sollevati in base
// all'altitudine, così salite e discese si "vedono". Effetto sobrio.
function disegnaTracciato3D(
  ctx: CanvasRenderingContext2D,
  punti: Punto[],
  area: AreaTracciato,
  opt: { conFoto: boolean; segnale: string; cemento: string }
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

  // altitudini: se assenti restano a 0 (tracciato piatto ma comunque in prospettiva)
  const alts = punti.map((p) => (typeof p.alt === 'number' ? p.alt : 0));
  const altSmussate = smussa(alts, 2);
  const minAlt = Math.min(...altSmussate);
  const maxAlt = Math.max(...altSmussate);
  const spanAlt = Math.max(maxAlt - minAlt, 1);

  // inclinazione sobria: il piano è schiacciato in verticale (tilt) e
  // l'altitudine solleva i punti di una quota contenuta
  const tilt = 0.55; // 1 = vista dall'alto piatta, <1 = inclinata (sobria)
  const altezzaMax = area.h * 0.22; // quanto può sollevarsi al massimo un punto

  const scalaX = area.w / spanLng;
  const scalaY = (area.h * tilt) / spanLat;

  const proietta = (p: Punto, alt: number) => {
    const baseX = area.x + (p.lng - minLng) * scalaX;
    const baseY = area.y + (maxLat - p.lat) * scalaY;
    const sollevamento = ((alt - minAlt) / spanAlt) * altezzaMax;
    return { x: baseX, y: baseY - sollevamento, base: baseY };
  };

  const proiettati = punti.map((p, i) => proietta(p, altSmussate[i]));

  // ombra del percorso sul "terreno" (le basi senza sollevamento), molto tenue
  ctx.strokeStyle = 'rgba(0,0,0,0.18)';
  ctx.lineWidth = opt.conFoto ? 7 : 9;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  proiettati.forEach((p, i) => {
    if (i === 0) ctx.moveTo(p.x, p.base);
    else ctx.lineTo(p.x, p.base);
  });
  ctx.stroke();

  // linea del percorso sollevata
  ctx.strokeStyle = opt.segnale;
  ctx.lineWidth = opt.conFoto ? 8 : 11;
  ctx.shadowColor = 'rgba(0,0,0,0.3)';
  ctx.shadowBlur = 10;
  ctx.beginPath();
  proiettati.forEach((p, i) => {
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  });
  ctx.stroke();
  ctx.shadowBlur = 0;

  // sottile lumeggiatura bianca sopra la linea (dà volume)
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = opt.conFoto ? 2 : 3;
  ctx.beginPath();
  proiettati.forEach((p, i) => {
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  });
  ctx.stroke();

  // punto di partenza (anello) e arrivo (pieno)
  const start = proiettati[0];
  const end = proiettati[proiettati.length - 1];
  ctx.fillStyle = opt.conFoto ? opt.cemento : '#0E1012';
  ctx.beginPath();
  ctx.arc(start.x, start.y, opt.conFoto ? 6 : 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = opt.segnale;
  ctx.lineWidth = opt.conFoto ? 2.5 : 4;
  ctx.stroke();

  ctx.fillStyle = opt.segnale;
  ctx.beginPath();
  ctx.arc(end.x, end.y, opt.conFoto ? 6 : 9, 0, Math.PI * 2);
  ctx.fill();
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

  // Tracciato in leggera prospettiva 3D che mostra i dislivelli.
  // Con foto: compatto in alto a sinistra. Senza: grande e protagonista.
  if (dati.punti.length > 1) {
    const area: AreaTracciato = conFoto
      ? { x: 70, y: 150, w: LARGHEZZA * 0.46, h: ALTEZZA * 0.2 }
      : { x: 110, y: 180, w: LARGHEZZA - 220, h: ALTEZZA * 0.34 };
    disegnaTracciato3D(ctx, dati.punti, area, {
      conFoto,
      segnale: SEGNALE,
      cemento: CEMENTO,
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
  ctx.shadowBlur = 0;

  if (conFoto) {
    // Con foto: in basso solo la data (le stats sono nella colonna a destra)
    ctx.fillStyle = SEGNALE;
    ctx.font = `600 56px ${fontHand}`;
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 10;
    ctx.fillText(dati.data, 64, ALTEZZA - 400);
    ctx.shadowBlur = 0;
  } else {
    // Senza foto (default A): griglia completa di statistiche
    const linaY = ALTEZZA - 470;
    ctx.strokeStyle = 'rgba(240,241,242,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(64, linaY);
    ctx.lineTo(LARGHEZZA - 64, linaY);
    ctx.stroke();

    const statDistanza = { label: 'DISTANZA', valore: `${dati.km} km`, giallo: false };
    const statDurata = { label: 'DURATA', valore: dati.durata, giallo: false };
    const rigaAlta = [statDistanza, statDurata];
    const rigaBassa: Array<{ label: string; valore: string; giallo: boolean }> = [];
    if (dati.curve != null && dati.curve > 0)
      rigaBassa.push({ label: 'CURVE', valore: `${dati.curve}`, giallo: true });
    if (dati.dislivelloM != null && dati.dislivelloM > 0)
      rigaBassa.push({ label: 'DISLIVELLO', valore: `+${dati.dislivelloM} m`, giallo: true });
    if (dati.velMediaKmh != null && dati.velMediaKmh > 0)
      rigaBassa.push({ label: 'MEDIA', valore: `${dati.velMediaKmh} km/h`, giallo: false });

    // riga alta (2 colonne grandi)
    const disegnaStat = (
      label: string,
      valore: string,
      x: number,
      y: number,
      grande: boolean,
      giallo: boolean
    ) => {
      ctx.fillStyle = 'rgba(240,241,242,0.55)';
      ctx.font = `500 28px ${fontMono}`;
      ctx.fillText(label, x, y);
      ctx.fillStyle = giallo ? SEGNALE : CEMENTO;
      ctx.font = `700 ${grande ? 72 : 52}px ${fontDisplay}`;
      ctx.fillText(valore, x, y + (grande ? 72 : 56));
    };

    disegnaStat(statDistanza.label, statDistanza.valore, 64, linaY + 50, true, false);
    disegnaStat(statDurata.label, statDurata.valore, LARGHEZZA / 2 + 20, linaY + 50, true, false);

    const yBassa = linaY + 200;
    const larghColonna = (LARGHEZZA - 128) / Math.max(rigaBassa.length, 1);
    rigaBassa.forEach((s, i) => {
      disegnaStat(s.label, s.valore, 64 + i * larghColonna, yBassa, false, s.giallo);
    });

    // data, in basso in corsivo giallo
    ctx.fillStyle = SEGNALE;
    ctx.font = `600 48px ${fontHand}`;
    ctx.fillText(dati.data, 64, ALTEZZA - 150);
  }

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
