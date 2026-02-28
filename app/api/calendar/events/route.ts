import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')

    if (!userId) {
      return NextResponse.json({ error: 'Missing user ID' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: events, error } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', userId)

    if (error) {
      console.error('Error fetching calendar events:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const mapped = (events || []).map((e: any) => ({
      id: e.id,
      title: e.title || 'Untitled',
      description: e.description || '',
      startDate: e.start_date,
      endDate: e.end_date,
      location: e.location || '',
      color: e.color || '#ea4335',
      sourceType: e.source_type || 'google',
      isAllDay: e.is_all_day || false,
      googleEventId: e.google_event_id,
      createdAt: e.created_at,
    }))

    return NextResponse.json({ events: mapped })
  } catch (error) {
    console.error('Error in calendar events endpoint:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
