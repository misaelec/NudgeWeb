import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const MONTHLY_PRODUCT_ID = 'com.nudge.app.pro.monthly'
const YEARLY_PRODUCT_ID  = 'com.nudge.app.pro.yearly'

function periodEndFromProductId(productId: string): string {
  const now = new Date()
  if (productId === YEARLY_PRODUCT_ID) {
    now.setFullYear(now.getFullYear() + 1)
  } else {
    now.setMonth(now.getMonth() + 1)
  }
  return now.toISOString()
}

export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  if (!body?.transactionId || !body?.productId) {
    return NextResponse.json({ error: 'Missing transactionId or productId' }, { status: 400 })
  }

  const { transactionId, originalTransactionId, productId } = body

  // StoreKit 2 verifies transactions on-device, so we trust the client here.
  // For stronger server-side verification, integrate Apple's App Store Server API.
  if (productId !== MONTHLY_PRODUCT_ID && productId !== YEARLY_PRODUCT_ID) {
    return NextResponse.json({ error: 'Unknown product' }, { status: 400 })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const { error } = await supabase.from('user_subscriptions').upsert(
    {
      user_id: userId,
      plan: 'pro',
      status: 'active',
      cancel_at_period_end: false,
      current_period_end: periodEndFromProductId(productId),
      ios_transaction_id: transactionId,
      ios_original_transaction_id: originalTransactionId ?? transactionId,
      ios_product_id: productId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  )

  if (error) {
    console.error('[ios-purchase] Supabase error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  console.log('[ios-purchase] Pro activated for user:', userId, 'product:', productId)
  return NextResponse.json({ success: true })
}
