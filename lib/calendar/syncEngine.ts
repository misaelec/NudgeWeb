import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

interface GoogleCalendarEvent {
  id: string
  summary?: string
  description?: string
  start: { dateTime?: string; date?: string }
  end: { dateTime?: string; date?: string }
  status?: string
  htmlLink?: string
  iCalUID?: string
  recurringEventId?: string
}

interface SyncResult {
  success: boolean
  synced: number
  errors: string[]
}

interface FetchEventsResult {
  events: GoogleCalendarEvent[]
  nextSyncToken: string
  deletedIds?: string[]
  needsFullSync?: boolean
}

async function getConnectedCalendar(calendarId: string) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const { data, error } = await supabase
    .from('connected_calendars')
    .select('*')
    .eq('id', calendarId)
    .single()

  if (error || !data) {
    throw new Error(`Calendar not found: ${calendarId}`)
  }

  return data
}

async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expires_in: number }> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to refresh access token')
  }

  return response.json()
}

async function updateAccessToken(calendarId: string, accessToken: string, expiresAt: number) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  await supabase
    .from('connected_calendars')
    .update({
      access_token: accessToken,
      token_expires_at: new Date(expiresAt * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', calendarId)
}

/**
 * Get a valid access token for a calendar, refreshing if needed.
 * Exported so disconnect and other modules can use it.
 */
export async function getValidAccessToken(calendar: any): Promise<string> {
  const expiresAt = calendar.token_expires_at ? new Date(calendar.token_expires_at).getTime() : 0
  const fiveMinutesFromNow = Date.now() + 5 * 60 * 1000
  if (expiresAt && expiresAt > fiveMinutesFromNow) {
    return calendar.access_token
  }
  if (!calendar.refresh_token) {
    return calendar.access_token
  }
  const newTokens = await refreshAccessToken(calendar.refresh_token)
  const newExpiresAt = Math.floor(Date.now() / 1000) + newTokens.expires_in
  await updateAccessToken(calendar.id, newTokens.access_token, newExpiresAt)
  return newTokens.access_token
}

async function fetchGoogleCalendarEvents(
  accessToken: string,
  calendarId: string,
  syncToken?: string
): Promise<FetchEventsResult> {
  const params = new URLSearchParams({
    singleEvents: 'true',
    orderBy: 'startTime',
    showDeleted: 'true',
  })

  if (syncToken) {
    params.set('syncToken', syncToken)
  } else {
    params.set('timeMin', new Date().toISOString())
  }

  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!response.ok) {
    const error = await response.json()
    console.error('Google Calendar API error:', error)

    if (error.error?.code === 410) {
      console.log('Sync token expired, need full sync')
      return { events: [], nextSyncToken: '', deletedIds: [], needsFullSync: true }
    }

    throw new Error(`Google Calendar API error: ${error.error?.message || 'Unknown'}`)
  }

  const data = await response.json()

  return {
    events: data.items || [],
    nextSyncToken: data.nextSyncToken || '',
    deletedIds: data.items?.filter((e: any) => e.status === 'cancelled').map((e: any) => e.id) || [],
  }
}

// --- Google Calendar write functions ---

export async function createGoogleCalendarEvent(
  accessToken: string,
  calendarId: string,
  eventData: { summary: string; description?: string; start: any; end: any }
): Promise<string | null> {
  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(eventData),
  })

  if (!response.ok) {
    const err = await response.json()
    console.error('Failed to create Google event:', err)
    return null
  }

  const created = await response.json()
  return created.id
}

export async function updateGoogleCalendarEvent(
  accessToken: string,
  calendarId: string,
  eventId: string,
  eventData: { summary?: string; description?: string; start?: any; end?: any }
): Promise<boolean> {
  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`
  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(eventData),
  })

  if (!response.ok) {
    const err = await response.json()
    console.error('Failed to update Google event:', err)
    return false
  }

  return true
}

export async function deleteGoogleCalendarEvent(
  accessToken: string,
  calendarId: string,
  eventId: string
): Promise<boolean> {
  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`
  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  // 204 = success, 410 = already deleted
  return response.ok || response.status === 410
}

// --- End Google Calendar write functions ---

async function getSyncRulesForCalendar(calendarId: string): Promise<any[]> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const { data, error } = await supabase
    .from('calendar_sync_rules')
    .select(`
      *,
      source_calendar:connected_calendars!source_calendar_id(*),
      target_calendar:connected_calendars!target_calendar_id(*)
    `)
    .eq('source_calendar_id', calendarId)
    .eq('is_enabled', true)

  if (error) {
    console.error('Error fetching sync rules:', error)
    return []
  }

  return data || []
}

