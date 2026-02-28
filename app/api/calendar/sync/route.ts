import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { syncCalendar } from '@/lib/calendar/syncEngine'
import { registerWebhook } from '@/lib/calendar/webhookManager'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { calendar_id, action } = body

  if (!calendar_id) {
    return NextResponse.json({ error: 'Missing calendar_id' }, { status: 400 })
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    if (action === 'register_webhook') {
      const { data: calendar } = await supabase
        .from('connected_calendars')
        .select('*')
        .eq('id', calendar_id)
        .single()

      if (!calendar) {
        return NextResponse.json({ error: 'Calendar not found' }, { status: 404 })
      }

      const success = await registerWebhook(calendar_id, calendar.access_token)
      return NextResponse.json({ success })
    }

    // For regular sync, also check if webhook needs (re-)registration
    const { data: calendar } = await supabase
      .from('connected_calendars')
      .select('*')
      .eq('id', calendar_id)
      .single()

    if (calendar && calendar.provider === 'google') {
      const webhookExpired = !calendar.webhook_expiration ||
        new Date(calendar.webhook_expiration) < new Date()
      const webhookMissing = !calendar.webhook_channel_id

      if (webhookMissing || webhookExpired) {
        console.log('Webhook missing or expired, re-registering:', {
          calendar_id,
          webhookMissing,
          webhookExpired,
          expiration: calendar.webhook_expiration,
        })
        try {
          await registerWebhook(calendar_id, calendar.access_token, calendar.calendar_id || 'primary')
        } catch (e) {
          console.error('Webhook re-registration failed during sync:', e)
        }
      }
    }

    const result = await syncCalendar(calendar_id)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Sync API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const calendar_id = searchParams.get('calendar_id')

  if (!calendar_id) {
    return NextResponse.json({ error: 'Missing calendar_id' }, { status: 400 })
  }

  try {
    const result = await syncCalendar(calendar_id)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Sync API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
