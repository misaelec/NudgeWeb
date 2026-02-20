import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')

  console.log('📅 API: GET /api/calendar/list', { userId })

  if (!userId) {
    return NextResponse.json({ error: 'Missing user_id' }, { status: 400 })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    // Get calendars
    const { data: calendars, error: calendarsError } = await supabase
      .from('connected_calendars')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })

    console.log('📅 API: calendars result', { count: calendars?.length, error: calendarsError })

    // Get sync rules
    const { data: rules, error: rulesError } = await supabase
      .from('calendar_sync_rules')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })

    if (rulesError) {
      console.error('Failed to fetch rules:', rulesError)
    }

    return NextResponse.json({ 
      calendars: calendars || [], 
      rules: rules || [] 
    })
  } catch (error) {
    console.error('Error fetching calendars:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
