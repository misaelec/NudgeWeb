import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { calendar_id } = body

    if (!calendar_id) {
      return NextResponse.json({ error: 'Missing calendar_id' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Delete sync rules first
    await supabase
      .from('calendar_sync_rules')
      .delete()
      .eq('source_calendar_id', calendar_id)
      .eq('target_calendar_id', calendar_id)

    // Delete the calendar
    const { error } = await supabase
      .from('connected_calendars')
      .delete()
      .eq('id', calendar_id)

    if (error) {
      console.error('Failed to delete calendar:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error disconnecting calendar:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
