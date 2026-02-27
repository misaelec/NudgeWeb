import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const errorDescription = requestUrl.searchParams.get('error_description')
  const errorCode = requestUrl.searchParams.get('error_code')

  // Handle OAuth / OTP errors
  if (errorDescription || errorCode) {
    const msg = errorDescription || errorCode || 'auth_failed'
    return NextResponse.redirect(
      new URL(`/landing?error=${encodeURIComponent(msg)}`, requestUrl.origin)
    )
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/landing?error=no_code', requestUrl.origin)
    )
  }

  // Create a server Supabase client that reads the PKCE code_verifier from cookies
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignore — will be set on the response below
          }
        },
      },
    }
  )

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.session) {
    console.error('[AuthCallback] Exchange failed:', error?.message)
    return NextResponse.redirect(
      new URL(`/landing?error=${encodeURIComponent(error?.message || 'auth_failed')}`, requestUrl.origin)
    )
  }

  // Pass tokens to the client-side /auth/complete page which stores them in localStorage
  const session = data.session
  const completeUrl = new URL('/auth/complete', requestUrl.origin)
  completeUrl.searchParams.set('access_token', session.access_token)
  completeUrl.searchParams.set('refresh_token', session.refresh_token)

  return NextResponse.redirect(completeUrl)
}
