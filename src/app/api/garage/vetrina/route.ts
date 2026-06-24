import { NextRequest, NextResponse } from 'next/server';
import { rispostaErroreApi, verificaUtente } from '@/lib/garage-server-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { user, admin } = await verificaUtente(req);
    const form = await req.formData();
    const motoId = String(form.get('motoId') ?? '').trim();
    const immagine = form.get('immagine');

    if (!motoId) {
      return NextResponse.json({ errore: 'motoId richiesto.' }, { status: 400 });
    }
    if (!(immagine instanceof Blob) || immagine.size === 0) {
      return NextResponse.json({ errore: 'Immagine richiesta.' }, { status: 400 });
    }

    const { data: moto, error } = await admin
      .from('moto')
      .select('id, utente_id, vetrina_url')
      .eq('id', motoId)
      .single();

    if (error || !moto) {
      return NextResponse.json({ errore: 'Moto non trovata.' }, { status: 404 });
    }
    if (moto.utente_id !== user.id) {
      return NextResponse.json({ errore: 'Non autorizzato.' }, { status: 403 });
    }

    const path = `${user.id}/${motoId}/vetrina.jpg`;
    const { error: uploadError } = await admin.storage
      .from('foto-moto')
      .upload(path, immagine, { upsert: true, contentType: 'image/jpeg' });
    if (uploadError) {
      return NextResponse.json({ errore: uploadError.message }, { status: 500 });
    }

    if (moto.vetrina_url && moto.vetrina_url !== path) {
      await admin.storage.from('foto-moto').remove([moto.vetrina_url]);
    }

    const { error: updateError } = await admin
      .from('moto')
      .update({ vetrina_url: path })
      .eq('id', motoId);
    if (updateError) {
      return NextResponse.json({ errore: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, vetrina_url: path });
  } catch (error) {
    const { messaggio, status } = rispostaErroreApi(error);
    return NextResponse.json({ errore: messaggio }, { status });
  }
}
