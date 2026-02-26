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

  // Simple fetch to Supabase directly, skip the SSR client
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

    console.log('[Callback] Success! User ID from token:', tokenData.user?.id)

    // Redirect with success
    return NextResponse.redirect(new URL('/app/reminders', request.url))
  } catch (err) {
    console.log('[Callback] Exception:', err)
    return NextResponse.redirect(new URL('/?error=auth_failed', request.url))
  }
}
