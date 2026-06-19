import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Vercel: max 60s hobby, 300s pro
export const maxDuration = 60;

const HF_TOKEN = process.env.HUGGINGFACE_TOKEN!;
const HF_SPACE = 'https://tencent-hunyuan3d-2.hf.space';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ─── POST: avvia generazione ──────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { motoId, fotoSxUrl, fotoDxUrl } = await req.json();
    if (!motoId || !fotoSxUrl) return NextResponse.json({ errore: 'motoId e fotoSxUrl richiesti' }, { status: 400 });

    // Aggiorna stato → elaborazione
    await supabaseAdmin.from('moto').update({ stato: 'elaborazione', task_id: null }).eq('id', motoId);

    // Scarica foto come base64 per inviarla all'API
    const imgRes = await fetch(fotoSxUrl);
    const imgBuf = await imgRes.arrayBuffer();
    const imgB64 = `data:image/jpeg;base64,${Buffer.from(imgBuf).toString('base64')}`;

    // Chiama Hunyuan3D Space via Gradio API (endpoint /run/predict)
    // Usa solo foto_sx per la generazione principale (HY3D funziona bene con 1 foto)
    const session = Math.random().toString(36).slice(2);
    
    const joinRes = await fetch(`${HF_SPACE}/queue/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${HF_TOKEN}`,
      },
      body: JSON.stringify({
        data: [imgB64, null, true, true, 1.0, 6, 0], // image, foreground_ratio, etc.
        fn_index: 0,
        session_hash: session,
      }),
    });

    if (!joinRes.ok) {
      const err = await joinRes.text();
      throw new Error(`HF Space error: ${err.slice(0, 200)}`);
    }

    const joinData = await joinRes.json();
    const eventId = joinData.event_id ?? session;

    // Salva task_id e session per il polling
    await supabaseAdmin.from('moto').update({
      task_id: JSON.stringify({ event_id: eventId, session_hash: session }),
      stato: 'elaborazione',
    }).eq('id', motoId);

    return NextResponse.json({ ok: true, task_id: eventId, session_hash: session });

  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ errore: msg }, { status: 500 });
  }
}

// ─── GET: controlla stato + scarica GLB quando pronto ────────────────────────
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const motoId = searchParams.get('motoId');
    if (!motoId) return NextResponse.json({ errore: 'motoId richiesto' }, { status: 400 });

    // Leggi task dalla tabella
    const { data: moto, error } = await supabaseAdmin
      .from('moto').select('id, stato, task_id, glb_url, errore').eq('id', motoId).single();
    if (error || !moto) return NextResponse.json({ errore: 'Moto non trovata' }, { status: 404 });

    // Se già pronta o errore, restituisci subito
    if (moto.stato === 'pronto') return NextResponse.json({ stato: 'pronto', glb_url: moto.glb_url });
    if (moto.stato === 'errore') return NextResponse.json({ stato: 'errore', errore: moto.errore });
    if (!moto.task_id) return NextResponse.json({ stato: moto.stato });

    const { session_hash } = JSON.parse(moto.task_id) as { event_id: string; session_hash: string };

    // Controlla coda HF Space (legge solo i primi eventi SSE)
    const statusRes = await fetch(`${HF_SPACE}/queue/data?session_hash=${session_hash}`, {
      headers: { 'Authorization': `Bearer ${HF_TOKEN}` },
      signal: AbortSignal.timeout(8000),
    });

    if (!statusRes.ok || !statusRes.body) {
      return NextResponse.json({ stato: 'elaborazione', percentuale: 30 });
    }

    const reader = statusRes.body.getReader();
    const decoder = new TextDecoder();
    let output: string | null = null;
    let percentuale = 20;

    // Legge fino a 5 eventi SSE
    for (let i = 0; i < 5; i++) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try {
          const ev = JSON.parse(line.slice(6));
          if (ev.msg === 'process_completed' && ev.output?.data?.[0]) {
            output = ev.output.data[0]; // URL del GLB
            percentuale = 100;
          } else if (ev.msg === 'estimation') {
            const pos = ev.queue_size ?? 0;
            percentuale = Math.max(5, Math.min(80, 80 - pos * 10));
          } else if (ev.msg === 'process_generating') {
            percentuale = 85;
          }
        } catch { /* skip malformed */ }
      }
      if (output) break;
    }
    reader.cancel();

    if (output) {
      // Scarica GLB e salvalo su Supabase Storage
      try {
        const glbRes = await fetch(output, { headers: { 'Authorization': `Bearer ${HF_TOKEN}` } });
        const glbBuf = await glbRes.arrayBuffer();
        const path = `${motoId}/modello.glb`;

        await supabaseAdmin.storage.from('modelli-3d').upload(path, Buffer.from(glbBuf), {
          contentType: 'model/gltf-binary',
          upsert: true,
        });

        const { data: urlData } = supabaseAdmin.storage.from('modelli-3d').getPublicUrl(path);
        const glbUrl = urlData.publicUrl;

        await supabaseAdmin.from('moto').update({ stato: 'pronto', glb_url: glbUrl }).eq('id', motoId);
        return NextResponse.json({ stato: 'pronto', glb_url: glbUrl });

      } catch (dlErr) {
        const msg = dlErr instanceof Error ? dlErr.message : String(dlErr);
        await supabaseAdmin.from('moto').update({ stato: 'errore', errore: `Download GLB fallito: ${msg}` }).eq('id', motoId);
        return NextResponse.json({ stato: 'errore', errore: msg });
      }
    }

    return NextResponse.json({ stato: 'elaborazione', percentuale });

  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ stato: 'elaborazione', percentuale: 20, debug: msg });
  }
}
