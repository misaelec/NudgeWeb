import {
  streamText,
  convertToModelMessages,
  stepCountIs,
  tool,
  jsonSchema,
  createUIMessageStream,
  createUIMessageStreamResponse,
} from 'ai'
import { groq } from '@ai-sdk/groq'
import { google } from '@ai-sdk/google'
import { createClient } from '@supabase/supabase-js'
import { getValidAccessToken } from '@/lib/calendar/syncEngine'

export const maxDuration = 60

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/** Derive a human-readable display name from a calendar ID that looks like an email. */
function ownerNameFromCalendarId(calendarId: string): string | null {
  // Personal calendars have an email as ID, e.g. nayely.aguilera@azumo.com
  // Group/shared calendars look like c_xxx@group.calendar.google.com — skip those
  if (!calendarId.includes('@') || calendarId.endsWith('@group.calendar.google.com')) return null
  const local = calendarId.split('@')[0]
  return local
    .split(/[._-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

/** Fetch all Google connected calendars for the user with valid tokens. */
async function getGoogleConnectedCalendars(userId: string) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  const { data } = await supabase
    .from('connected_calendars')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', 'google')
  return data ?? []
}

/** Add one hour to a HH:MM time string. */
function addOneHour(time: string): string {
  const [h, m] = time.split(':').map(Number)
  return `${String((h + 1) % 24).padStart(2, '0')}:${String(m || 0).padStart(2, '0')}`
}

/** Fetch events from a Google Calendar ID using any connected account that has access. */
async function fetchGoogleEvents(
  connectedAccounts: any[],
  calendarId: string,
  start: string,
  end: string
): Promise<{ events: any[]; note?: string; error?: string }> {
  for (const account of connectedAccounts) {
    try {
      const accessToken = await getValidAccessToken(account)
      const params = new URLSearchParams({
        singleEvents: 'true',
        orderBy: 'startTime',
        timeMin: start,
        timeMax: end,
        maxResults: '100',
      })
      const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )

      if (res.status === 403 || res.status === 404) continue

      if (!res.ok) continue

      const data = await res.json()
      const events = (data.items ?? []).map((e: any) => ({
        title: e.summary || '(No title)',
        start: e.start?.dateTime || e.start?.date,
        end: e.end?.dateTime || e.end?.date,
        isAllDay: !e.start?.dateTime,
        location: e.location,
      }))

      if (events.length === 0) {
        // Try FreeBusy API for calendars with limited access
        const fbRes = await fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ timeMin: start, timeMax: end, items: [{ id: calendarId }] }),
        })
        if (fbRes.ok) {
          const fbData = await fbRes.json()
          const busySlots: { start: string; end: string }[] = fbData.calendars?.[calendarId]?.busy ?? []
          if (busySlots.length > 0) {
            return {
              events: busySlots.map((s) => ({ title: 'Busy', start: s.start, end: s.end, isAllDay: false })),
              note: 'Limited access: only free/busy info available, not event details.',
            }
          }
        }
      }

      return { events }
    } catch {
      continue
    }
  }
  return { events: [], error: 'Could not access that calendar.' }
}

