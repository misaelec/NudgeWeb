'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function AuthCompleteContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState('Processing...')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    console.log('[AuthComplete] Component mounted, searchParams:', searchParams.toString())
    
    const accessToken = searchParams.get('access_token')
    const refreshToken = searchParams.get('refresh_token')
    const errorDescription = searchParams.get('error_description')

    console.log('[AuthComplete] accessToken:', !!accessToken, 'refreshToken:', !!refreshToken)

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

    const session = {
      access_token: accessToken,
      refresh_token: refreshToken || '',
    }
    console.log('[AuthComplete] Storing session to localStorage')
    localStorage.setItem('supabase_session', JSON.stringify(session))

    fetch('https://tdidckvdawyctcswoppi.supabase.co/auth/v1/user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'apikey': 'sb_publishable_4HHk7Qa7gY-Qnoa8dbCa6Q_ZnebZgQJ',
      },
    })
      .then(res => res.json())
      .then(user => {
        console.log('[AuthComplete] User fetched:', user?.id)
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
        
        console.log('[AuthComplete] Dispatching auth event')
        window.dispatchEvent(new Event('auth-state-change'))
        
        // Use hard navigation to force fresh state
        window.location.href = '/app/reminders'
      })
      .catch(err => {
        console.error('[AuthComplete] Failed to get user:', err)
        console.log('[AuthComplete] Dispatching auth event anyway')
        window.dispatchEvent(new Event('auth-state-change'))
        
        // Use hard navigation to force fresh state  
        window.location.href = '/app/reminders'
      })
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background-primary)' }}>
      <div className="text-center">
        <div className="w-12 h-12 border-4 rounded-full animate-spin mx-auto mb-4" style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }} />
        <p style={{ color: 'var(--text-primary)' }}>{status}</p>
        {error && (
          <p className="mt-2" style={{ color: 'var(--action-danger)' }}>{error}</p>
        )}
      </div>
    </div>
  )
}

export default function AuthComplete() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background-primary)' }}>
        <div className="w-12 h-12 border-4 rounded-full animate-spin" style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }} />
      </div>
    }>
      <AuthCompleteContent />
    </Suspense>
  )
}
