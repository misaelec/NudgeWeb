import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const errorDescription = requestUrl.searchParams.get('error_description')

  if (errorDescription) {
    console.error('[Auth Callback] Error:', errorDescription)
    return NextResponse.redirect(new URL('/?error=auth_failed', request.url))
  }

  if (!code) {
    console.error('[Auth Callback] No code found')
    return NextResponse.redirect(new URL('/?error=no_code', request.url))
  }

  try {
    const supabase = createSupabaseServerClient()
    
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('[Auth Callback] Exchange error:', error.message)
      return NextResponse.redirect(new URL('/?error=auth_failed', request.url))
    }

    console.log('[Auth Callback] Session established for user:', data.user?.id)
    return NextResponse.redirect(new URL('/app/reminders', request.url))
  } catch (err) {
    console.error('[Auth Callback] Unexpected error:', err)
    return NextResponse.redirect(new URL('/?error=auth_failed', request.url))
  }
}
