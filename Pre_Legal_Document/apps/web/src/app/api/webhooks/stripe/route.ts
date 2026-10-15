import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { prisma, SubscriptionStatus } from '@prelegal/database'
import Stripe from 'stripe'

function getStripeClient(): Stripe {
  const secret = process.env.PAYMENT_SECRET_KEY
  if (!secret) {
    throw new Error('PAYMENT_SECRET_KEY must be configured to process billing webhooks')
  }
  return new Stripe(secret, { apiVersion: '2023-10-16' })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headersList = await headers()
    const signature = headersList.get('stripe-signature')

    if (!signature) {
      return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
    }

    const webhookSecret = process.env.PAYMENT_WEBHOOK_SECRET
    if (!webhookSecret) {
      throw new Error('PAYMENT_WEBHOOK_SECRET must be configured to process billing webhooks')
    }
    const stripe = getStripeClient()

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    // Check if event already processed
    const existingEvent = await prisma.webhookEvent.findUnique({
      where: { eventId: event.id },
    })

    if (existingEvent?.processed) {
      return NextResponse.json({ received: true, duplicate: true })
    }

    // Store webhook event
    await prisma.webhookEvent.upsert({
      where: { eventId: event.id },
      create: {
        provider: 'stripe',
        eventType: event.type,
        eventId: event.id,
        payload: event.data.object as any,
        processed: false,
      },
      update: {
        payload: event.data.object as any,
      },
    })

    // Handle event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(stripe, session)
        break
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdated(subscription)
        break
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(subscription)
        break
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentFailed(invoice)
        break
      }
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice
        await handleInvoicePaid(invoice)
        break
      }
    }

    // Mark as processed
    await prisma.webhookEvent.update({
      where: { eventId: event.id },
      data: { processed: true, processedAt: new Date() },
    })

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Stripe webhook error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}

async function handleCheckoutCompleted(stripe: Stripe, session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId
  const planId = session.metadata?.planId
  const organizationId = session.metadata?.organizationId

  if (
    (!userId && !organizationId) ||
    typeof session.subscription !== 'string' ||
    typeof session.customer !== 'string'
  ) {
    return
  }

  const subscription = await stripe.subscriptions.retrieve(session.subscription)
  const priceId = subscription.items.data[0]?.price.id

  const plan = await prisma.plan.findFirst({
    where: { subscriptions: { some: { stripePriceId: priceId } } },
  })

  if (!plan) return

  await prisma.subscription.upsert({
    where: { stripeSubscriptionId: subscription.id },
    create: {
      userId: userId || undefined,
      organizationId: organizationId || undefined,
      planId: plan.id,
      status: 'ACTIVE',
      stripeCustomerId: session.customer as string,
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
    update: {
      status: 'ACTIVE',
      stripePriceId: priceId,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  })
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const priceId = subscription.items.data[0]?.price.id

  const plan = await prisma.plan.findFirst({
    where: { subscriptions: { some: { stripePriceId: priceId } } },
  })

  if (!plan) return

  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: mapStripeStatus(subscription.status),
      stripePriceId: priceId,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
    },
  })
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: 'CANCELED',
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    },
  })
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription
  if (typeof subscriptionId !== 'string') return

  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: subscriptionId },
    data: { status: 'PAST_DUE' },
  })
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription
  if (typeof subscriptionId !== 'string') return

  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: subscriptionId },
    data: { status: 'ACTIVE' },
  })
}

function mapStripeStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case 'active':
      return 'ACTIVE'
    case 'past_due':
      return 'PAST_DUE'
    case 'canceled':
      return 'CANCELED'
    case 'trialing':
      return 'TRIALING'
    case 'incomplete':
      return 'INCOMPLETE'
    default:
      return 'INCOMPLETE'
  }
}