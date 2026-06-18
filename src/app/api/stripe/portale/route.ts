import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

// Apre il portale clienti di Stripe, dove l'utente puo' vedere, aggiornare
// o disdire il proprio abbonamento. Body atteso: { accessToken: string }
export async function POST(req: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ errore: 'Stripe non configurato' }, { status: 500 });
  }

  let body: { accessToken?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ errore: 'Richiesta non valida' }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon || !body.accessToken) {
    return NextResponse.json({ errore: 'Sessione mancante' }, { status: 401 });
  }
  const supabaseUser = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${body.accessToken}` } },
  });
  const { data: userData, error } = await supabaseUser.auth.getUser();
  if (error || !userData.user) {
    return NextResponse.json({ errore: 'Utente non autenticato' }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ errore: 'Server non configurato' }, { status: 500 });
  }

  const { data: profilo } = await admin
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', userData.user.id)
    .single();

  const customerId = profilo?.stripe_customer_id as string | undefined;
  if (!customerId) {
    return NextResponse.json({ errore: 'Nessun abbonamento trovato' }, { status: 404 });
  }

  const origine = req.headers.get('origin') ?? 'https://girosecco.vercel.app';
  const portale = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${origine}/hub`,
  });

  return NextResponse.json({ url: portale.url });
}
