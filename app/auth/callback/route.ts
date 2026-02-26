import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const errorDescription = requestUrl.searchParams.get('error_description')
  const errorCode = requestUrl.searchParams.get('error_code')

  console.log('[Auth Callback] Request URL:', request.url)
  console.log('[Auth Callback] Code present:', !!code)
  console.log('[Auth Callback] Error description:', errorDescription)
  console.log('[Auth Callback] Error code:', errorCode)

  if (errorDescription || errorCode) {
    console.error('[Auth Callback] OAuth error:', errorDescription || errorCode)
    return NextResponse.redirect(new URL('/?error=auth_failed', request.url))
  }

  if (!code) {
    console.error('[Auth Callback] No code found in URL')
    return NextResponse.redirect(new URL('/?error=no_code', request.url))
  }

  try {
    const supabase = createSupabaseServerClient()
    console.log('[Auth Callback] Exchanging code for session...')
    
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('[Auth Callback] Exchange error:', error.message)
      return NextResponse.redirect(new URL('/?error=auth_failed', request.url))
    }

    console.log('[Auth Callback] Session established for user:', data.user?.id)
    console.log('[Auth Callback] Redirecting to /app/reminders')
    return NextResponse.redirect(new URL('/app/reminders', request.url))
  } catch (err) {
    console.error('[Auth Callback] Unexpected error:', err)
    return NextResponse.redirect(new URL('/?error=auth_failed', request.url))
  }
}