function transformEvent(event: GoogleCalendarEvent, rule: any): Partial<any> {
  let summary = event.summary || 'Busy'
  let description = event.description || ''
  const visibility = rule.visibility_type || 'busy'

  if (visibility === 'busy') {
    summary = 'Busy'
    description = ''
  } else if (visibility === 'blocked') {
    summary = 'Blocked'
    description = ''
  }

  const startDate = event.start?.dateTime || event.start?.date || new Date().toISOString()
  const endDate = event.end?.dateTime || event.end?.date || new Date().toISOString()

  return {
    title: summary,
    description: description,
    start_date: startDate,
    end_date: endDate,
    is_all_day: !event.start?.dateTime,
    google_event_id: event.id,
    source_type: 'google',
  }
}

function transformEventForGoogle(event: GoogleCalendarEvent, rule: any): { summary: string; description: string; start: any; end: any } {
  let summary = event.summary || 'Busy'
  let description = event.description || ''
  const visibility = rule.visibility_type || 'busy'

  if (visibility === 'busy') {
    summary = 'Busy'
    description = ''
  } else if (visibility === 'blocked') {
    summary = 'Blocked'
    description = ''
  }

  return {
    summary,
    description,
    start: event.start,
    end: event.end,
  }
}

async function getOrCreateNudgeCalendar(userId: string): Promise<string> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const { data: existing } = await supabase
    .from('connected_calendars')
    .select('id')
    .eq('user_id', userId)
    .eq('provider', 'nudge')
    .single()

  if (existing) {
    return existing.id
  }

  const { data: newCal, error } = await supabase
    .from('connected_calendars')
    .insert({
      user_id: userId,
      provider: 'nudge',
      account_email: 'nudge',
      account_name: 'My Nudge Calendar',
      color: '#6366f1',
      is_primary: true,
    })
    .select('id')
    .single()

  if (error) {
    throw new Error('Failed to create nudge calendar')
  }

  return newCal.id
}

async function getOrCreateNudgeCalendarEvent(
  userId: string,
  externalEventId: string,
  eventData: Partial<any>
): Promise<string | null> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const { data: existing } = await supabase
    .from('calendar_events')
    .select('id')
    .eq('user_id', userId)
    .eq('google_event_id', externalEventId)
    .single()

  if (existing) {
    await supabase
      .from('calendar_events')
      .update(eventData)
      .eq('id', existing.id)
      .select('id')
      .single()

    return existing.id
  }

  const { data, error } = await supabase
    .from('calendar_events')
    .insert({
      user_id: userId,
      ...eventData,
    })
    .select('id')
    .single()

  if (error) {
    console.error('Error creating event:', error)
    return null
  }

  return data?.id
}

async function deleteSyncedEvent(userId: string, externalEventId: string) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  await supabase
    .from('calendar_events')
    .delete()
    .eq('user_id', userId)
    .eq('google_event_id', externalEventId)
}

async function trackSyncedEvent(
  sourceCalendarId: string,
  sourceEventId: string,
  targetEventId: string,
  targetCalendarId: string,
  userId: string
) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  await supabase
    .from('synced_events')
    .upsert({
      user_id: userId,
      source_event_id: sourceEventId,
      target_event_id: targetEventId,
      source_calendar_id: sourceCalendarId,
      target_calendar_id: targetCalendarId,
    }, {
      onConflict: 'user_id,source_event_id,source_calendar_id',
    })
}

async function updateSyncToken(calendarId: string, syncToken: string) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  await supabase
    .from('connected_calendars')
    .update({
      sync_token: syncToken,
      last_synced_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', calendarId)
}

/**
 * Check if an event was created by our sync (loop prevention).
 * If the event's google_event_id appears as a target_event_id for this calendar, skip it.
 */
async function isLoopEvent(calendarId: string, googleEventId: string): Promise<boolean> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const { data } = await supabase
    .from('synced_events')
    .select('id')
    .eq('target_calendar_id', calendarId)
    .eq('target_event_id', googleEventId)
    .limit(1)

  return (data && data.length > 0) || false
}

