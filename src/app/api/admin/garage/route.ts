import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

function adminClient() {
  if (!url || !serviceRole) throw new Error('Supabase server non configurato.');
  return createClient(url, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function verificaAdmin(req: NextRequest): Promise<{ user: User; admin: SupabaseClient }> {
  if (!url || !anon) throw new Error('Supabase non configurato.');
  const authorization = req.headers.get('authorization');
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : null;
  if (!token) throw new Error('Autenticazione richiesta.');
  const authClient = createClient(url, anon, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await authClient.auth.getUser(token);
  if (error || !data.user) throw new Error('Sessione non valida.');
  const admin = adminClient();
  const { data: profilo } = await admin.from('profiles').select('is_admin').eq('id', data.user.id).single();
  if (!profilo?.is_admin) throw new Error('Accesso admin richiesto.');
  return { user: data.user, admin };
}

function rispostaErrore(error: unknown) {
  const messaggio = error instanceof Error ? error.message : 'Errore imprevisto.';
  const status = /autenticazione|sessione/i.test(messaggio) ? 401 : /admin/i.test(messaggio) ? 403 : 500;
  return NextResponse.json({ errore: messaggio }, { status });
}

export async function GET(req: NextRequest) {
  try {
    const { admin } = await verificaAdmin(req);
    const { data, error } = await admin
      .from('moto')
      .select('id, utente_id, marca, modello, anno, stato, foto_sx_url, foto_dx_url, model_format, model_url, glb_url, created_at, proprietario:profiles(username)')
      .in('stato', ['in_attesa', 'elaborazione', 'errore'])
      .order('created_at', { ascending: true });
    if (error) throw new Error(error.message);

    const richieste = await Promise.all((data ?? []).map(async (moto) => {
      const [principale, secondaria] = await Promise.all([
        moto.foto_sx_url
          ? admin.storage.from('foto-moto').createSignedUrl(moto.foto_sx_url, 3600)
          : Promise.resolve({ data: null }),
        moto.foto_dx_url
          ? admin.storage.from('foto-moto').createSignedUrl(moto.foto_dx_url, 3600)
          : Promise.resolve({ data: null }),
      ]);
      return {
        ...moto,
        foto_principale_url: principale.data?.signedUrl ?? null,
        foto_secondaria_url: secondaria.data?.signedUrl ?? null,
      };
    }));

    return NextResponse.json({ richieste });
  } catch (error) {
    return rispostaErrore(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { admin } = await verificaAdmin(req);
    const form = await req.formData();
    const motoId = String(form.get('motoId') ?? '').trim();
    const file = form.get('file');
    if (!motoId || !(file instanceof File)) {
      return NextResponse.json({ errore: 'motoId e file richiesti.' }, { status: 400 });
    }
    if (file.size > 250 * 1024 * 1024) {
      return NextResponse.json({ errore: 'Il modello supera il limite di 250 MB.' }, { status: 400 });
    }

    const nome = file.name.toLowerCase();
    const formato = nome.endsWith('.ply') ? 'ply' : nome.endsWith('.splat') ? 'splat' : nome.endsWith('.ksplat') ? 'ksplat' : nome.endsWith('.glb') ? 'glb' : null;
    if (!formato) {
      return NextResponse.json({ errore: 'Formato non supportato. Usa PLY, SPLAT, KSPLAT o GLB.' }, { status: 400 });
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    if (formato === 'ply') {
      const header = new TextDecoder('ascii').decode(bytes.slice(0, Math.min(bytes.length, 8192)));
      const splatValido = header.startsWith('ply')
        && header.includes('end_header')
        && header.includes('property float opacity')
        && header.includes('property float scale_0')
        && header.includes('property float rot_0');
      if (!splatValido) {
        return NextResponse.json({ errore: 'Il PLY non sembra un Gaussian Splat compatibile.' }, { status: 400 });
      }
    }

    const { data: moto } = await admin.from('moto').select('id').eq('id', motoId).single();
    if (!moto) return NextResponse.json({ errore: 'Richiesta non trovata.' }, { status: 404 });

    const path = `${motoId}/modello.${formato}`;
    const contentType = formato === 'glb' ? 'model/gltf-binary' : 'application/octet-stream';
    const { error: uploadError } = await admin.storage
      .from('modelli-3d')
      .upload(path, Buffer.from(bytes), { upsert: true, contentType, cacheControl: '3600' });
    if (uploadError) throw new Error(uploadError.message);

    const { data: publicUrl } = admin.storage.from('modelli-3d').getPublicUrl(path);
    const aggiornamento: Record<string, unknown> = {
      model_url: publicUrl.publicUrl,
      model_format: formato,
      stato: 'pronto',
      progress: 100,
      errore: null,
      provider: 'manuale-triplanegaussian',
    };
    if (formato === 'glb') aggiornamento.glb_url = publicUrl.publicUrl;
    const { error: updateError } = await admin.from('moto').update(aggiornamento).eq('id', motoId);
    if (updateError) throw new Error(updateError.message);

    return NextResponse.json({ ok: true, modelUrl: publicUrl.publicUrl, formato });
  } catch (error) {
    return rispostaErrore(error);
  }
}
