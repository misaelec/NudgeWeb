'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { getSupabaseClient, supabaseConfig } from '@/lib/supabase'

function AuthCompleteContent() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState('Processing...')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const accessToken = searchParams.get('access_token')
    const refreshToken = searchParams.get('refresh_token')
    const errorDescription = searchParams.get('error_description')

    if (errorDescription) {
      setError(errorDescription)
      return
    }

    if (!accessToken) {
      // Try to recover session from the Supabase client (e.g. auto-detected from URL hash)
      const supabase = getSupabaseClient()
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          storeAndRedirect(session)
        } else {
          setError('No tokens received')
        }
      })
      return
    }

    setStatus('Setting up your session...')

    // Set the session on the Supabase client and let it handle validation
    const supabase = getSupabaseClient()
    supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken || '',
    }).then(({ data, error: sessionError }) => {
      if (sessionError || !data.session) {
        // Fallback: manually fetch user info
        fetch(`${supabaseConfig.projectUrl}/auth/v1/user`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'apikey': supabaseConfig.anonKey,
          },
        })
          .then(res => res.json())
          .then(user => {
            if (user.id) {
              const fullSession = {
                access_token: accessToken,
                refresh_token: refreshToken || '',
                user: {
                  id: user.id,
                  email: user.email,
                  name: user.user_metadata?.display_name || user.user_metadata?.name || user.email?.split('@')[0],
                  avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture,
                },
              }
              localStorage.setItem('supabase_session', JSON.stringify(fullSession))
            }
            window.dispatchEvent(new Event('auth-state-change'))
            window.location.href = '/app/reminders'
          })
          .catch(() => {
            window.dispatchEvent(new Event('auth-state-change'))
            window.location.href = '/app/reminders'
          })
        return
      }

      storeAndRedirect(data.session)
    })
  }, [searchParams])

  function storeAndRedirect(session: { access_token: string; refresh_token: string; user: any }) {
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
        <div className="w-12 h-12 border-4 rounded-full animate-spin mx-auto mb-4" style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }} />
        <p style={{ color: 'var(--text-primary)' }}>{status}</p>
        {error && (
          <p className="mt-2 text-sm" style={{ color: 'var(--action-danger)' }}>{error}</p>
        )}
      </div>
    </div>
  )
}

export default function AuthComplete() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background-primary)' }}>
          <div className="w-12 h-12 border-4 rounded-full animate-spin" style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }} />
        </div>
      }
    >
      <AuthCompleteContent />
    </Suspense>
  )
}