export async function syncCalendar(calendarId: string): Promise<SyncResult> {
  const errors: string[] = []
  let synced = 0

  console.log(`Starting sync for calendar: ${calendarId}`)

  try {
    const calendar = await getConnectedCalendar(calendarId)

    if (!calendar.access_token || !calendar.refresh_token) {
      throw new Error('No access token for calendar')
    }

    let accessToken = await getValidAccessToken(calendar)

    let fetchResult = await fetchGoogleCalendarEvents(
      accessToken,
      calendar.calendar_id || 'primary',
      calendar.sync_token || undefined
    )

    // If sync token expired, do a full sync
    if (fetchResult.needsFullSync) {
      console.log('Performing full sync (sync token expired)')
      await updateSyncToken(calendarId, '')
      fetchResult = await fetchGoogleCalendarEvents(
        accessToken,
        calendar.calendar_id || 'primary'
      )
    }

    const { events, nextSyncToken, deletedIds } = fetchResult

    console.log(`Fetched ${events.length} events, deleted: ${deletedIds?.length || 0}`)

    if (events.length === 0 && !deletedIds?.length) {
      if (nextSyncToken) {
        await updateSyncToken(calendarId, nextSyncToken)
      }
      return { success: true, synced: 0, errors: [] }
    }

    const rules = await getSyncRulesForCalendar(calendarId)
    console.log(`Found ${rules.length} sync rules for calendar`)

    if (rules.length === 0) {
      if (nextSyncToken) {
        await updateSyncToken(calendarId, nextSyncToken)
      }
      return { success: true, synced: 0, errors: ['No sync rules configured'] }
    }

    for (const event of events) {
      if (event.status === 'cancelled') {
        continue
      }

      // Loop prevention: skip events we created via sync
      const isLoop = await isLoopEvent(calendarId, event.id)
      if (isLoop) {
        console.log(`Skipping loop event: ${event.id}`)
        continue
      }

      try {
        for (const rule of rules) {
          const targetCalendar = rule.target_calendar

          if (targetCalendar?.provider === 'google') {
            // Target is a Google calendar — create/update event via API
            const targetAccessToken = await getValidAccessToken(targetCalendar)
            const googleEventData = transformEventForGoogle(event, rule)

            // Check if we already synced this event
            const supabase = createClient(supabaseUrl, supabaseServiceKey)
            const { data: existingSynced } = await supabase
              .from('synced_events')
              .select('target_event_id')
              .eq('source_calendar_id', calendarId)
              .eq('source_event_id', event.id)
              .eq('target_calendar_id', targetCalendar.id)
              .single()

            if (existingSynced?.target_event_id) {
              // Update existing event
              await updateGoogleCalendarEvent(
                targetAccessToken,
                targetCalendar.calendar_id || 'primary',
                existingSynced.target_event_id,
                googleEventData
              )
            } else {
              // Create new event
              const newGoogleEventId = await createGoogleCalendarEvent(
                targetAccessToken,
                targetCalendar.calendar_id || 'primary',
                googleEventData
              )
              if (newGoogleEventId) {
                await trackSyncedEvent(
                  calendarId,
                  event.id,
                  newGoogleEventId,
                  targetCalendar.id,
                  calendar.user_id
                )
              }
            }
            synced++
          } else {
            // Target is Nudge calendar — write to calendar_events table
            const nudgeCalendarId = await getOrCreateNudgeCalendar(calendar.user_id)

            const eventData = transformEvent(event, rule)
            eventData.user_id = calendar.user_id

            const targetEventId = await getOrCreateNudgeCalendarEvent(
              calendar.user_id,
              event.id,
              eventData
            )

            if (targetEventId) {
              await trackSyncedEvent(
                calendarId,
                event.id,
                targetEventId,
                nudgeCalendarId,
                calendar.user_id
              )
              synced++
            }
          }
        }
      } catch (e: any) {
        errors.push(`Error syncing event ${event.id}: ${e.message}`)
      }
    }

    // Handle deleted events
    if (deletedIds?.length) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey)
      for (const deletedId of deletedIds) {
        try {
          // Delete from Nudge calendar_events
          await deleteSyncedEvent(calendar.user_id, deletedId)

          // Also delete from target Google calendars
          const { data: syncedEntries } = await supabase
            .from('synced_events')
            .select('*, target_calendar:connected_calendars!target_calendar_id(*)')
            .eq('source_calendar_id', calendarId)
            .eq('source_event_id', deletedId)

          if (syncedEntries) {
            for (const se of syncedEntries) {
              if (se.target_calendar?.provider === 'google' && se.target_calendar?.access_token) {
                const targetAccessToken = await getValidAccessToken(se.target_calendar)
                await deleteGoogleCalendarEvent(
                  targetAccessToken,
                  se.target_calendar.calendar_id || 'primary',
                  se.target_event_id
                )
              }
              // Clean up synced_events entry
              await supabase
                .from('synced_events')
                .delete()
                .eq('id', se.id)
            }
          }
        } catch (e: any) {
          errors.push(`Error deleting event ${deletedId}: ${e.message}`)
        }
      }
    }

    if (nextSyncToken) {
      await updateSyncToken(calendarId, nextSyncToken)
    }

    console.log(`Sync complete. Synced ${synced} events`)

    return { success: true, synced, errors }
  } catch (error: any) {
    console.error('Sync error:', error)
    errors.push(error.message)
    return { success: false, synced, errors }
  }
}

export async function triggerSyncForChannel(channelId: string): Promise<SyncResult> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const { data: calendar, error } = await supabase
    .from('connected_calendars')
    .select('*')
    .eq('webhook_channel_id', channelId)
    .single()

  if (error || !calendar) {
    console.error('Calendar not found for channel:', channelId)
    return { success: false, synced: 0, errors: ['Calendar not found'] }
  }

  return syncCalendar(calendar.id)
}
