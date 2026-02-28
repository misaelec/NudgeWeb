import { NextRequest, NextResponse } from 'next/server'
import { renewWebhook } from '@/lib/calendar/webhookManager'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { calendar_id } = body

  if (!calendar_id) {
    return NextResponse.json({ error: 'Missing calendar_id' }, { status: 400 })
  }

  try {
    const success = await renewWebhook(calendar_id)
    return NextResponse.json({ success })
  } catch (error: any) {
    console.error('Webhook renewal error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
