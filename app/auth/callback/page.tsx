'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseAuth } from '@/lib/auth'
import { Sparkles } from 'lucide-react'

export default function AuthCallback() {
  const router = useRouter()
  const [status, setStatus] = useState('Processing your sign in...')
  const [error, setError] = useState<string | null>(null)
  const [debug, setDebug] = useState<string | null>(null)
  const [hashPreview, setHashPreview] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      console.log('AuthCallback: Starting...')
      
      const hash = window.location.hash.substring(1)
      setHashPreview(hash.substring(0, 100) + '...')
      console.log('AuthCallback: Hash length:', hash.length)
      
      const result = await supabaseAuth.handleCallback()
      console.log('AuthCallback: Result:', result)
      
      if (result.success) {
        setStatus('Success! Redirecting...')
        console.log('AuthCallback: Redirecting to /')
        window.location.href = '/app'
      } else {
        setError(result.error || 'Authentication failed')
        console.error('AuthCallback: Error:', result.error)
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
            <div className="bg-surface-secondary p-4 rounded-lg mb-6 text-left">
              <p className="text-xs text-text-quaternary font-mono break-all">{hashPreview}</p>
            </div>
            <a href="/" className="btn-primary inline-block">
              Return to Home
            </a>
          </>
        ) : (
          <>
            <h1 className="text-xl font-semibold text-text-primary mb-2">Signing you in</h1>
            <p className="text-text-tertiary animate-pulse mb-4">{status}</p>
            <div className="bg-surface-secondary p-4 rounded-lg text-left">
              <p className="text-xs text-text-quaternary font-mono break-all">{hashPreview}</p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
