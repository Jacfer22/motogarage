import { NextResponse } from 'next/server';
import { statoConfigServer } from '@/lib/env-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const stato = statoConfigServer();
  const ok = stato.supabaseUrl && stato.anonKey && stato.serviceRole && stato.huggingFace;
  return NextResponse.json({
    ok,
    ...stato,
    messaggio: ok
      ? 'Server configurato per la generazione gemelli.'
      : `Mancano variabili server (${stato.ambiente}). Su Vercel aggiungi SUPABASE_SERVICE_ROLE_KEY (service_role da Supabase, non anon) e HUGGINGFACE_TOKEN, poi Redeploy. In locale riavvia npm run dev dopo aver modificato .env.local.`,
  });
}
