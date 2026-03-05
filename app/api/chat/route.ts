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

function buildAgentTools(userId: string) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  return {
    getCalendarEvents: tool({
      description:
        'Fetches calendar events and pending reminders for a date range from the database.',
      inputSchema: jsonSchema<{ startDate: string; endDate: string }>({
        type: 'object',
        properties: {
          startDate: { type: 'string', description: 'Start date in ISO 8601 format (YYYY-MM-DD)' },
          endDate: { type: 'string', description: 'End date in ISO 8601 format (YYYY-MM-DD)' },
        },
        required: ['startDate', 'endDate'],
      }),
      execute: async ({ startDate, endDate }) => {
        const start = startDate.includes('T') ? startDate : `${startDate}T00:00:00.000Z`
        const end = endDate.includes('T') ? endDate : `${endDate}T23:59:59.999Z`

        console.log('[chat tool] getCalendarEvents called:', { startDate, endDate, userId })

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
          description: e.description,
          start_date: e.start_date,
          end_date: e.end_date,
          is_all_day: e.is_all_day,
          location: e.location,
          calendar: calendarMap.get(e.source_id) || e.source_type || 'Local',
        }))

        console.log('[chat tool] Results:', {
          eventsCount: events.length,
          remindersCount: (remindersResult.data ?? []).length,
        })

        return { events, reminders: remindersResult.data ?? [] }
      },
    }),

    listGoogleCalendars: tool({
      description:
        'Lists all calendars visible to the user\'s connected Google account(s), including shared calendars and other people\'s calendars they have access to. Use this when the user asks about a specific person\'s schedule or availability.',
      inputSchema: jsonSchema<Record<string, never>>({
        type: 'object',
        properties: {},
        required: [],
      }),
      execute: async () => {
        console.log('[chat tool] listGoogleCalendars called for userId:', userId)
        const connectedAccounts = await getGoogleConnectedCalendars(userId)

        if (connectedAccounts.length === 0) {
          return { calendars: [], message: 'No Google account connected.' }
        }

        const allCalendars: { id: string; name: string; email?: string; accessRole: string; primary: boolean; account: string }[] = []

        for (const account of connectedAccounts) {
          try {
            const accessToken = await getValidAccessToken(account)
            const res = await fetch(
              'https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=250',
              { headers: { Authorization: `Bearer ${accessToken}` } }
            )
            if (!res.ok) {
              console.warn('[chat tool] calendarList error for', account.account_email, await res.text())
              continue
            }
            const data = await res.json()
            const accountLabel = account.account_name || account.account_email
            for (const cal of data.items ?? []) {
              const ownerName = ownerNameFromCalendarId(cal.id)
              allCalendars.push({
                id: cal.id,
                // Prefer the derived human name over the raw email string when available
                name: ownerName ?? cal.summary ?? cal.id,
                email: cal.id.includes('@') && !cal.id.endsWith('@group.calendar.google.com') ? cal.id : undefined,
                accessRole: cal.accessRole,
                primary: cal.primary ?? false,
                account: accountLabel,
              })
            }
          } catch (err) {
            console.warn('[chat tool] Failed to list calendars for', account.account_email, err)
          }
        }

        console.log('[chat tool] listGoogleCalendars found:', allCalendars.length, 'calendars:', allCalendars.map(c => ({ name: c.name, email: c.email, accessRole: c.accessRole })))
        return { calendars: allCalendars }
      },
    }),

    getEventsFromGoogleCalendar: tool({
      description:
        'Fetches events directly from a specific Google Calendar by its ID (obtained from listGoogleCalendars). Use this to check another person\'s schedule or any calendar not synced locally.',
      inputSchema: jsonSchema<{ calendarId: string; startDate: string; endDate: string }>({
        type: 'object',
        properties: {
          calendarId: { type: 'string', description: 'The Google Calendar ID from listGoogleCalendars' },
          startDate: { type: 'string', description: 'Start date in ISO 8601 format (YYYY-MM-DD)' },
          endDate: { type: 'string', description: 'End date in ISO 8601 format (YYYY-MM-DD)' },
        },
        required: ['calendarId', 'startDate', 'endDate'],
      }),
      execute: async ({ calendarId, startDate, endDate }) => {
        const start = startDate.includes('T') ? startDate : `${startDate}T00:00:00.000Z`
        const end = endDate.includes('T') ? endDate : `${endDate}T23:59:59.999Z`

        console.log('[chat tool] getEventsFromGoogleCalendar called:', { calendarId, startDate, endDate })

        const connectedAccounts = await getGoogleConnectedCalendars(userId)
        if (connectedAccounts.length === 0) {
          return { events: [], error: 'No Google account connected.' }
        }

        // Try each connected account until one can access the calendar
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

            if (res.status === 403 || res.status === 404) continue // try next account

            if (!res.ok) {
              const err = await res.json()
              console.warn('[chat tool] getEventsFromGoogleCalendar error:', err)
              continue
            }

            const data = await res.json()
            console.log('[chat tool] getEventsFromGoogleCalendar raw:', {
              itemCount: data.items?.length ?? 0,
              accessRole: data.accessRole,
              summary: data.summary,
            })

            const events = (data.items ?? []).map((e: any) => ({
              title: e.summary || '(No title)',
              start: e.start?.dateTime || e.start?.date,
              end: e.end?.dateTime || e.end?.date,
              isAllDay: !e.start?.dateTime,
              location: e.location,
            }))

            // If no events returned, the calendar may only allow free/busy access.
            // Fall back to the FreeBusy API to check for busy slots.
            if (events.length === 0) {
              console.log('[chat tool] No events from events.list, trying freeBusy API')
              const fbRes = await fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
                method: 'POST',
                headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ timeMin: start, timeMax: end, items: [{ id: calendarId }] }),
              })
              if (fbRes.ok) {
                const fbData = await fbRes.json()
                const busySlots: { start: string; end: string }[] = fbData.calendars?.[calendarId]?.busy ?? []
                console.log('[chat tool] freeBusy slots:', busySlots.length)
                if (busySlots.length > 0) {
                  return {
                    events: busySlots.map((s) => ({ title: 'Busy', start: s.start, end: s.end, isAllDay: false })),
                    note: 'Limited access: only free/busy information is available for this calendar, not event details.',
                  }
                }
              }
            }

            console.log('[chat tool] getEventsFromGoogleCalendar found:', events.length, 'events')
            return { events }
          } catch (err) {
            console.warn('[chat tool] Failed for account', account.account_email, err)
          }
        }

        return { events: [], error: 'Could not access that calendar. You may not have permission.' }
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
  const modelMessages = await convertToModelMessages(messages)
  const tools = buildAgentTools(userId)

  const systemPrompt = `You are the AI assistant for Nudge, a productivity app.
Today's date is ${new Date().toISOString().split('T')[0]}.

You have three tools:

1. getCalendarEvents — fetches the USER'S OWN synced events and reminders from the local Nudge database.
   - ONLY use this for the user's own schedule ("what do I have today?", "my events this week").
   - NEVER use this to look up another person's schedule.
   - Events include a "calendar" field. Group by calendar name when listing.

2. listGoogleCalendars — lists ALL calendars visible to the user's connected Google account, including other people's calendars they have been granted access to.
   - Use this FIRST whenever the user asks about another person's schedule, availability, or calendar.
   - Returns: id, name, accessRole, account.

3. getEventsFromGoogleCalendar — fetches events directly from Google for a specific calendar ID.
   - Use this AFTER getting the calendar ID from listGoogleCalendars.
   - If the result includes a "note" about limited access, mention it to the user.

WORKFLOW — when the user asks about ANOTHER PERSON (e.g. "When is Nayely available?", "What does Nayely have today?"):
  Step 1: Call listGoogleCalendars.
  Step 2: Match the person's name against the "name" field (case-insensitive, partial match OK).
    - Exactly one match → go to Step 4.
    - Multiple matches → list each option with its "name" AND "email" AND "account" so the user can identify the right one, then ask which one to use before continuing.
      Example: "I found multiple calendars matching that name:
        1. Nayely Aguilera (nayely@nerds.ai) — nerds.ai account
        2. Nayely Rodriguez (nayely.rodriguez@nerds.ai) — nerds.ai account
      Which one should I check?"
    - No match → go to Step 3 (do NOT give up yet).
  Step 3 (fallback — same-org email guessing):
    - Only attempt this if the user provided a FULL NAME (first + last). If only a first name was given and there was no match, ask the user for the full name first.
    - Find the user's primary calendar (primary: true) and extract the domain from its email (e.g. misael@nerds.ai → nerds.ai).
    - From the person's full name, generate candidate emails in this order:
        1. firstname.lastname@domain  (e.g. nayely.aguilera@nerds.ai)
        2. firstname@domain           (e.g. nayely@nerds.ai)
        3. flastname@domain           (e.g. naguilera@nerds.ai)
    - Call getEventsFromGoogleCalendar with each candidate until one returns events or a non-error response.
    - If a candidate works → use those results.
    - If all candidates fail → tell the user: "I couldn't find a calendar for [name]. They may not have shared their calendar with you, or they may be on a different domain."
  Step 4: Report the events found, noting if access is limited to free/busy only.

Answer concisely and helpfully. If asked about something outside calendars/reminders, say so.`

  const providers = [
    { name: 'Groq llama-3.3-70b', model: groq('llama-3.3-70b-versatile') },
    { name: 'Groq llama-3.1-8b', model: groq('llama-3.1-8b-instant') },
    // Add Google back once billing is enabled on the Google AI project
    // { name: 'Google', model: google('gemini-2.0-flash') },
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
              stopWhen: stepCountIs(10),
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
