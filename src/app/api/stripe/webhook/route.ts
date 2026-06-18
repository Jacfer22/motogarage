import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import type Stripe from 'stripe';

export const runtime = 'nodejs';

// Webhook degli eventi Stripe. Stripe chiama questo endpoint quando un
// abbonamento viene creato, rinnovato, disdetto o scade. Qui aggiorniamo
// is_pro / pro_scadenza con la service-role key (unica autorizzata, vedi audit).
//
// La firma viene SEMPRE verificata: senza, chiunque potrebbe chiamare questo
// URL e attivarsi Pro gratis. La chiave del webhook sta nelle env di Vercel.
export async function POST(req: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ errore: 'Stripe non configurato' }, { status: 500 });
  }

  const segreto = process.env.STRIPE_WEBHOOK_SECRET;
  const firma = req.headers.get('stripe-signature');
  if (!segreto || !firma) {
    return NextResponse.json({ errore: 'Firma mancante' }, { status: 400 });
  }

  const corpo = await req.text(); // raw body, necessario per verificare la firma

  let evento: Stripe.Event;
  try {
    evento = stripe.webhooks.constructEvent(corpo, firma, segreto);
  } catch {
    return NextResponse.json({ errore: 'Firma non valida' }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ errore: 'Server non configurato' }, { status: 500 });
  }

  // Imposta is_pro per l'utente collegato a un customer Stripe
  async function impostaPro(customerId: string, attivo: boolean, scadenza: number | null) {
    const { data: profilo } = await admin!
      .from('profiles')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .single();
    if (!profilo) return;
    await admin!
      .from('profiles')
      .update({
        is_pro: attivo,
        pro_scadenza: scadenza ? new Date(scadenza * 1000).toISOString() : null,
      })
      .eq('id', profilo.id);
  }

  // Estrae la fine del periodo corrente. Da Stripe "Basil" questo campo sta
  // sui singoli item dell'abbonamento, non piu' sull'oggetto subscription.
  function finePeriodo(sub: Stripe.Subscription): number | null {
    const item = sub.items?.data?.[0] as { current_period_end?: number } | undefined;
    if (item && typeof item.current_period_end === 'number') return item.current_period_end;
    // fallback per versioni API precedenti
    const legacy = (sub as unknown as { current_period_end?: number }).current_period_end;
    return typeof legacy === 'number' ? legacy : null;
  }

  switch (evento.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = evento.data.object as Stripe.Subscription;
      const attivo = sub.status === 'active' || sub.status === 'trialing';
      await impostaPro(sub.customer as string, attivo, finePeriodo(sub));
      break;
    }
    case 'customer.subscription.deleted': {
      const sub = evento.data.object as Stripe.Subscription;
      await impostaPro(sub.customer as string, false, null);
      break;
    }
    default:
      // altri eventi ignorati
      break;
  }

  return NextResponse.json({ ricevuto: true });
}
