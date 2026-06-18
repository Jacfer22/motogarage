import { NextRequest, NextResponse } from 'next/server';
import { stripe, PREZZI } from '@/lib/stripe';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

// Crea una sessione di Stripe Checkout per l'abbonamento Pro.
// Body atteso: { piano: 'mensile' | 'annuale', accessToken: string }
export async function POST(req: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ errore: 'Stripe non configurato' }, { status: 500 });
  }

  let body: { piano?: string; accessToken?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ errore: 'Richiesta non valida' }, { status: 400 });
  }

  const piano = body.piano === 'annuale' ? 'annuale' : 'mensile';
  const priceId = piano === 'annuale' ? PREZZI.annuale : PREZZI.mensile;
  if (!priceId) {
    return NextResponse.json({ errore: 'Prezzo non configurato' }, { status: 500 });
  }

  // Identifico l'utente dal token di sessione Supabase (passato dal client)
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon || !body.accessToken) {
    return NextResponse.json({ errore: 'Sessione mancante' }, { status: 401 });
  }
  const supabaseUser = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${body.accessToken}` } },
  });
  const { data: userData, error: userErr } = await supabaseUser.auth.getUser();
  if (userErr || !userData.user) {
    return NextResponse.json({ errore: 'Utente non autenticato' }, { status: 401 });
  }
  const user = userData.user;

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ errore: 'Server non configurato' }, { status: 500 });
  }

  // Recupero o creo il customer Stripe associato a questo utente
  const { data: profilo } = await admin
    .from('profiles')
    .select('stripe_customer_id, username')
    .eq('id', user.id)
    .single();

  let customerId = profilo?.stripe_customer_id as string | undefined;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;
    await admin.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id);
  }

  const origine = req.headers.get('origin') ?? 'https://girosecco.vercel.app';

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: {
      trial_period_days: 7,
      metadata: { supabase_user_id: user.id },
    },
    // l'utente che riapre il checkout senza pagare non viene riaddebitato due volte
    client_reference_id: user.id,
    success_url: `${origine}/hub?pro=ok`,
    cancel_url: `${origine}/pro?annullato=1`,
    allow_promotion_codes: true,
  });

  return NextResponse.json({ url: session.url });
}
