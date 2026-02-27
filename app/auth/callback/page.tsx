'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase'

function AuthCallbackContent() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState('Authenticating...')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code')
      const errorDescription = searchParams.get('error_description')
      const errorCode = searchParams.get('error_code')

      if (errorDescription || errorCode) {
        const msg = errorDescription || errorCode || 'Authentication failed'
        setError(msg)
        setTimeout(() => {
          window.location.href = `/landing?error=${encodeURIComponent(msg)}`
        }, 1500)
        return
      }

      if (!code) {
        // No code in query params — check if Supabase client auto-detected the session
        // (e.g. hash fragment from implicit flow or magic link)
        const supabase = getSupabaseClient()
        const { data: { session } } = await supabase.auth.getSession()

        if (session) {
          storeSessionAndRedirect(session)
          return
        }

        setError('No authentication code received')
        setTimeout(() => {
          window.location.href = '/landing?error=no_code'
        }, 1500)
        return
      }

      try {
        setStatus('Completing sign in...')
        const supabase = getSupabaseClient()
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

        if (exchangeError) {
          console.error('[AuthCallback] Code exchange failed:', exchangeError.message)
          setError(exchangeError.message)
          setTimeout(() => {
            window.location.href = `/landing?error=${encodeURIComponent(exchangeError.message)}`
          }, 1500)
          return
        }

        if (data.session) {
          storeSessionAndRedirect(data.session)
        }
      } catch (err) {
        console.error('[AuthCallback] Exception:', err)
        setError('Something went wrong during authentication')
        setTimeout(() => {
          window.location.href = '/landing?error=auth_failed'
        }, 1500)
      }
    }

    handleCallback()
  }, [searchParams])

  function storeSessionAndRedirect(session: { access_token: string; refresh_token: string; user: any }) {
    const user = session.user
    const storedSession = {
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      user: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.display_name || user.user_metadata?.name || user.email?.split('@')[0],
        avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture,
      },
    }
    localStorage.setItem('supabase_session', JSON.stringify(storedSession))
    window.dispatchEvent(new Event('auth-state-change'))

    setStatus('Success! Redirecting...')
    window.location.href = '/app/reminders'
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background-primary)' }}>
      <div className="text-center">
        <div
          className="w-12 h-12 border-4 rounded-full animate-spin mx-auto mb-4"
          style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }}
        />
        <p style={{ color: 'var(--text-primary)' }}>{status}</p>
        {error && (
          <p className="mt-2 text-sm" style={{ color: 'var(--action-danger)' }}>{error}</p>
        )}
      </div>
    </div>
  )
}

export default function AuthCallback() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background-primary)' }}>
          <div
            className="w-12 h-12 border-4 rounded-full animate-spin"
            style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }}
          />
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  )
}
