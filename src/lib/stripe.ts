import Stripe from 'stripe';

// Client Stripe lato server. La chiave segreta vive SOLO nelle variabili
// d'ambiente di Vercel (STRIPE_SECRET_KEY), mai nel codice o nel browser.
const chiave = process.env.STRIPE_SECRET_KEY;

export const stripe = chiave
  ? new Stripe(chiave)
  : null;

// ID dei prezzi creati nella dashboard Stripe (anche questi via env).
export const PREZZI = {
  mensile: process.env.STRIPE_PRICE_MENSILE ?? '',
  annuale: process.env.STRIPE_PRICE_ANNUALE ?? '',
};
