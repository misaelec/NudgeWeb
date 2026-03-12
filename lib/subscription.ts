import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export interface Subscription {
  plan: 'free' | 'pro'
  status: string
  cancel_at_period_end: boolean
  current_period_end: string | null
  stripe_customer_id: string | null
}

export async function getUserSubscription(userId: string): Promise<Subscription> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  const { data } = await supabase
    .from('user_subscriptions')
    .select('plan, status, cancel_at_period_end, current_period_end, stripe_customer_id')
    .eq('user_id', userId)
    .single()

  if (!data) {
    return { plan: 'free', status: 'active', cancel_at_period_end: false, current_period_end: null, stripe_customer_id: null }
  }

  // If canceled and period has ended, treat as free
  if (data.plan === 'pro' && data.cancel_at_period_end && data.current_period_end) {
    if (new Date(data.current_period_end) < new Date()) {
      return { ...data, plan: 'free' }
    }
  }

  return data as Subscription
}

/** Returns a 403 Response if the user is not on Pro. Import and call at the top of Pro API routes. */
export async function requirePro(userId: string): Promise<Response | null> {
  const sub = await getUserSubscription(userId)
  const isActive = sub.status === 'active' || sub.status === 'trialing'
  if (sub.plan !== 'pro' || !isActive) {
    return new Response(JSON.stringify({ error: 'Pro subscription required' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  return null
}
