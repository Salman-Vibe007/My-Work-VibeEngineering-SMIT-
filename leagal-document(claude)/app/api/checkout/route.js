import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { userFrom, baseUrl } from '@/lib/server';

export async function POST(req) {
  const u = await userFrom(req);
  if (!u) return NextResponse.json({ error: 'Please log in first.' }, { status: 401 });
  const { plan } = await req.json();
  const price = { pro: process.env.STRIPE_PRICE_PRO, business: process.env.STRIPE_PRICE_BUSINESS }[plan];
  if (!process.env.STRIPE_SECRET_KEY || !price) return NextResponse.json({ error: 'Billing is not configured yet.' }, { status: 500 });
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY), base = baseUrl(req);
  const s = await stripe.checkout.sessions.create({
    mode: 'subscription', line_items: [{ price, quantity: 1 }], customer_email: u.email, client_reference_id: u.id,
    metadata: { plan, user_id: u.id }, subscription_data: { metadata: { plan, user_id: u.id } },
    success_url: base + '/billing?success=1', cancel_url: base + '/pricing',
  });
  return NextResponse.json({ url: s.url });
}
