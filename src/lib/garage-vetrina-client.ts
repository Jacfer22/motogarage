import { getSupabaseBrowser } from '@/lib/supabase-browser';
import { preparaImmagineStory, scaricaBlob, salvaInGalleria } from '@/lib/condividi-immagine';

export async function catturaESalvaVetrina(
  canvas: HTMLCanvasElement,
  motoId: string,
): Promise<{ ok: boolean; messaggio?: string }> {
  const dataUrl = canvas.toDataURL('image/png');
  const immagine = await preparaImmagineStory(dataUrl, { nomeBase: 'motogarage-vetrina', jpeg: true });

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
