import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')

  if (!userId) {
    return NextResponse.json({ error: 'Missing user_id' }, { status: 400 })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Get calendars (include webhook status for JIT renewal)
    const { data: calendars, error: calendarsError } = await supabase
      .from('connected_calendars')
      .select('id, user_id, provider, account_email, account_name, calendar_id, is_primary, color, webhook_channel_id, webhook_expiration, created_at, updated_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })

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
