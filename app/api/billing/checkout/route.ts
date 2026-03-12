import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { stripe, STRIPE_PRICE_MONTHLY, STRIPE_PRICE_YEARLY } from '@/lib/stripe'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { interval } = await request.json() // 'monthly' | 'yearly'
  const priceId = interval === 'yearly' ? STRIPE_PRICE_YEARLY : STRIPE_PRICE_MONTHLY

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Get user email from Supabase auth
  const { data: authUser } = await supabase.auth.admin.getUserById(userId)
  const email = authUser?.user?.email

  // Check for existing Stripe customer
  const { data: sub } = await supabase
    .from('user_subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .single()

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${siteUrl}/app/settings?billing=success`,
    cancel_url: `${siteUrl}/app/settings`,
    metadata: { user_id: userId },
    subscription_data: { metadata: { user_id: userId } },
    ...(sub?.stripe_customer_id
      ? { customer: sub.stripe_customer_id }
      : email
      ? { customer_email: email }
      : {}),
  })
  return NextResponse.json({ url: session.url })
}
