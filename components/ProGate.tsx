'use client'

import { ReactNode, useState } from 'react'
import { useSubscriptionStore } from '@/lib/subscriptionStore'
import { useAuth } from '@/components/Providers'
import { Sparkles, Check, Loader2 } from 'lucide-react'
import { supabaseAuth } from '@/lib/auth'

const PRO_FEATURES = [
  'AI assistant for your calendar & tasks',
  'Google Calendar sync',
  'Journal & reflection tools',
  'Wellbeing tracking (PERMA model)',
]

function UpgradeBanner() {
  const [interval, setInterval] = useState<'monthly' | 'yearly'>('yearly')
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()

  const handleUpgrade = async () => {
    if (!user) return
    setLoading(true)
    try {
      const token = supabaseAuth.currentAccessToken
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ interval }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center w-12 h-12 bg-accent-primary/10 rounded-apple-xl mb-4 mx-auto">
          <Sparkles className="w-6 h-6 text-accent-primary" />
        </div>
        <h2 className="text-xl font-bold text-text-primary text-center mb-1">Upgrade to Pro</h2>
        <p className="text-sm text-text-tertiary text-center mb-6">Unlock powerful features to supercharge your productivity</p>

        <ul className="space-y-2 mb-6">
          {PRO_FEATURES.map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm text-text-primary">
              <Check className="w-4 h-4 text-accent-primary flex-shrink-0" />
              {f}
            </li>
          ))}
        </ul>

        {/* Interval toggle */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <button
            onClick={() => setInterval('monthly')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              interval === 'monthly'
                ? 'bg-accent-primary text-white'
                : 'bg-surface-secondary text-text-tertiary'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setInterval('yearly')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              interval === 'yearly'
                ? 'bg-accent-primary text-white'
                : 'bg-surface-secondary text-text-tertiary'
            }`}
          >
            Yearly
            <span className="ml-1.5 text-xs bg-success/20 text-success px-1.5 py-0.5 rounded-full">-33%</span>
          </button>
        </div>

        <p className="text-center text-text-tertiary text-sm mb-4">
          {interval === 'monthly' ? '$5.99 / month' : '$47.99 / year · ~$4/mo'}
        </p>

        <button
          onClick={handleUpgrade}
          disabled={loading}
          className="w-full btn-primary flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {loading ? 'Redirecting...' : 'Upgrade to Pro'}
        </button>
      </div>
    </div>
  )
}

interface ProGateProps {
  children: ReactNode
  fallback?: ReactNode
}

export function ProGate({ children, fallback }: ProGateProps) {
  const { plan, status, loading } = useSubscriptionStore()
  const isPro = plan === 'pro' && (status === 'active' || status === 'trialing')

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-6 h-6 animate-spin text-text-tertiary" />
      </div>
    )
  }

  if (!isPro) return <>{fallback ?? <UpgradeBanner />}</>
  return <>{children}</>
}
