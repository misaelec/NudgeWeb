import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { renewWebhook } from '@/lib/calendar/webhookManager'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Find all Google calendars with expired or expiring-within-24h webhooks
  const twentyFourHoursFromNow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

  const { data: calendars, error } = await supabase
    .from('connected_calendars')
    .select('id, calendar_id, webhook_channel_id, webhook_expiration')
    .eq('provider', 'google')
    .or(`webhook_channel_id.is.null,webhook_expiration.is.null,webhook_expiration.lt.${twentyFourHoursFromNow}`)

  if (error) {
    console.error('Error fetching calendars for webhook renewal:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  if (!calendars || calendars.length === 0) {
    console.log('No webhooks need renewal')
    return NextResponse.json({ renewed: 0 })
  }

  console.log(`Renewing webhooks for ${calendars.length} calendar(s)`)

  let renewed = 0
  let failed = 0

  for (const calendar of calendars) {
    try {
      const success = await renewWebhook(calendar.id)
      if (success) {
        renewed++
        console.log(`Renewed webhook for calendar ${calendar.id}`)
      } else {
        failed++
        console.error(`Failed to renew webhook for calendar ${calendar.id}`)
      }
    } catch (e) {
      failed++
      console.error(`Error renewing webhook for calendar ${calendar.id}:`, e)
    }
  }

  console.log(`Webhook renewal complete: ${renewed} renewed, ${failed} failed`)
  return NextResponse.json({ renewed, failed, total: calendars.length })
}
