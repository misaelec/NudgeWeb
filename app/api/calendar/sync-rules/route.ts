import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { user_id, source_calendar_id, target_calendar_id, visibility_type, sync_direction } = body

  console.log('sync-rules POST:', { user_id, source_calendar_id, target_calendar_id })

  if (!user_id || !source_calendar_id || !target_calendar_id) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const { data, error } = await supabase
      .from('calendar_sync_rules')
      .insert({
        user_id,
        source_calendar_id,
        target_calendar_id,
        visibility_type: visibility_type || 'busy',
        sync_direction: sync_direction || 'bidirectional',
        is_enabled: true,
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ rule: data })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const body = await request.json()
  const { rule_id, updates } = body

  if (!rule_id || !updates) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const { data, error } = await supabase
      .from('calendar_sync_rules')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', rule_id)
      .select()
      .single()

    if (error) {
      console.error('Error updating sync rule:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ rule: data })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const rule_id = searchParams.get('rule_id')

  if (!rule_id) {
    return NextResponse.json({ error: 'Missing rule_id' }, { status: 400 })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const { error } = await supabase
      .from('calendar_sync_rules')
      .delete()
      .eq('id', rule_id)

    if (error) {
      console.error('Error deleting sync rule:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
