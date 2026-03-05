import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { syncCalendar, getConnectedCalendar, getValidAccessToken, fetchGoogleCalendarEvents } from '@/lib/calendar/syncEngine'
import { registerWebhook, renewWebhook } from '@/lib/calendar/webhookManager'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

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

    if (action === 'reset_sync') {
      // Clear sync_token so next sync does a full fetch with a clean token
      await supabase
        .from('connected_calendars')
        .update({ sync_token: null, updated_at: new Date().toISOString() })
        .eq('id', calendar_id)

      console.log(`Reset sync token for calendar ${calendar_id}`)
      const result = await syncCalendar(calendar_id, { fullClean: true })
      return NextResponse.json({ ...result, reset: true })
    }

    if (action === 'cleanup_duplicates') {
      // Delete ALL calendar_events for this user, then trigger a fresh fullClean sync
      const calendar = await getConnectedCalendar(calendar_id)
      const { count: beforeCount } = await supabase
        .from('calendar_events')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', calendar.user_id)

      // Wipe all events for this user (including ones without source_id from old code)
      await supabase
        .from('calendar_events')
        .delete()
        .eq('user_id', calendar.user_id)

      // Clear sync token so we get a fresh one
      await supabase
        .from('connected_calendars')
        .update({ sync_token: null, updated_at: new Date().toISOString() })
        .eq('id', calendar_id)

      // Run fresh sync
      const result = await syncCalendar(calendar_id, { fullClean: true })

      const { count: afterCount } = await supabase
        .from('calendar_events')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', calendar.user_id)

      return NextResponse.json({
        ...result,
        cleanup: true,
        before_count: beforeCount,
        after_count: afterCount,
      })
    }

    if (action === 'debug') {
      // Read-only diagnostic: shows sync state, tests Google API, checks DB
      const calendar = await getConnectedCalendar(calendar_id)
      const accessToken = await getValidAccessToken(calendar)
      const hasSyncToken = !!calendar.sync_token

      // Count events in DB
      const { count } = await supabase
        .from('calendar_events')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', calendar.user_id)
        .eq('source_id', calendar_id)

      // Try incremental sync (read-only, we won't save anything)
      let googleResult: any = { skipped: true }
      try {
        const result = await fetchGoogleCalendarEvents(
          accessToken,
          calendar.calendar_id || 'primary',
          calendar.sync_token || undefined
        )
        googleResult = {
          needsFullSync: result.needsFullSync || false,
          eventsCount: result.events.length,
          deletedIds: result.deletedIds,
          eventSummaries: result.events.slice(0, 5).map(e => ({ id: e.id, summary: e.summary, status: e.status })),
          nextSyncToken: result.nextSyncToken ? '(present)' : '(empty)',
        }
      } catch (e: any) {
        googleResult = { error: e.message }
      }

      return NextResponse.json({
        calendar: {
          id: calendar.id,
          calendar_id: calendar.calendar_id,
          has_sync_token: hasSyncToken,
          sync_token_preview: calendar.sync_token ? calendar.sync_token.substring(0, 20) + '...' : null,
          last_synced_at: calendar.last_synced_at,
          webhook_channel_id: calendar.webhook_channel_id,
          webhook_expiration: calendar.webhook_expiration,
        },
        db_event_count: count,
        google_incremental_result: googleResult,
      })
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
        console.log('Webhook missing or expired, renewing:', {
          calendar_id,
          webhookMissing,
          webhookExpired,
          expiration: calendar.webhook_expiration,
        })
        try {
          await renewWebhook(calendar_id)
        } catch (e) {
          console.error('Webhook renewal failed during sync:', e)
        }
      }
    }

    const result = await syncCalendar(calendar_id, { fullClean: true })
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
