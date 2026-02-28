import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { syncCalendar, deleteGoogleCalendarEvent, getValidAccessToken } from '@/lib/calendar/syncEngine'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { user_id, source_calendar_id, target_calendar_id, visibility_type, sync_direction } = body

  console.log('sync-rules POST:', { user_id, source_calendar_id, target_calendar_id })

  if (!user_id || !source_calendar_id || !target_calendar_id) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data, error } = await supabase
      .from('calendar_sync_rules')
      .insert({
        user_id,
        source_calendar_id,
        target_calendar_id,
        visibility_type: visibility_type || 'busy',
        sync_direction: sync_direction || 'bidirectional',
        is_enabled: true,
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Trigger sync immediately so existing events are synced right away
    try {
      await syncCalendar(source_calendar_id)
    } catch (syncErr) {
      console.error('Failed to trigger initial sync for new rule:', syncErr)
    }

    return NextResponse.json({ rule: data })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const body = await request.json()
  const { rule_id, updates } = body

  if (!rule_id || !updates) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data, error } = await supabase
      .from('calendar_sync_rules')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', rule_id)
      .select()
      .single()

    if (error) {
      console.error('Error updating sync rule:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ rule: data })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const rule_id = searchParams.get('rule_id')

  if (!rule_id) {
    return NextResponse.json({ error: 'Missing rule_id' }, { status: 400 })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get the rule to find source/target calendars
    const { data: rule } = await supabase
      .from('calendar_sync_rules')
      .select('*, target_calendar:connected_calendars!target_calendar_id(*)')
      .eq('id', rule_id)
      .single()

    if (rule) {
      // Find all synced events created by this rule
      const { data: syncedEvents } = await supabase
        .from('synced_events')
        .select('*')
        .eq('source_calendar_id', rule.source_calendar_id)
        .eq('target_calendar_id', rule.target_calendar_id)

      if (syncedEvents && syncedEvents.length > 0) {
        for (const se of syncedEvents) {
          // If target is Google, delete via API
          if (rule.target_calendar?.provider === 'google' && rule.target_calendar?.access_token) {
            try {
              const accessToken = await getValidAccessToken(rule.target_calendar)
              await deleteGoogleCalendarEvent(
                accessToken,
                rule.target_calendar.calendar_id || 'primary',
                se.target_event_id
              )
            } catch (e) {
              console.error('Failed to delete Google event during rule deletion:', e)
            }
          }

          // Delete from calendar_events table (Nudge events)
          await supabase
            .from('calendar_events')
            .delete()
            .eq('id', se.target_event_id)
        }

        // Delete synced_events entries
        await supabase
          .from('synced_events')
          .delete()
          .eq('source_calendar_id', rule.source_calendar_id)
          .eq('target_calendar_id', rule.target_calendar_id)
      }
    }

    // Delete the rule
    const { error } = await supabase
      .from('calendar_sync_rules')
      .delete()
      .eq('id', rule_id)

    if (error) {
      console.error('Error deleting sync rule:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
