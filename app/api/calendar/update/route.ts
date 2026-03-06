import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { calendar_id, color, account_name } = body

  if (!calendar_id) {
    return NextResponse.json({ error: 'Missing calendar_id' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const updates: Record<string, any> = { updated_at: new Date().toISOString() }
  if (color) updates.color = color
  if (account_name !== undefined) updates.account_name = account_name

  // Update only if owned by the authenticated user
  const { error: calError } = await supabase
    .from('connected_calendars')
    .update(updates)
    .eq('id', calendar_id)
    .eq('user_id', userId)

  if (calError) {
    return NextResponse.json({ error: calError.message }, { status: 500 })
  }

  // Also update all existing events from this calendar to use the new color
  if (color) {
    await supabase
      .from('calendar_events')
      .update({ color })
      .eq('source_id', calendar_id)
  }

  return NextResponse.json({ success: true })
}
