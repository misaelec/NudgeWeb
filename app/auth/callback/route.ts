import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const errorDescription = requestUrl.searchParams.get('error_description')
  const errorCode = requestUrl.searchParams.get('error_code')

  console.log('[Callback] Code:', !!code, 'Error:', errorDescription || errorCode)

  if (!code) {
    return NextResponse.redirect(new URL('/?error=no_code', request.url))
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  try {
    const tokenResponse = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=pkce`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': anonKey!,
      },
      body: JSON.stringify({ code }),
    })

    const tokenData = await tokenResponse.json()

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.log('[Callback] Token exchange failed:', tokenData)
      return NextResponse.redirect(new URL('/?error=auth_failed', request.url))
    }

    console.log('[Callback] Success! User ID:', tokenData.user?.id)

    // Create response with redirect
    const response = NextResponse.redirect(new URL('/app/reminders', request.url))

    // Set server-side cookies (HttpOnly, secure)
    response.cookies.set('sb-access-token', tokenData.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: tokenData.expires_in,
      path: '/',
    })

    if (tokenData.refresh_token) {
      response.cookies.set('sb-refresh-token', tokenData.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
      })
    }

    return response
  } catch (err) {
    console.log('[Callback] Exception:', err)
    return NextResponse.redirect(new URL('/?error=auth_failed', request.url))
  }
}
