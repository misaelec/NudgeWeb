import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  
  // Check for error params
  const errorDescription = requestUrl.searchParams.get('error_description')
  const errorCode = requestUrl.searchParams.get('error_code')
  
  if (errorDescription || errorCode) {
    console.log('[Callback] OAuth error:', errorDescription || errorCode)
    const redirectUrl = new URL('/landing', request.url)
    redirectUrl.searchParams.set('error', errorDescription || errorCode || 'auth_failed')
    return NextResponse.redirect(redirectUrl)
  }

  // Check for hash fragment with tokens (default Supabase OAuth flow)
  const hash = requestUrl.hash.substring(1)
  if (hash) {
    const params = new URLSearchParams(hash)
    const accessToken = params.get('access_token')
    const refreshToken = params.get('refresh_token')
    const expiresIn = params.get('expires_in')
    
    if (accessToken && refreshToken) {
      console.log('[Callback] Got tokens from hash fragment')
      
      const clientUrl = new URL('/auth/complete', request.url)
      clientUrl.searchParams.set('access_token', accessToken)
      clientUrl.searchParams.set('refresh_token', refreshToken)
      if (expiresIn) {
        clientUrl.searchParams.set('expires_in', expiresIn)
      }
      
      // Clear the hash before redirecting
      return NextResponse.redirect(clientUrl)
    }
  }

  // Check for PKCE code
  const code = requestUrl.searchParams.get('code')
  if (!code) {
    console.log('[Callback] No code or tokens found')
    return NextResponse.redirect(new URL('/landing?error=no_code', request.url))
  }

  // Exchange code for tokens (PKCE flow)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  try {
    console.log('[Callback] Exchanging code for tokens...')
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
      return NextResponse.redirect(new URL('/landing?error=auth_failed', request.url))
    }

    console.log('[Callback] Success! User ID:', tokenData.user?.id)

    const clientUrl = new URL('/auth/complete', request.url)
    clientUrl.searchParams.set('access_token', tokenData.access_token)
    if (tokenData.refresh_token) {
      clientUrl.searchParams.set('refresh_token', tokenData.refresh_token)
    }
    if (tokenData.expires_in) {
      clientUrl.searchParams.set('expires_in', String(tokenData.expires_in))
    }

    return NextResponse.redirect(clientUrl)
  } catch (err) {
    console.log('[Callback] Exception:', err)
    return NextResponse.redirect(new URL('/landing?error=auth_failed', request.url))
  }
}
