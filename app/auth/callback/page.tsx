'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseAuth } from '@/lib/auth'
import { getSupabaseClient } from '@/lib/supabase'
import { Sparkles, Loader2 } from 'lucide-react'

export default function AuthCallback() {
  console.log('[AuthCallback] ===== PAGE RENDERING =====')
  const router = useRouter()
  const [status, setStatus] = useState('Processing your sign in...')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    console.log('[AuthCallback] Component mounted, URL:', window.location.href)
    
    const supabase = getSupabaseClient()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[AuthCallback] Auth state changed:', event, session ? 'has session' : 'no session')
      
      if (event === 'SIGNED_IN' && session) {
        console.log('[AuthCallback] Signed in via event, redirecting to dashboard')
        window.location.href = '/app/reminders'
      }
    })

    const handleCallback = async () => {
      console.log('[AuthCallback] Starting callback handler')
      console.log('[AuthCallback] Full URL:', window.location.href)
      console.log('[AuthCallback] Search params:', window.location.search)
      console.log('[AuthCallback] Hash present:', !!window.location.hash)
      
      const result = await supabaseAuth.handleCallback()
      console.log('[AuthCallback] handleCallback result:', result)
      
      if (result.success) {
        setStatus('Success! Redirecting...')
        setTimeout(() => {
          window.location.href = '/app/reminders'
        }, 1500)
      } else {
        console.error('[AuthCallback] Auth failed:', result.error)
        setError(result.error || 'Authentication failed')
      }
    }

    const url = new URL(window.location.href)
    const code = url.searchParams.get('code')
    const hasHash = window.location.hash.includes('access_token')

    if (hasHash || code) {
      handleCallback()
    } else {
      console.error('[AuthCallback] No code or hash found, redirecting to landing')
      window.location.href = '/landing'
    }

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
