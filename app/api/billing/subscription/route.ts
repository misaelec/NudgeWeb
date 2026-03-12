import { NextRequest, NextResponse } from 'next/server'
import { getUserSubscription } from '@/lib/subscription'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sub = await getUserSubscription(userId)
  const isPro = sub.plan === 'pro' && (sub.status === 'active' || sub.status === 'trialing')

  return NextResponse.json({ ...sub, isPro })
}
