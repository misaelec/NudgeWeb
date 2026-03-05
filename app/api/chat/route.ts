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

export const maxDuration = 60

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

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
        // Normalize bare dates (YYYY-MM-DD) to cover the full day in UTC
        const start = startDate.includes('T') ? startDate : `${startDate}T00:00:00.000Z`
        const end = endDate.includes('T') ? endDate : `${endDate}T23:59:59.999Z`

        console.log('[chat tool] getCalendarEvents called:', { startDate, endDate, start, end, userId })

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
          events: events.map((e) => ({ title: e.title, start_date: e.start_date, calendar: e.calendar })),
          remindersCount: (remindersResult.data ?? []).length,
          calendarsFound: calendarsResult.data?.length ?? 0,
          eventsError: eventsResult.error,
        })

        return {
          events,
          reminders: remindersResult.data ?? [],
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
  const modelMessages = await convertToModelMessages(messages)
  const tools = buildAgentTools(userId)

  const systemPrompt = `You are the AI assistant for Nudge, a productivity app.
Use the getCalendarEvents tool to look up the user's calendar events and reminders when needed.
Each event includes a "calendar" field indicating which calendar it belongs to. When listing events, group or label them by calendar name (e.g. "You have 3 events today in Work Calendar: ...").
Answer concisely and helpfully.
If asked about something outside calendar/reminders, let the user know you only have access to those.
Today's date is ${new Date().toISOString().split('T')[0]}.`

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
