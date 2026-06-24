import { getSupabaseBrowser } from '@/lib/supabase-browser';
import { preparaImmagineStory, scaricaBlob, salvaInGalleria } from '@/lib/condividi-immagine';

/** Composita il frame WebGL su sfondo bianco (evita canvas nero / alpha). */
export function canvasVetrinaSuBianco(canvas: HTMLCanvasElement): string {
  const out = document.createElement('canvas');
  out.width = canvas.width;
  out.height = canvas.height;
  const ctx = out.getContext('2d');
  if (!ctx) throw new Error('Canvas non disponibile');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.drawImage(canvas, 0, 0);
  return out.toDataURL('image/png');
}

export async function catturaESalvaVetrina(
  canvas: HTMLCanvasElement,
  motoId: string,
): Promise<{ ok: boolean; messaggio?: string }> {
  const dataUrl = canvasVetrinaSuBianco(canvas);
  const immagine = await preparaImmagineStory(dataUrl, {
    nomeBase: 'motogarage-vetrina',
    jpeg: true,
    sfondo: '#ffffff',
  });

  const esitoGalleria = await salvaInGalleria(immagine.file);
  if (esitoGalleria === 'non_supportato') {
    scaricaBlob(immagine.blob, immagine.file.name);
  }

  const supabase = getSupabaseBrowser();
  if (!supabase) {
    URL.revokeObjectURL(immagine.anteprimaUrl);
    return { ok: false, messaggio: 'Sessione non disponibile.' };
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    URL.revokeObjectURL(immagine.anteprimaUrl);
    return { ok: false, messaggio: 'Accedi di nuovo.' };
  }

  const form = new FormData();
  form.append('motoId', motoId);
  form.append('immagine', immagine.file);

  try {
    const risposta = await fetch('/api/garage/vetrina', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}` },
      body: form,
    });
    const json = await risposta.json() as { errore?: string };
    if (!risposta.ok) {
      return { ok: false, messaggio: json.errore ?? 'Salvataggio vetrina fallito.' };
    }
    return { ok: true };
  } finally {
    URL.revokeObjectURL(immagine.anteprimaUrl);
  }
}
