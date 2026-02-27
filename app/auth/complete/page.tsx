'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function AuthComplete() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState('Processing...')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const accessToken = searchParams.get('access_token')
    const refreshToken = searchParams.get('refresh_token')
    const errorDescription = searchParams.get('error_description')

    if (errorDescription) {
      setError(errorDescription)
      setStatus('Error')
      return
    }

    if (!accessToken) {
      setError('No tokens received')
      setStatus('Error')
      return
    }

    setStatus('Setting up your session...')

    // Store session in localStorage
    const session = {
      access_token: accessToken,
      refresh_token: refreshToken || '',
    }
    localStorage.setItem('supabase_session', JSON.stringify(session))

    // Fetch user info and store
    fetch('https://tdidckvdawyctcswoppi.supabase.co/auth/v1/user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'apikey': 'sb_publishable_4HHk7Qa7gY-Qnoa8dbCa6Q_ZnebZgQJ',
      },
    })
      .then(res => res.json())
      .then(user => {
        if (user.id) {
          const fullSession = {
            ...session,
            user: {
              id: user.id,
              email: user.email,
              name: user.user_metadata?.display_name || user.user_metadata?.name || user.email?.split('@')[0],
              avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture,
            },
          }
          localStorage.setItem('supabase_session', JSON.stringify(fullSession))
        }
        
        // Dispatch event to notify AuthProvider
        window.dispatchEvent(new Event('auth-state-change'))
        
        // Redirect to app
        router.push('/app/reminders')
      })
      .catch(err => {
        console.error('Failed to get user:', err)
        // Still redirect even if user fetch fails
        window.dispatchEvent(new Event('auth-state-change'))
        router.push('/app/reminders')
      })
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-primary">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-accent-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-text-primary text-lg">{status}</p>
        {error && (
          <p className="text-action-danger mt-2">{error}</p>
        )}
      </div>
    </div>
  )
}
