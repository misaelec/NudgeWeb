import { NextRequest, NextResponse } from 'next/server'

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
const GOOGLE_REDIRECT_URI = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/calendar/google/callback'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const userId = searchParams.get('user_id')

  console.log('🔗 Google Connect - userId:', userId)
  console.log('🔗 Google Connect - GOOGLE_CLIENT_ID configured:', !!GOOGLE_CLIENT_ID)

  if (!userId) {
    console.error('🔗 Google Connect - Missing user_id')
    return NextResponse.redirect(new URL('/app/settings?error=missing_user_id', request.url))
  }

  if (!GOOGLE_CLIENT_ID) {
    console.error('🔗 Google Connect - GOOGLE_CLIENT_ID is not configured')
    return NextResponse.redirect(new URL('/app/settings?error=google_not_configured', request.url))
  }

  const scopes = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ]

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID)
  authUrl.searchParams.set('redirect_uri', GOOGLE_REDIRECT_URI)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', scopes.join(' '))
  authUrl.searchParams.set('access_type', 'offline')
  authUrl.searchParams.set('prompt', 'consent')
  authUrl.searchParams.set('state', userId)

  return NextResponse.redirect(authUrl.toString())
}
