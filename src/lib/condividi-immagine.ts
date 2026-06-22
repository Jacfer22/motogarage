/** Formato verticale story / status (Instagram, TikTok, WhatsApp, ecc.) */
export const FORMATO_STORY = {
  larghezza: 1080,
  altezza: 1920,
  rapporto: '9:16' as const,
};

export function isDispositivoMobile(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent || '';
  if (/Android|iPhone|iPad|iPod|Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua)) return true;
  return navigator.maxTouchPoints > 0 && window.innerWidth < 900;
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const [header, data] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)?.[1] ?? 'image/png';
  const raw = atob(data);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

async function blobToJpeg(blob: Blob, quality = 0.92): Promise<Blob> {
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    throw new Error('Canvas non disponibile');
  }
  ctx.fillStyle = '#15181A';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Conversione JPEG fallita'))), 'image/jpeg', quality);
  });
}

export interface ImmagineStoryPronta {
  blob: Blob;
  file: File;
  anteprimaUrl: string;
  estensione: 'jpg' | 'png';
}

/** Prepara JPEG 9:16 per galleria e app social (migliore compatibilità mobile). */
export async function preparaImmagineStory(
  dataUrl: string,
  opzioni?: { jpeg?: boolean; nomeBase?: string },
): Promise<ImmagineStoryPronta> {
  const usaJpeg = opzioni?.jpeg !== false;
  const nomeBase = opzioni?.nomeBase ?? 'motogarage-story';
  const pngBlob = dataUrlToBlob(dataUrl);

  if (!usaJpeg) {
    const file = new File([pngBlob], `${nomeBase}.png`, {
      type: 'image/png',
      lastModified: Date.now(),
    });
    return { blob: pngBlob, file, anteprimaUrl: dataUrl, estensione: 'png' };
  }

  const jpegBlob = await blobToJpeg(pngBlob);
  const file = new File([jpegBlob], `${nomeBase}.jpg`, {
    type: 'image/jpeg',
    lastModified: Date.now(),
  });
  return {
    blob: jpegBlob,
    file,
    anteprimaUrl: URL.createObjectURL(jpegBlob),
    estensione: 'jpg',
  };
}

export function scaricaBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 8000);
}

export function puoCondividereFile(file: File): boolean {
  return typeof navigator !== 'undefined' && !!navigator.canShare?.({ files: [file] });
}

export type EsitoCondivisione = 'ok' | 'annullato' | 'non_supportato';

/** Condivide solo il file immagine — le app story/status lo riconoscono meglio senza testo allegato. */
export async function condividiImmagineSocial(file: File): Promise<EsitoCondivisione> {
  if (!puoCondividereFile(file)) return 'non_supportato';
  try {
    await navigator.share({ files: [file] });
    return 'ok';
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') return 'annullato';
    return 'non_supportato';
  }
}

/** Su mobile apre il foglio di sistema: Salva immagine / Foto / Galleria. */
export async function salvaInGalleria(file: File): Promise<EsitoCondivisione> {
  if (!puoCondividereFile(file)) return 'non_supportato';
  try {
    await navigator.share({ files: [file] });
    return 'ok';
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') return 'annullato';
    return 'non_supportato';
  }
}
