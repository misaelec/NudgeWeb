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
