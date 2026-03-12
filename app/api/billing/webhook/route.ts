import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig) return NextResponse.json({ error: 'Missing signature' }, { status: 400 })

  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err: any) {
    console.error('[webhook] Signature verification failed:', err.message)
    return NextResponse.json({ error: `Invalid signature: ${err.message}` }, { status: 400 })
  }

  console.log('[webhook] Received event:', event.type, event.id)

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any
        const userId = session.metadata?.user_id
        console.log('[webhook] checkout.session.completed — userId:', userId, 'subscription:', session.subscription)

        if (!userId) {
          console.error('[webhook] No user_id in metadata')
          break
        }

        const subscription = await stripe.subscriptions.retrieve(session.subscription)
        console.log('[webhook] Retrieved subscription:', subscription.id, 'status:', subscription.status)

        const { error: upsertError } = await supabase.from('user_subscriptions').upsert({
          user_id: userId,
          stripe_customer_id: session.customer,
          stripe_subscription_id: session.subscription,
          plan: 'pro',
          status: subscription.status,
          cancel_at_period_end: subscription.cancel_at_period_end,
          current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })

        if (upsertError) {
          console.error('[webhook] Supabase upsert error:', upsertError)
          return NextResponse.json({ error: upsertError.message }, { status: 500 })
        }

        console.log('[webhook] Upserted subscription for user:', userId)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as any
        const userId = subscription.metadata?.user_id
        console.log('[webhook] subscription.updated — userId:', userId, 'status:', subscription.status)

        if (!userId) break

        const { error: upsertError } = await supabase.from('user_subscriptions').upsert({
          user_id: userId,
          stripe_customer_id: subscription.customer,
          stripe_subscription_id: subscription.id,
          plan: 'pro',
          status: subscription.status,
          cancel_at_period_end: subscription.cancel_at_period_end,
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })

        if (upsertError) console.error('[webhook] Supabase upsert error:', upsertError)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any
        const userId = subscription.metadata?.user_id
        console.log('[webhook] subscription.deleted — userId:', userId)

        if (!userId) break

        await supabase.from('user_subscriptions')
          .update({ plan: 'free', status: 'canceled', updated_at: new Date().toISOString() })
          .eq('user_id', userId)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any
        console.log('[webhook] invoice.payment_failed — customer:', invoice.customer)
        await supabase.from('user_subscriptions')
          .update({ status: 'past_due', updated_at: new Date().toISOString() })
          .eq('stripe_customer_id', invoice.customer)
        break
      }

      default:
        console.log('[webhook] Unhandled event type:', event.type)
    }
  } catch (err: any) {
    console.error('[webhook] Unhandled error processing event:', event.type, err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
