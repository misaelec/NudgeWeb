'use client'

import { useEffect, useState } from 'react'
import { getSupabaseClient } from '@/lib/supabase'
import { Sparkles, Loader2 } from 'lucide-react'

export default function AuthCallback() {
  console.log('[AuthCallback] ===== PAGE RENDERING =====')
  const [status, setStatus] = useState('Processing your sign in...')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    console.log('[AuthCallback] Component mounted')
    
    const supabase = getSupabaseClient()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[AuthCallback] Auth event:', event, session ? 'has session' : 'no session')
      
      if (event === 'SIGNED_IN' && session) {
        console.log('[AuthCallback] Session established, redirecting to dashboard')
        window.location.href = '/app/reminders'
      }
    })

    const checkSession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('[AuthCallback] Session error:', sessionError)
          setError(sessionError.message)
          return
        }
        
        if (session) {
          console.log('[AuthCallback] Session found, redirecting')
          window.location.href = '/app/reminders'
        } else {
          console.log('[AuthCallback] No session, waiting for auth...')
        }
      } catch (err) {
        console.error('[AuthCallback] Error checking session:', err)
      }
    }

    checkSession()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return (
    <div className="min-h-screen bg-background-primary flex items-center justify-center p-4">
      <div className="text-center max-w-md w-full">
        <div className="w-16 h-16 bg-accent-primary rounded-apple-xl flex items-center justify-center mx-auto mb-6 shadow-apple">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        
        {error ? (
          <>
            <h1 className="text-xl font-semibold text-text-primary mb-2">Authentication Failed</h1>
            <p className="text-text-tertiary mb-4">{error}</p>
            <a href="/landing" className="btn-primary inline-block">
              Return to Home
            </a>
          </>
        ) : (
          <>
            <h1 className="text-xl font-semibold text-text-primary mb-2">Signing you in</h1>
            <div className="flex items-center justify-center gap-2 text-text-tertiary">
              <Loader2 className="w-5 h-5 animate-spin" />
              <p>{status}</p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
