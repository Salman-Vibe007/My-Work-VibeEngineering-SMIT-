import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { admin, userFrom, baseUrl } from '@/lib/server';

export async function POST(req) {
  const u = await userFrom(req);
  if (!u) return NextResponse.json({ error: 'Please log in first.' }, { status: 401 });
  const { data: p } = await admin().from('profiles').select('stripe_customer_id').eq('id', u.id).maybeSingle();
  if (!process.env.STRIPE_SECRET_KEY || !p?.stripe_customer_id) return NextResponse.json({ error: 'No active subscription to manage.' }, { status: 400 });
  const s = await new Stripe(process.env.STRIPE_SECRET_KEY).billingPortal.sessions.create({ customer: p.stripe_customer_id, return_url: baseUrl(req) + '/billing' });
  return NextResponse.json({ url: s.url });
}
