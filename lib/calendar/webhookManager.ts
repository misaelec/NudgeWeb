import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

function getWebhookUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nudgereminds.com'
  return `${baseUrl}/api/calendar/webhook`
}

function generateChannelId(): string {
  return `nudge-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
}

export async function registerWebhook(calendarDbId: string, accessToken: string, googleCalendarId: string = 'primary'): Promise<boolean> {
  const channelId = generateChannelId()
  const webhookUrl = getWebhookUrl()

  const sevenDaysFromNow = new Date()
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

  console.log('Registering webhook:', { calendarDbId, googleCalendarId, webhookUrl, channelId })

  try {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(googleCalendarId)}/watch`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: channelId,
          type: 'web_hook',
          address: webhookUrl,
          expiration: Math.floor(sevenDaysFromNow.getTime() / 1000) * 1000,
        }),
      }
    )
    
    if (!response.ok) {
      const error = await response.json()
      console.error('Failed to register webhook with Google:', {
        status: response.status,
        webhookUrl,
        calendarDbId,
        googleCalendarId,
        error,
      })
      return false
    }
    
    const data = await response.json()
    console.log('Webhook registered:', data)
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    await supabase
      .from('connected_calendars')
      .update({
        webhook_channel_id: channelId,
        webhook_resource_id: data.resourceId,
        webhook_expiration: new Date(data.expiration).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', calendarDbId)

    console.log('Webhook info saved to database')
    return true
  } catch (error) {
    console.error('Error registering webhook:', { calendarDbId, googleCalendarId, webhookUrl, error })
    return false
  }
}

export async function stopWebhook(channelId: string, resourceId: string, accessToken: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/channels/stop`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: channelId,
          resourceId: resourceId,
        }),
      }
    )
    
    return response.ok
  } catch (error) {
    console.error('Error stopping webhook:', error)
    return false
  }
}

export async function renewWebhook(calendarId: string): Promise<boolean> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  const { data: calendar } = await supabase
    .from('connected_calendars')
    .select('*')
    .eq('id', calendarId)
    .single()
  
  if (!calendar || !calendar.access_token) {
    return false
  }
  
  if (calendar.webhook_channel_id && calendar.webhook_resource_id) {
    await stopWebhook(
      calendar.webhook_channel_id,
      calendar.webhook_resource_id,
      calendar.access_token
    )
  }
  
  return registerWebhook(calendarId, calendar.access_token, calendar.calendar_id || 'primary')
}