function buildAgentTools(userId: string) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  return {
    getCalendarEvents: tool({
      description: "Fetches the user's own synced events and reminders for a date range. Only for the user's own schedule.",
      inputSchema: jsonSchema<{ startDate: string; endDate: string }>({
        type: 'object',
        properties: {
          startDate: { type: 'string', description: 'Start date YYYY-MM-DD' },
          endDate: { type: 'string', description: 'End date YYYY-MM-DD' },
        },
        required: ['startDate', 'endDate'],
      }),
      execute: async ({ startDate, endDate }) => {
        const start = startDate.includes('T') ? startDate : `${startDate}T00:00:00.000Z`
        const end = endDate.includes('T') ? endDate : `${endDate}T23:59:59.999Z`

        const [eventsResult, calendarsResult, remindersResult] = await Promise.all([
          supabase
            .from('calendar_events')
            .select('title, description, start_date, end_date, is_all_day, location, source_type, source_id')
            .eq('user_id', userId)
            .gte('start_date', start)
            .lte('start_date', end)
            .order('start_date', { ascending: true }),
          supabase
            .from('connected_calendars')
            .select('id, account_name, account_email, provider')
            .eq('user_id', userId),
          supabase
            .from('reminders')
            .select('title, notes, due_date, priority')
            .eq('user_id', userId)
            .eq('is_completed', false)
            .gte('due_date', start)
            .lte('due_date', end)
            .order('due_date', { ascending: true }),
        ])

        const calendarMap = new Map(
          (calendarsResult.data ?? []).map((c) => [c.id, c.account_name || c.account_email])
        )

        const events = (eventsResult.data ?? []).map((e) => ({
          title: e.title,
          start_date: e.start_date,
          end_date: e.end_date,
          is_all_day: e.is_all_day,
          location: e.location,
          calendar: calendarMap.get(e.source_id) || e.source_type || 'Local',
        }))

        console.log('[chat tool] getCalendarEvents:', events.length, 'events,', (remindersResult.data ?? []).length, 'reminders')
        return { events, reminders: remindersResult.data ?? [] }
      },
    }),

    createCalendarEvent: tool({
      description: "Creates a calendar event. If calendarId is not provided, returns available calendars for the user to pick from.",
      inputSchema: jsonSchema<{
        title: string
        startDate: string
        startTime: string
        endDate?: string
        endTime?: string
        description?: string
        location?: string
        calendarId?: string
        calendarName?: string
      }>({
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Event title' },
          startDate: { type: 'string', description: 'Start date YYYY-MM-DD' },
          startTime: { type: 'string', description: 'Start time HH:MM (24h)' },
          endDate: { type: 'string', description: 'End date YYYY-MM-DD, defaults to startDate' },
          endTime: { type: 'string', description: 'End time HH:MM (24h), defaults to startTime + 1 hour' },
          description: { type: 'string', description: 'Event description' },
          location: { type: 'string', description: 'Event location' },
          calendarId: { type: 'string', description: 'Google Calendar ID to create the event in' },
          calendarName: { type: 'string', description: 'Human-readable calendar name for confirmation' },
        },
        required: ['title', 'startDate', 'startTime'],
      }),
      execute: async ({ title, startDate, startTime, endDate, endTime, description, location, calendarId, calendarName }) => {
        console.log('[chat tool] createCalendarEvent called:', { title, startDate, startTime, calendarId })

        const connectedAccounts = await getGoogleConnectedCalendars(userId)

        // No calendarId — return available calendars for user to pick
        if (!calendarId) {
          const { data: allCals } = await supabase
            .from('connected_calendars')
            .select('id, account_name, account_email, provider, color')
            .eq('user_id', userId)

          const calendars = (allCals ?? []).map((c) => ({
            id: c.account_email || c.id,
            name: c.account_name || c.account_email,
            provider: c.provider,
            color: c.color,
          }))

          // Add local Nudge calendar
          calendars.unshift({ id: 'nudge-local', name: 'My Nudge Calendar', provider: 'nudge', color: '#6366f1' })

          return {
            action: 'select_calendar' as const,
            calendars,
            pendingEvent: { title, startDate, startTime, endDate, endTime, description, location },
          }
        }

        const resolvedEndDate = endDate || startDate
        const resolvedEndTime = endTime || addOneHour(startTime)
        const startDateTime = `${startDate}T${startTime}:00`
        const endDateTime = `${resolvedEndDate}T${resolvedEndTime}:00`

        // Local Nudge calendar — insert directly into Supabase
        if (calendarId === 'nudge-local') {
          const { error } = await supabase.from('calendar_events').insert({
            user_id: userId,
            title,
            description: description ?? null,
            location: location ?? null,
            start_date: new Date(startDateTime).toISOString(),
            end_date: new Date(endDateTime).toISOString(),
            is_all_day: false,
            source_type: 'local',
            color: '#6366f1',
          })
          if (error) return { success: false, error: error.message }
          return { success: true, message: `"${title}" created in My Nudge Calendar.` }
        }

        // Google calendar — find a connected account with access and create via API
        for (const account of connectedAccounts) {
          try {
            const accessToken = await getValidAccessToken(account)
            const body = {
              summary: title,
              description: description ?? undefined,
              location: location ?? undefined,
              start: { dateTime: startDateTime, timeZone: 'UTC' },
              end: { dateTime: endDateTime, timeZone: 'UTC' },
            }
            const res = await fetch(
              `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
              {
                method: 'POST',
                headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
              }
            )
            if (!res.ok) {
              if (res.status === 403 || res.status === 404) continue
              const err = await res.json()
              return { success: false, error: err.error?.message ?? 'Failed to create event.' }
            }
            const created = await res.json()
            console.log('[chat tool] Event created:', created.id)
            return { success: true, message: `"${title}" created in ${calendarName || calendarId}.` }
          } catch {
            continue
          }
        }

        return { success: false, error: 'Could not create event. Check calendar access.' }
      },
    }),

    getPersonEvents: tool({
      description: "Finds another person's calendar by name and fetches their events. Handles calendar discovery, name matching, and email fallback automatically.",
      inputSchema: jsonSchema<{ name: string; startDate: string; endDate: string; calendarId?: string }>({
        type: 'object',
        properties: {
          name: { type: 'string', description: "The person's name or email to look up" },
          startDate: { type: 'string', description: 'Start date YYYY-MM-DD' },
          endDate: { type: 'string', description: 'End date YYYY-MM-DD' },
          calendarId: { type: 'string', description: 'Optional: specific calendar ID if already known from a previous disambiguation' },
        },
        required: ['name', 'startDate', 'endDate'],
      }),
      execute: async ({ name, startDate, endDate, calendarId }) => {
        const start = startDate.includes('T') ? startDate : `${startDate}T00:00:00.000Z`
        const end = endDate.includes('T') ? endDate : `${endDate}T23:59:59.999Z`

        console.log('[chat tool] getPersonEvents called:', { name, startDate, endDate, calendarId })

        const connectedAccounts = await getGoogleConnectedCalendars(userId)
        if (connectedAccounts.length === 0) {
          return { error: 'No Google account connected.' }
        }

        // If caller already knows the calendar ID, fetch directly
        if (calendarId) {
          return fetchGoogleEvents(connectedAccounts, calendarId, start, end)
        }

        // Step 1: Build calendar list from all connected accounts
        type CalEntry = { id: string; name: string; email?: string; accessRole: string; account: string; primary: boolean }
        const allCalendars: CalEntry[] = []
        let primaryEmail = ''

        for (const account of connectedAccounts) {
          try {
            const accessToken = await getValidAccessToken(account)
            const res = await fetch(
              'https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=250',
              { headers: { Authorization: `Bearer ${accessToken}` } }
            )
            if (!res.ok) continue
            const data = await res.json()
            const accountLabel = account.account_name || account.account_email
            for (const cal of data.items ?? []) {
              const isPrimary = cal.primary ?? false
              if (isPrimary && !primaryEmail) primaryEmail = cal.id
              const ownerName = ownerNameFromCalendarId(cal.id)
              allCalendars.push({
                id: cal.id,
                name: ownerName ?? cal.summary ?? cal.id,
                email: cal.id.includes('@') && !cal.id.endsWith('@group.calendar.google.com') ? cal.id : undefined,
                accessRole: cal.accessRole,
                account: accountLabel,
                primary: isPrimary,
              })
            }
          } catch { continue }
        }

        console.log('[chat tool] calendarList:', allCalendars.map(c => ({ name: c.name, email: c.email })))

        // Step 2: Match by name (case-insensitive, partial)
        const query = name.toLowerCase()
        const matches = allCalendars.filter(
          (c) => c.name.toLowerCase().includes(query) || c.email?.toLowerCase().includes(query)
        )

        if (matches.length > 1) {
          return {
            needsDisambiguation: true,
            matches: matches.map((m) => ({ id: m.id, name: m.name, email: m.email, account: m.account })),
            message: `Found ${matches.length} calendars matching "${name}". Ask the user which one to use.`,
          }
        }

        if (matches.length === 1) {
          return fetchGoogleEvents(connectedAccounts, matches[0].id, start, end)
        }

        // Step 3: Email fallback using org domain
        const nameParts = name.trim().split(/\s+/)
        if (nameParts.length < 2) {
          return {
            needsFullName: true,
            firstName: name,
          }
        }

        const domain = primaryEmail.includes('@') ? primaryEmail.split('@')[1] : null
        if (!domain) {
          return { error: `No calendar found for "${name}" and could not determine org domain.` }
        }

        const [first, ...rest] = nameParts
        const last = rest.join('')
        const candidates = [
          `${first.toLowerCase()}.${last.toLowerCase()}@${domain}`,
          `${first.toLowerCase()}@${domain}`,
          `${first[0].toLowerCase()}${last.toLowerCase()}@${domain}`,
        ]

        console.log('[chat tool] Trying email candidates:', candidates)

        for (const candidate of candidates) {
          const result = await fetchGoogleEvents(connectedAccounts, candidate, start, end)
          if (!result.error && (result.events.length > 0 || result.note)) {
            console.log('[chat tool] Found via candidate:', candidate)
            return result
          }
        }

        return {
          error: `No calendar found for "${name}". They may not have shared their calendar with you, or they may be on a different domain.`,
        }
      },
    }),
  }
}

export async function POST(request: Request) {
  const userId = request.headers.get('x-user-id')

  if (!userId) {
    return new Response('Unauthorized', { status: 401 })
  }

  console.log('[chat] POST hit, userId:', userId)

  const { messages } = await request.json()
  // Limit history to last 8 messages to reduce token usage
  const recentMessages = messages.slice(-8)
  const modelMessages = await convertToModelMessages(recentMessages)
  const tools = buildAgentTools(userId)

  const systemPrompt = `You are the AI assistant for Nudge. Today: ${new Date().toISOString().split('T')[0]}.

Tools:
- getCalendarEvents: user's OWN events/reminders. Never use for other people.
- getPersonEvents: find another person's events by name. Handles discovery automatically.
  - "needsDisambiguation": list matches with name/email/account, ask which one, then call again with calendarId.
  - "needsFullName": ask for full name. NEVER guess a last name.
  - "error": relay to user.
- createCalendarEvent: creates an event. Always extract title, date, and time from the user's message before calling.
  - If calendarId is omitted, the tool returns available calendars — the UI will show buttons for the user to pick. Do NOT ask the user to type a calendar name.
  - When the user sends a message like "Calendar selected: [name] (id: [id])", call createCalendarEvent again with that calendarId and the same event details.
  - "success": confirm to the user with the message from the result.
  - "error": relay to user.

Be concise. Group events by calendar when listing.`

  const providers = [
    { name: 'Google gemini-2.0-flash', model: google('gemini-2.0-flash') },
    { name: 'Groq llama-3.3-70b', model: groq('llama-3.3-70b-versatile') },
    { name: 'Groq llama-3.1-8b', model: groq('llama-3.1-8b-instant') },
  ]

  return createUIMessageStreamResponse({
    stream: createUIMessageStream({
      execute: async ({ writer }) => {
        let lastError: unknown

        for (const { name, model } of providers) {
          try {
            const result = streamText({
              model,
              system: systemPrompt,
              messages: modelMessages,
              tools,
              stopWhen: stepCountIs(5),
            })

            // Iterate manually so we can detect error chunks and fall through
            const uiStream = result.toUIMessageStream()
            for await (const chunk of uiStream) {
              if ('type' in chunk && chunk.type === 'error') {
                throw new Error(chunk.errorText)
              }
              writer.write(chunk)
            }
            return // success
          } catch (error) {
            lastError = error
            console.warn(`[chat] ${name} failed:`, error)
          }
        }

        // All providers failed
        console.error('[chat] All providers failed. Last error:', lastError)
      },
      onError: (error) => {
        console.error('[chat] Stream error:', error)
        return 'An error occurred while generating a response.'
      },
    }),
  })
}
