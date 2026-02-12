'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseAuth } from '@/lib/auth'
import { Sparkles } from 'lucide-react'

export default function AuthCallback() {
  const router = useRouter()
  const [status, setStatus] = useState('Processing your sign in...')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const result = await supabaseAuth.handleCallback()
        
        if (result.success) {
          setStatus('Success! Redirecting...')
          setTimeout(() => {
            router.push('/')
          }, 1000)
        } else {
          setError(result.error || 'Authentication failed')
        }
      } catch (err) {
        setError('An unexpected error occurred')
      }
    }

    handleCallback()
  }, [router])

  return (
    <div className="min-h-screen bg-background-primary flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-accent-primary rounded-apple-xl flex items-center justify-center mx-auto mb-6 shadow-apple">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        
        {error ? (
          <>
            <h1 className="text-xl font-semibold text-text-primary mb-2">Authentication Failed</h1>
            <p className="text-text-tertiary mb-6">{error}</p>
            <a href="/" className="btn-primary">
              Return to Home
            </a>
          </>
        ) : (
          <>
            <h1 className="text-xl font-semibold text-text-primary mb-2">Signing you in</h1>
            <p className="text-text-tertiary animate-pulse">{status}</p>
          </>
        )}
      </div>
    </div>
  )
}
