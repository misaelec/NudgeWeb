import { NextRequest, NextResponse } from 'next/server'
import { syncCalendar, triggerSyncForChannel } from '@/lib/calendar/syncEngine'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headers = request.headers
    
    const channelId = headers.get('x-goog-channel-id')
    const channelExpiration = headers.get('x-goog-channel-expiration')
    const channelState = headers.get('x-goog-channel-state')
    const resourceId = headers.get('x-goog-resource-id')
    const resourceState = headers.get('x-goog-resource-state')
    const messageNumber = headers.get('x-goog-message-number')
    
    console.log('📥 Webhook received:', {
      channelId,
      channelState,
      resourceState,
      messageNumber,
    })
    
    if (!channelId) {
      console.error('No channel ID in webhook')
      return NextResponse.json({ error: 'No channel ID' }, { status: 400 })
    }
    
    // Google sends lowercase: 'sync' (initial), 'exists' (resource exists), 'update' (changed)
    if (resourceState === 'sync') {
      console.log('Webhook sync confirmation received, no action needed')
      return NextResponse.json({ success: true })
    }

    if (resourceState === 'exists' || resourceState === 'update') {
      console.log(`Triggering sync for channel: ${channelId}`)

      try {
        const result = await triggerSyncForChannel(channelId)
        console.log('Sync result:', result)
      } catch (syncError) {
        console.error('Sync error in webhook:', syncError)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ status: 'Webhook endpoint active' })
}
