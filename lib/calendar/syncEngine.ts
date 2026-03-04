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
  const allEvents: GoogleCalendarEvent[] = []
  const allDeletedIds: string[] = []
  let pageToken: string | undefined
  let finalSyncToken = ''
  const isIncremental = !!syncToken

  do {
    const params = new URLSearchParams({
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: '2500',
    })

    if (isIncremental) {
      params.set('syncToken', syncToken!)
      params.set('showDeleted', 'true')
    } else {
      params.set('timeMin', new Date().toISOString())
    }

    if (pageToken) {
      params.set('pageToken', pageToken)
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
    const items: GoogleCalendarEvent[] = data.items || []

    for (const item of items) {
      if (item.status === 'cancelled') {
        allDeletedIds.push(item.id)
      } else {
        allEvents.push(item)
      }
    }

    pageToken = data.nextPageToken
    if (data.nextSyncToken) {
      finalSyncToken = data.nextSyncToken
    }
  } while (pageToken)

  return {
    events: allEvents,
    nextSyncToken: finalSyncToken,
    deletedIds: allDeletedIds,
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

  const { data, error, count } = await supabase
    .from('calendar_events')
    .delete()
    .eq('user_id', userId)
    .eq('google_event_id', externalEventId)
    .select('id')

  console.log(`deleteSyncedEvent: google_event_id=${externalEventId}, matched=${data?.length || 0}`, error || '')
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

export async function syncCalendar(calendarId: string, options?: { fullClean?: boolean }): Promise<SyncResult> {
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
    const isFullSync = !calendar.sync_token

    console.log(`Sync mode: ${isFullSync ? 'full' : 'incremental'}, fetched ${events.length} events, deleted: ${deletedIds?.length || 0}`)

    // Save syncToken immediately so next sync is always incremental,
    // even if processing times out on Vercel's 10s limit
    if (nextSyncToken) {
      await updateSyncToken(calendarId, nextSyncToken)
    }

    if (events.length === 0 && !deletedIds?.length) {
      return { success: true, synced: 0, errors: [] }
    }

    // Only wipe existing events when explicitly requested (manual "Sync Now").
    // Webhook-triggered syncs should never wipe — it causes a race condition
    // where the UI refetches during the wipe before re-insert completes.
    if (isFullSync && options?.fullClean) {
      const supabaseClean = createClient(supabaseUrl, supabaseServiceKey)
      const { error: deleteError } = await supabaseClean
        .from('calendar_events')
        .delete()
        .eq('user_id', calendar.user_id)
        .eq('source_id', calendarId)
      if (deleteError) {
        console.error('Error clearing stale events:', deleteError)
      } else {
        console.log('Cleared existing events for full sync mirror')
      }
    }

    // --- Step 1: Write events to local calendar_events table ---
    // Process in parallel batches for speed
    const BATCH_SIZE = 20
    for (let i = 0; i < events.length; i += BATCH_SIZE) {
      const batch = events.slice(i, i + BATCH_SIZE)
      const promises = batch.map(event => {
        const eventData = {
          title: event.summary || '(No title)',
          description: event.description || '',
          start_date: event.start?.dateTime || event.start?.date || new Date().toISOString(),
          end_date: event.end?.dateTime || event.end?.date || new Date().toISOString(),
          is_all_day: !event.start?.dateTime,
          google_event_id: event.id,
          source_type: 'google',
          source_id: calendarId,
          color: calendar.color || '#ea4335',
        }
        return getOrCreateNudgeCalendarEvent(calendar.user_id, event.id, eventData)
      })

      try {
        await Promise.all(promises)
        synced += batch.length
      } catch (e: any) {
        errors.push(`Batch error: ${e.message}`)
      }
    }

    // --- Step 2: Additionally process sync rules for mirroring ---
    const rules = await getSyncRulesForCalendar(calendarId)
    console.log(`Found ${rules.length} sync rules for calendar`)

    if (rules.length > 0) {
      for (const event of events) {
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
                await updateGoogleCalendarEvent(
                  targetAccessToken,
                  targetCalendar.calendar_id || 'primary',
                  existingSynced.target_event_id,
                  googleEventData
                )
              } else {
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
            }
            // Nudge-to-Nudge mirroring via rules is already handled by step 1
          }
        } catch (e: any) {
          errors.push(`Error mirroring event ${event.id}: ${e.message}`)
        }
      }
    }

    // --- Step 3: Handle deleted events ---
    if (deletedIds?.length) {
      console.log(`Deleting ${deletedIds.length} events`)
      const supabase = createClient(supabaseUrl, supabaseServiceKey)

      // Batch delete from local calendar_events
      const DEL_BATCH = 50
      for (let i = 0; i < deletedIds.length; i += DEL_BATCH) {
        const batch = deletedIds.slice(i, i + DEL_BATCH)
        await supabase
          .from('calendar_events')
          .delete()
          .eq('user_id', calendar.user_id)
          .in('google_event_id', batch)
      }

      // Clean up synced_events + target calendars
      for (const deletedId of deletedIds) {
        try {
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
              await supabase
                .from('synced_events')
                .delete()
                .eq('id', se.id)
            }
          }
        } catch (e: any) {
          errors.push(`Error cleaning synced event ${deletedId}: ${e.message}`)
        }
      }
    }

    console.log(`Sync complete. Synced ${synced} events, deleted ${deletedIds?.length || 0}`)

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
