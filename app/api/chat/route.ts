import {
  streamText,
  convertToModelMessages,
  stepCountIs,
  tool,
  createUIMessageStream,
  createUIMessageStreamResponse,
} from 'ai'
import { google } from '@ai-sdk/google'
import { groq } from '@ai-sdk/groq'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

export const maxDuration = 60

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

function buildAgentTools(userId: string) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  return {
    getCalendarEvents: tool({
      description:
        'Fetches calendar events and pending reminders for a date range from the database.',
      inputSchema: z.object({
        startDate: z.string().describe('Start date in ISO 8601 format'),
        endDate: z.string().describe('End date in ISO 8601 format'),
      }),
      execute: async ({ startDate, endDate }) => {
        const [eventsResult, calendarsResult, remindersResult] = await Promise.all([
          supabase
            .from('calendar_events')
            .select('title, description, start_date, end_date, is_all_day, location, source_type, source_id')
            .eq('user_id', userId)
            .gte('start_date', startDate)
            .lte('start_date', endDate)
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
            .gte('due_date', startDate)
            .lte('due_date', endDate)
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
    { name: 'Google', model: google('gemini-2.0-flash') },
    { name: 'Groq', model: groq('llama-3.3-70b-versatile') },
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
