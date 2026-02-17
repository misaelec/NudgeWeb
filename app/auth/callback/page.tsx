'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseAuth } from '@/lib/auth'
import { Sparkles, Loader2 } from 'lucide-react'

export default function AuthCallback() {
  const router = useRouter()
  const [status, setStatus] = useState('Processing your sign in...')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      const result = await supabaseAuth.handleCallback()
      
      if (result.success) {
        setStatus('Success! Redirecting...')
        window.location.href = '/app'
      } else {
        setError(result.error || 'Authentication failed')
      }
    }

    handleCallback()
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
