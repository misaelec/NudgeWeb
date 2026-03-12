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

function formatInTz(iso: string | null | undefined, tz: string): string | null {
  if (!iso) return null
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false,
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

function buildAgentTools(userId: string, userTimezone: string = 'UTC') {
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
          start: e.is_all_day ? e.start_date?.slice(0, 10) : formatInTz(e.start_date, userTimezone),
          end: e.is_all_day ? e.end_date?.slice(0, 10) : formatInTz(e.end_date, userTimezone),
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
          calendarName: { type: 'string', description: 'Human-readable calendar name the user mentioned (e.g. "Nerds", "Work"). Used to auto-match a calendar when calendarId is unknown.' },
        },
        required: ['title', 'startDate', 'startTime'],
      }),
      execute: async ({ title, startDate, startTime, endDate, endTime, description, location, calendarId, calendarName }) => {
        console.log('[chat tool] createCalendarEvent called:', { title, startDate, startTime, calendarId })

        // Always fetch fresh connected calendars — never rely on a stale calendarId
        const { data: allCals } = await supabase
          .from('connected_calendars')
          .select('id, account_name, account_email, provider, color')
          .eq('user_id', userId)

        const connectedCalendars = allCals ?? []
        const connectedAccounts = await getGoogleConnectedCalendars(userId)

        const buildCalendarList = () => [
          { id: 'nudge-local', name: 'My Nudge Calendar', provider: 'nudge', color: '#6366f1' },
          ...connectedCalendars.map((c) => ({
            id: c.account_email || c.id,
            name: c.account_name || c.account_email,
            provider: c.provider,
            color: c.color,
          })),
        ]

        // If calendarId was provided, verify it still corresponds to a connected calendar.
        // This prevents creating events on previously linked calendars that have since been removed.
        if (calendarId && calendarId !== 'nudge-local') {
          const isStillConnected = connectedCalendars.some(
            (c) => c.id === calendarId || c.account_email === calendarId
          )
          if (!isStillConnected) {
            console.warn('[chat tool] calendarId no longer connected, showing picker:', calendarId)
            return {
              action: 'select_calendar' as const,
              calendars: buildCalendarList(),
              pendingEvent: { title, startDate, startTime, endDate, endTime, description, location },
              reason: 'That calendar is no longer connected. Please select an active calendar.',
            }
          }
        }

        // No calendarId — try to resolve from calendarName or show picker
        if (!calendarId) {
          const calendars = buildCalendarList()

          // If a name hint was provided, try to match it
          if (calendarName) {
            const q = calendarName.toLowerCase()
            const matches = calendars.filter((c) => c.name?.toLowerCase().includes(q))
            if (matches.length === 1) {
              // Exactly one match — auto-select, no picker needed
              calendarId = matches[0].id
              calendarName = matches[0].name
            } else {
              // Multiple or zero matches — show only the relevant subset (or all if zero)
              return {
                action: 'select_calendar' as const,
                calendars: matches.length > 0 ? matches : calendars,
                pendingEvent: { title, startDate, startTime, endDate, endTime, description, location },
              }
            }
          } else {
            return {
              action: 'select_calendar' as const,
              calendars,
              pendingEvent: { title, startDate, startTime, endDate, endTime, description, location },
            }
          }
        }

        const resolvedEndDate = endDate || startDate
        const resolvedEndTime = endTime || addOneHour(startTime)
        const startDateTime = `${startDate}T${startTime}:00`
        const endDateTime = `${resolvedEndDate}T${resolvedEndTime}:00`

        // Local Nudge calendar — insert directly into Supabase
        if (calendarId === 'nudge-local') {
          // Parse the local datetime string as if it's in the user's timezone
          // by using the Intl API to get the UTC equivalent
          const toUTC = (localDT: string) => {
            const [date, time] = localDT.split('T')
            const [y, mo, d] = date.split('-').map(Number)
            const [h, mi, s] = time.split(':').map(Number)
            // Create date in user's timezone via formatting trick
            const formatter = new Intl.DateTimeFormat('en-CA', {
              timeZone: userTimezone,
              year: 'numeric', month: '2-digit', day: '2-digit',
              hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
            })
            // Use temporal-like approach: build a UTC date and adjust offset
            const naiveUTC = Date.UTC(y, mo - 1, d, h, mi, s || 0)
            const utcDate = new Date(naiveUTC)
            // Get what the timezone thinks this UTC time is
            const parts = formatter.formatToParts(utcDate)
            const p = Object.fromEntries(parts.filter(x => x.type !== 'literal').map(x => [x.type, Number(x.value)]))
            const tzOffset = naiveUTC - Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second)
            return new Date(naiveUTC + tzOffset).toISOString()
          }
          const { error } = await supabase.from('calendar_events').insert({
            user_id: userId,
            title,
            description: description ?? null,
            location: location ?? null,
            start_date: toUTC(startDateTime),
            end_date: toUTC(endDateTime),
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
              start: { dateTime: startDateTime, timeZone: userTimezone },
              end: { dateTime: endDateTime, timeZone: userTimezone },
            }
            const res = await fetch(
              `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId!)}/events`,
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

    createReminder: tool({
      description: "Creates a reminder for the user. Due date is optional — only include it if the user explicitly mentioned a date or time.",
      inputSchema: jsonSchema<{
        title: string
        notes?: string
        dueDate?: string
        dueTime?: string
        priority?: string
      }>({
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Reminder title' },
          notes: { type: 'string', description: 'Optional additional notes' },
          dueDate: { type: 'string', description: 'Due date YYYY-MM-DD — only if user specified one' },
          dueTime: { type: 'string', description: 'Due time HH:MM — only if user specified one' },
          priority: { type: 'string', description: 'low | medium | high — default medium' },
        },
        required: ['title'],
      }),
      execute: async ({ title, notes, dueDate, dueTime, priority }) => {
        console.log('[chat tool] createReminder called:', { title, dueDate, dueTime, priority })

        let due_date: string | null = null
        if (dueDate) {
          const time = dueTime ? `${dueTime}:00` : '09:00:00'
          due_date = new Date(`${dueDate}T${time}`).toISOString()
        }

        const { error } = await supabase.from('reminders').insert({
          user_id: userId,
          title,
          notes: notes ?? null,
          due_date,
          priority: priority ?? 'medium',
          is_completed: false,
        })

        if (error) {
          console.error('[chat tool] createReminder error:', error)
          return { success: false, error: error.message }
        }

        const when = dueDate ? ` for ${dueDate}${dueTime ? ` at ${dueTime}` : ''}` : ''
        return { success: true, message: `Reminder "${title}" created${when}.` }
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

  const userTimezone = request.headers.get('x-timezone') || 'UTC'
  console.log('[chat] POST hit, userId:', userId, 'timezone:', userTimezone)

  const { messages } = await request.json()

  // Fire-and-forget: log the latest user prompt + email
  ;(async () => {
    try {
      const supabase = createClient(supabaseUrl, supabaseServiceKey)
      const lastUserMsg = [...messages].reverse().find((m: any) => m.role === 'user')
      const promptText = typeof lastUserMsg?.content === 'string'
        ? lastUserMsg.content
        : Array.isArray(lastUserMsg?.content)
          ? lastUserMsg.content.filter((p: any) => p.type === 'text').map((p: any) => p.text).join(' ')
          : null

      if (promptText) {
        const { data: authUser } = await supabase.auth.admin.getUserById(userId)
        await supabase.from('chat_prompts').insert({
          user_id: userId,
          user_email: authUser?.user?.email ?? null,
          prompt: promptText,
        })
      }
    } catch (e) {
      console.warn('[chat] Failed to log prompt:', e)
    }
  })()

  // Limit history to last 8 messages to reduce token usage
  const recentMessages = messages.slice(-8)
  const modelMessages = await convertToModelMessages(recentMessages)
  const tools = buildAgentTools(userId, userTimezone)

  const now = new Date().toLocaleString('en-CA', { timeZone: userTimezone, hour12: false })
  const systemPrompt = `You are the AI assistant for Nudge. Current date and time: ${now} (${userTimezone}).

Tools:
- getCalendarEvents: user's OWN events/reminders. Never use for other people.
- getPersonEvents: find another person's events by name.
  - "needsDisambiguation": list matches, ask which one, call again with calendarId.
  - "needsFullName": ask for full name. NEVER guess a last name.
  - "error": relay to user.
- createCalendarEvent: creates a calendar event.
  - ALWAYS resolve relative dates ("tomorrow", "next Monday", "Friday") to YYYY-MM-DD using today's date before calling. Only ask the user if both date AND time are completely absent from their message.
  - If the user mentions a calendar by name (e.g. "nerds calendar", "work calendar"), pass it as calendarName — NEVER ask the user for a calendar ID.
  - If calendarId is omitted, the tool returns available calendars. Output NO text — the UI shows the picker buttons automatically.
  - When user sends "Calendar selected: [name] (id: [id])", call createCalendarEvent again with that calendarId and the same event details from context.
  - "success": confirm using the result message. "error": relay to user.
- createReminder: creates a reminder.
  - Call immediately after getting the title — do NOT ask for a date/time unless the user mentioned one.
  - Only include dueDate/dueTime if the user explicitly stated them.
  - "success": confirm using the result message. "error": relay to user.

Be concise. Group events by calendar when listing.`

  const providers = [
    { name: 'Google gemini-2.5-flash-lite', model: google('gemini-2.5-flash-lite') },
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
