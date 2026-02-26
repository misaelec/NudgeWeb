import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const errorDescription = requestUrl.searchParams.get('error_description')
  const errorCode = requestUrl.searchParams.get('error_code')

  console.log('[Auth Callback] Full URL:', request.url)
  console.log('[Auth Callback] Code present:', !!code)
  console.log('[Auth Callback] Error:', errorDescription || errorCode)

  if (errorDescription || errorCode) {
    console.log('[Auth Callback] Redirecting to /?error=auth_failed')
    return NextResponse.redirect(new URL('/?error=auth_failed', request.url))
  }

  if (!code) {
    console.log('[Auth Callback] No code - redirecting to /?error=no_code')
    return NextResponse.redirect(new URL('/?error=no_code', request.url))
  }

  try {
    console.log('[Auth Callback] Creating supabase client...')
    const supabase = createSupabaseServerClient()
    console.log('[Auth Callback] Calling exchangeCodeForSession...')
    
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.log('[Auth Callback] Error:', error.message)
      return NextResponse.redirect(new URL('/?error=auth_failed', request.url))
    }

    console.log('[Auth Callback] SUCCESS! User:', data.user?.id)
    console.log('[Auth Callback] Redirecting to /app/reminders')
    return NextResponse.redirect(new URL('/app/reminders', request.url))
  } catch (err) {
    console.log('[Auth Callback] Exception:', err)
    return NextResponse.redirect(new URL('/?error=auth_failed', request.url))
  }
}
