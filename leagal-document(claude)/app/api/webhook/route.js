import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { admin } from '@/lib/server';

export async function POST(req) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY), body = await req.text();
  let ev;
  try { ev = stripe.webhooks.constructEvent(body, req.headers.get('stripe-signature'), process.env.STRIPE_WEBHOOK_SECRET); }
  catch { return new Response('Invalid signature', { status: 400 }); }
  const db = admin();
  const ins = await db.from('webhook_events').insert({ id: ev.id });       // idempotency: each event runs once
  if (ins.error) return NextResponse.json({ received: true, duplicate: true });
  const o = ev.data.object;
  try {
    if (ev.type === 'checkout.session.completed')
      await db.from('profiles').update({ plan: o.metadata.plan, stripe_customer_id: o.customer, stripe_subscription_id: o.subscription, subscription_status: 'active' }).eq('id', o.client_reference_id);
    if (ev.type === 'customer.subscription.updated')
      await db.from('profiles').update({ subscription_status: o.status }).eq('stripe_customer_id', o.customer);
    if (ev.type === 'customer.subscription.deleted')
      await db.from('profiles').update({ plan: 'free', subscription_status: 'canceled', stripe_subscription_id: null }).eq('stripe_customer_id', o.customer);
    if (ev.type === 'invoice.paid' || ev.type === 'invoice.payment_failed') {
      const found = (await db.from('profiles').select('id').eq('stripe_customer_id', o.customer).maybeSingle()).data;
      const uid = found?.id || o.subscription_details?.metadata?.user_id || o.parent?.subscription_details?.metadata?.user_id;
      if (uid && ev.type === 'invoice.paid')
        await db.from('invoices').upsert({ id: o.id, user_id: uid, amount_paid: o.amount_paid, currency: o.currency, status: o.status, hosted_invoice_url: o.hosted_invoice_url });
      if (uid && ev.type === 'invoice.payment_failed') await db.from('profiles').update({ subscription_status: 'past_due' }).eq('id', uid);
    }
  } catch (e) {
    await db.from('webhook_events').delete().eq('id', ev.id);               // let Stripe retry
    return new Response('Handler error', { status: 500 });
  }
  return NextResponse.json({ received: true });
}
