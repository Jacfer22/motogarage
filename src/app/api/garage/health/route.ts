import { NextRequest, NextResponse } from 'next/server';
import { hfGarageSpace, statoConfigServer } from '@/lib/env-server';
import { verificaUtente, rispostaErroreApi } from '@/lib/garage-server-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Diagnostica config — solo admin autenticato (non esporre prima del lancio). */
export async function GET(req: NextRequest) {
  try {
    const { user, admin } = await verificaUtente(req);
    const { data: profilo } = await admin.from('profiles').select('is_admin').eq('id', user.id).single();
    if (!profilo?.is_admin) {
      return NextResponse.json({ errore: 'Non autorizzato.' }, { status: 403 });
    }

    const stato = statoConfigServer();
    const ok = stato.supabaseUrl && stato.anonKey && stato.huggingFace;
    return NextResponse.json({
      ok,
      ...stato,
      hfSpace: hfGarageSpace(),
      messaggio: ok
        ? stato.serviceRole
          ? 'Server configurato (modalità service_role).'
          : 'Server configurato (modalità utente).'
        : 'Configurazione incompleta.',
    });
  } catch (error) {
    const { messaggio, status } = rispostaErroreApi(error);
    return NextResponse.json({ errore: messaggio }, { status });
  }
}
