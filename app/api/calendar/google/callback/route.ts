import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/calendar/google/callback'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function getSupabaseAdmin() {
  return createClient(supabaseUrl, supabaseServiceKey)
}

async function getGoogleTokens(code: string) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID!,
      client_secret: GOOGLE_CLIENT_SECRET!,
      redirect_uri: GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  })
  return response.json()
}

async function getGoogleUserInfo(accessToken: string) {
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  return response.json()
}

async function getGoogleCalendars(accessToken: string) {
  const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  return response.json()
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state') // This is the Supabase user_id
  const error = searchParams.get('error')

  if (error) {
    console.error('OAuth error:', error)
    return NextResponse.redirect(new URL('/app/settings?error=oauth_error', request.url))
  }

  if (!code || !state) {
    console.error('Missing code or state')
    return NextResponse.redirect(new URL('/app/settings?error=missing_params', request.url))
  }

  try {
    // Exchange code for tokens
    const tokens = await getGoogleTokens(code)
    
    if (!tokens.access_token || !tokens.refresh_token) {
      console.error('Missing tokens')
      return NextResponse.redirect(new URL('/app/settings?error=missing_tokens', request.url))
    }

    // Fetch user info
    const userInfo = await getGoogleUserInfo(tokens.access_token)
    const email = userInfo.email
    const name = userInfo.name

    if (!email) {
      console.error('Could not get email from Google')
      return NextResponse.redirect(new URL('/app/settings?error=no_email', request.url))
    }

    // Get calendars
    const calendarList = await getGoogleCalendars(tokens.access_token)
    const primaryCalendar = calendarList.items?.find((cal: any) => cal.primary) || calendarList.items?.[0]
    const calendarId = primaryCalendar?.id || 'primary'

    // Save to Supabase
    const supabase = await getSupabaseAdmin()
    
    // Check if this calendar already exists for this user
    const { data: existing } = await supabase
      .from('connected_calendars')
      .select('*')
      .eq('user_id', state)
      .eq('provider', 'google')
      .eq('calendar_id', calendarId)
      .single()

    if (existing) {
      // Update existing
      await supabase
        .from('connected_calendars')
        .update({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expires_at: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
          account_email: email,
          account_name: name || email,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
    } else {
      // Insert new
      await supabase
        .from('connected_calendars')
        .insert({
          user_id: state,
          provider: 'google',
          account_email: email,
          account_name: name || email,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expires_at: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
          calendar_id: calendarId,
          is_primary: false,
          color: '#ea4335',
        })
    }

    return NextResponse.redirect(new URL('/app/settings?success=calendar_connected', request.url))
  } catch (error) {
    console.error('OAuth callback error:', error)
    return NextResponse.redirect(new URL('/app/settings?error=oauth_failed', request.url))
  }
}
