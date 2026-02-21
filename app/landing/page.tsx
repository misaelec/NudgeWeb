'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/Providers'
import {
  Focus,
  Calendar,
  Bell,
  BookOpen,
  Target,
  TrendingUp,
  Clock,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  X,
} from 'lucide-react'

export default function LandingPage() {
  const router = useRouter()
  const [showAuth, setShowAuth] = useState(false)
  const [showLogoutBanner, setShowLogoutBanner] = useState(false)
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      router.replace('/app/reminders')
    }
  }, [user, router])

  useEffect(() => {
    const loggedOut = sessionStorage.getItem('logged_out')
    if (loggedOut === 'true') {
      setShowLogoutBanner(true)
      sessionStorage.removeItem('logged_out')
      setTimeout(() => setShowLogoutBanner(false), 3000)
    }
  }, [])

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

  const handleMagicLink = async () => {
    if (!email) {
      setError('Please enter your email address')
      return
    }

    setError('')
    setIsLoading(true)

    try {
      const res = await fetch(`${supabaseUrl}/auth/v1/otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
        },
        body: JSON.stringify({
          email,
          options: {
            emailRedirectTo: window.location.origin,
          },
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setMagicLinkSent(true)
      } else {
        setError(data.msg || 'Failed to send magic link. Please try again.')
      }
    } catch (err) {
      console.error('Magic link error:', err)
      setError('Something went wrong. Please try again.')
    }

    setIsLoading(false)
  }

  const handleGoogleSignIn = () => {
    const redirectTo = `${window.location.origin}/auth/callback`
    const googleAuthUrl = `${supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectTo)}`
    window.location.href = googleAuthUrl
  }

  return (
    <div className="min-h-screen bg-background-primary">
      {showLogoutBanner && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 bg-success text-white px-6 py-3 rounded-apple-lg shadow-apple-lg animate-slide-down">
          <p className="text-sm font-medium">You have been logged out successfully</p>
        </div>
      )}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background-primary/80 backdrop-blur-lg border-b border-border-primary">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent-primary rounded-apple-xl flex items-center justify-center shadow-apple">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold text-text-primary">Nudge</span>
          </div>
          <button
            onClick={() => setShowAuth(true)}
            className="btn-primary"
          >
            Get Started
          </button>
        </div>
      </header>

      <main className="pt-24">
        <section className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-accent-primary/10 text-accent-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              Your Personal Growth Companion
            </div>
            <h1 className="text-5xl md:text-7xl font-semibold text-text-primary mb-6 leading-tight">
              Achieve More.<br />
              <span className="text-accent-primary">Stress Less.</span>
            </h1>
            <p className="text-xl text-text-secondary mb-10 max-w-2xl mx-auto">
              Nudge combines focus techniques, goal tracking, and self-reflection
              tools to help you become your best self.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setShowAuth(true)}
                className="btn-primary text-lg px-8 py-3"
              >
                Try Nudge Free
                <ArrowRight className="w-5 h-5 ml-2 inline" />
              </button>
            </div>
          </div>

          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Focus className="w-8 h-8 text-accent-primary" />}
              title="Focus Mode"
              description="Pomodoro timer with app blocking to help you stay in the zone."
            />
            <FeatureCard
              icon={<Target className="w-8 h-8 text-success" />}
              title="OKR Tracking"
              description="Set objectives and track key results to achieve your goals."
            />
            <FeatureCard
              icon={<BookOpen className="w-8 h-8 text-action-warning" />}
              title="Fear Setting"
              description="Address your fears with Tim Ferriss proven methodology."
            />
          </div>
        </section>

        <section className="bg-surface-secondary py-20">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-3xl font-semibold text-center text-text-primary mb-12">Everything You Need</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <FeatureGridItem icon={<Clock className="w-6 h-6" />} label="Pomodoro Timer" />
              <FeatureGridItem icon={<Calendar className="w-6 h-6" />} label="Calendar" />
              <FeatureGridItem icon={<Bell className="w-6 h-6" />} label="Reminders" />
              <FeatureGridItem icon={<BookOpen className="w-6 h-6" />} label="Journal" />
              <FeatureGridItem icon={<Target className="w-6 h-6" />} label="Objectives" />
              <FeatureGridItem icon={<TrendingUp className="w-6 h-6" />} label="Fear Setting" />
              <FeatureGridItem icon={<CheckCircle2 className="w-6 h-6" />} label="Habits" />
              <FeatureGridItem icon={<Sparkles className="w-6 h-6" />} label="AI Insights" />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border-primary py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-text-tertiary">
            © 2026 Nudge. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm">
            <a href="/privacy" className="text-text-tertiary hover:text-text-primary transition-colors">Privacy Policy</a>
            <a href="/terms" className="text-text-tertiary hover:text-text-primary transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>

      {showAuth && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-primary rounded-apple-xl shadow-apple-xl p-8 w-full max-w-md animate-scale-in">
            {!magicLinkSent ? (
              <>
                <div className="text-center mb-8">
                  <div className="w-12 h-12 bg-accent-primary rounded-apple-xl flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-semibold text-text-primary">
                    Welcome to Nudge
                  </h2>
                  <p className="text-text-secondary mt-1">
                    Enter your email to get started
                  </p>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-action-danger/10 text-action-danger rounded-apple-lg text-sm">
                    {error}
                  </div>
                )}

                <div className="mb-6">
                  <label className="block text-sm font-medium text-text-secondary mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input"
                    placeholder="you@example.com"
                    onKeyDown={(e) => e.key === 'Enter' && handleMagicLink()}
                  />
                </div>

                <button 
                  onClick={handleMagicLink} 
                  className="btn-primary w-full mb-4 disabled:opacity-50 flex items-center justify-center gap-2"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending magic link...
                    </>
                  ) : 'Continue with Email'}
                </button>

                <div className="relative mb-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border-primary" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-surface-primary text-text-tertiary">Or continue with</span>
                  </div>
                </div>

                <button
                  onClick={handleGoogleSignIn}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-border-primary rounded-apple-lg hover:bg-surface-secondary transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span className="text-text-primary font-medium">Google</span>
                </button>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="w-8 h-8 text-success" />
                </div>
                <h2 className="text-2xl font-semibold text-text-primary mb-3">
                  ✨ Magic link sent!
                </h2>
                <p className="text-text-secondary mb-6">
                  Check your inbox to sign in or create your account.
                </p>
                <button
                  onClick={() => { setMagicLinkSent(false); setEmail(''); }}
                  className="text-accent-primary font-medium hover:underline"
                >
                  Use a different email
                </button>
              </div>
            )}

            <button
              onClick={() => { setShowAuth(false); setMagicLinkSent(false); setError(''); setEmail(''); }}
              className="absolute top-4 right-4 text-text-tertiary hover:text-text-primary transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function FeatureCard({ icon, title, description }: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="card text-center hover:shadow-apple-lg transition-shadow">
      <div className="w-16 h-16 bg-surface-secondary rounded-apple-xl flex items-center justify-center mx-auto mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-text-primary mb-2">{title}</h3>
      <p className="text-text-secondary text-sm">{description}</p>
    </div>
  )
}

function FeatureGridItem({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <div className="w-12 h-12 bg-surface-secondary rounded-apple-xl flex items-center justify-center">
        {icon}
      </div>
      <span className="text-sm text-text-secondary">{label}</span>
    </div>
  )
}
