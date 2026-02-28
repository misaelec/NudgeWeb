import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { stopWebhook } from '@/lib/calendar/webhookManager'
import { deleteGoogleCalendarEvent, getValidAccessToken } from '@/lib/calendar/syncEngine'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { calendar_id } = body

    if (!calendar_id) {
      return NextResponse.json({ error: 'Missing calendar_id' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get calendar to check for webhook
    const { data: calendar } = await supabase
      .from('connected_calendars')
      .select('*')
      .eq('id', calendar_id)
      .single()

    // Stop Google webhook if exists
    if (calendar?.webhook_channel_id && calendar?.webhook_resource_id && calendar?.access_token) {
      await stopWebhook(
        calendar.webhook_channel_id,
        calendar.webhook_resource_id,
        calendar.access_token
      )
    }

    // Find all synced events where this calendar is source OR target
    const { data: syncedEvents } = await supabase
      .from('synced_events')
      .select('*, target_calendar:connected_calendars!target_calendar_id(*)')
      .or(`source_calendar_id.eq.${calendar_id},target_calendar_id.eq.${calendar_id}`)

    // Delete the actual calendar_events and Google events created by sync
    if (syncedEvents && syncedEvents.length > 0) {
      for (const se of syncedEvents) {
        // If target is a Google calendar, delete the event from Google
        if (se.target_calendar?.provider === 'google' && se.target_calendar?.access_token) {
          try {
            const accessToken = await getValidAccessToken(se.target_calendar)
            await deleteGoogleCalendarEvent(
              accessToken,
              se.target_calendar.calendar_id || 'primary',
              se.target_event_id
            )
          } catch (e) {
            console.error('Failed to delete Google event during disconnect:', e)
          }
        }

        // Delete from calendar_events table
        await supabase
          .from('calendar_events')
          .delete()
          .eq('id', se.target_event_id)
      }

      // Delete all synced_events entries
      await supabase
        .from('synced_events')
        .delete()
        .or(`source_calendar_id.eq.${calendar_id},target_calendar_id.eq.${calendar_id}`)
    }

    // Also delete any calendar_events sourced from this Google calendar
    if (calendar?.user_id) {
      await supabase
        .from('calendar_events')
        .delete()
        .eq('user_id', calendar.user_id)
        .eq('source_type', 'google')
    }

    // Delete sync rules where this calendar is source OR target
    await supabase
      .from('calendar_sync_rules')
      .delete()
      .or(`source_calendar_id.eq.${calendar_id},target_calendar_id.eq.${calendar_id}`)

    // Delete the calendar
    const { error } = await supabase
      .from('connected_calendars')
      .delete()
      .eq('id', calendar_id)

    if (error) {
      console.error('Failed to delete calendar:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error disconnecting calendar:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
