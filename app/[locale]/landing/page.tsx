'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/components/Providers'
import { getSupabaseClient, getURL } from '@/lib/supabase'
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
  const t = useTranslations('landing')
  const tc = useTranslations('common')
  const router = useRouter()
  const [showAuth, setShowAuth] = useState(false)
  const [showLogoutBanner, setShowLogoutBanner] = useState(false)
  const [showWaitlist, setShowWaitlist] = useState(false)
  const [waitlistEmail, setWaitlistEmail] = useState('')
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false)
  const [waitlistLoading, setWaitlistLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', ''])
  const [isVerifying, setIsVerifying] = useState(false)
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])
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

  const handleSendOtp = async () => {
    if (!email) {
      setError(t('errorNoEmail'))
      return
    }

    setError('')
    setIsLoading(true)

    try {
      const supabase = getSupabaseClient()
      const { error } = await supabase.auth.signInWithOtp({
        email,
      })

      if (error) {
        setError(error.message || 'Failed to send code')
      } else {
        setOtpSent(true)
        setOtpCode(['', '', '', '', '', ''])
        setTimeout(() => otpRefs.current[0]?.focus(), 100)
      }
    } catch (err) {
      console.error('OTP send error:', err)
      setError(tc('error'))
    }

    setIsLoading(false)
  }

  const handleVerifyOtp = async (code?: string[]) => {
    const digits = code || otpCode
    const token = digits.join('')
    if (token.length !== 6) {
      setError(t('errorIncompleteCode'))
      return
    }

    setError('')
    setIsVerifying(true)

    try {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email',
      })

      if (error) {
        setError(error.message || t('errorInvalidCode'))
      } else if (data.session) {
        localStorage.setItem('supabase_session', JSON.stringify({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          user: data.session.user,
        }))
        window.dispatchEvent(new Event('auth-state-change'))
        router.replace('/app/reminders')
      }
    } catch (err) {
      console.error('OTP verify error:', err)
      setError(tc('error'))
    }

    setIsVerifying(false)
  }

  const handleOtpInput = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste: distribute digits across inputs
      const digits = value.replace(/\D/g, '').slice(0, 6).split('')
      const newCode = [...otpCode]
      digits.forEach((d, i) => {
        if (index + i < 6) newCode[index + i] = d
      })
      setOtpCode(newCode)
      const nextIndex = Math.min(index + digits.length, 5)
      otpRefs.current[nextIndex]?.focus()
      if (newCode.every(d => d !== '')) {
        handleVerifyOtp(newCode)
      }
      return
    }

    const digit = value.replace(/\D/g, '')
    const newCode = [...otpCode]
    newCode[index] = digit
    setOtpCode(newCode)

    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus()
    }

    if (newCode.every(d => d !== '')) {
      handleVerifyOtp(newCode)
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  const handleGoogleSignIn = () => {
    const redirectTo = getURL()
    const supabase = getSupabaseClient()
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        scopes: 'email profile',
      },
    })
  }

  const handleWaitlistSubmit = async () => {
    if (!waitlistEmail) return
    
    setWaitlistLoading(true)
    try {
      const supabase = getSupabaseClient()
      const { error } = await supabase
        .from('mobile_waitlist')
        .insert({ email: waitlistEmail })
      
      if (error) {
        console.error('Waitlist error:', error)
      } else {
        setWaitlistSubmitted(true)
      }
    } catch (err) {
      console.error('Waitlist error:', err)
    }
    setWaitlistLoading(false)
  }

  return (
    <div className="min-h-screen bg-background-primary">
      {showLogoutBanner && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 bg-success text-white px-6 py-3 rounded-apple-lg shadow-apple-lg animate-slide-down">
          <p className="text-sm font-medium">{t('loggedOut')}</p>
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
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowWaitlist(true)}
              className="btn-primary md:hidden"
            >
              {t('getMobileApp')}
            </button>
            <button
              onClick={() => setShowAuth(true)}
              className="btn-primary hidden md:block"
            >
              {t('getStarted')}
            </button>
          </div>
        </div>
      </header>

      <main className="pt-24">
        <section className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-accent-primary/10 text-accent-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              {t('badge')}
            </div>
            <h1 className="text-5xl md:text-7xl font-semibold text-text-primary mb-6 leading-tight">
              {t('heroTitle1')}<br />
              <span className="text-accent-primary">{t('heroTitle2')}</span>
            </h1>
            <p className="text-xl text-text-secondary mb-10 max-w-2xl mx-auto">
              {t('heroDesc')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setShowAuth(true)}
                className="btn-primary text-lg px-8 py-3 hidden md:inline-flex"
              >
                {t('tryFree')}
                <ArrowRight className="w-5 h-5 ml-2 inline" />
              </button>
              <button
                onClick={() => setShowWaitlist(true)}
                className="btn-primary text-lg px-8 py-3 md:hidden inline-flex"
              >
                {t('getMobileApp')}
                <ArrowRight className="w-5 h-5 ml-2 inline" />
              </button>
            </div>
          </div>

          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Focus className="w-8 h-8 text-accent-primary" />}
              title={t('featureFocusTitle')}
              description={t('featureFocusDesc')}
            />
            <FeatureCard
              icon={<Target className="w-8 h-8 text-success" />}
              title={t('featureOkrTitle')}
              description={t('featureOkrDesc')}
            />
            <FeatureCard
              icon={<BookOpen className="w-8 h-8 text-action-warning" />}
              title={t('featureFearTitle')}
              description={t('featureFearDesc')}
            />
          </div>
        </section>

        <section className="bg-surface-secondary py-20">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-3xl font-semibold text-center text-text-primary mb-12">{t('everythingTitle')}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <FeatureGridItem icon={<Clock className="w-6 h-6" />} label={t('gridPomodoro')} />
              <FeatureGridItem icon={<Calendar className="w-6 h-6" />} label={t('gridCalendar')} />
              <FeatureGridItem icon={<Bell className="w-6 h-6" />} label={t('gridReminders')} />
              <FeatureGridItem icon={<BookOpen className="w-6 h-6" />} label={t('gridJournal')} />
              <FeatureGridItem icon={<Target className="w-6 h-6" />} label={t('gridObjectives')} />
              <FeatureGridItem icon={<TrendingUp className="w-6 h-6" />} label={t('gridFearSetting')} />
              <FeatureGridItem icon={<CheckCircle2 className="w-6 h-6" />} label={t('gridHabits')} />
              <FeatureGridItem icon={<Sparkles className="w-6 h-6" />} label={t('gridAI')} />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border-primary py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-text-tertiary">
            {t('footerRights')}
          </p>
          <div className="flex items-center gap-6 text-sm">
            <a href="/privacy" className="text-text-tertiary hover:text-text-primary transition-colors">{t('footerPrivacy')}</a>
            <a href="/terms" className="text-text-tertiary hover:text-text-primary transition-colors">{t('footerTerms')}</a>
          </div>
        </div>
      </footer>

      {showAuth && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-primary rounded-apple-xl shadow-apple-xl p-8 w-full max-w-md animate-scale-in">
            {!otpSent ? (
              <>
                <div className="text-center mb-8">
                  <div className="w-12 h-12 bg-accent-primary rounded-apple-xl flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-semibold text-text-primary">
                    {t('authTitle')}
                  </h2>
                  <p className="text-text-secondary mt-1">
                    {t('authSubtitle')}
                  </p>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-action-danger/10 text-action-danger rounded-apple-lg text-sm">
                    {error}
                  </div>
                )}

                <div className="mb-6">
                  <label className="block text-sm font-medium text-text-secondary mb-1">{t('authEmail')}</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input"
                    placeholder="you@example.com"
                    onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
                  />
                </div>

                <button
                  onClick={handleSendOtp}
                  className="btn-primary w-full mb-4 disabled:opacity-50 flex items-center justify-center gap-2"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {t('authSending')}
                    </>
                  ) : t('authContinue')}
                </button>

                <div className="relative mb-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border-primary" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-surface-primary text-text-tertiary">{t('authOr')}</span>
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
              <div className="text-center py-4">
                <div className="w-12 h-12 bg-accent-primary rounded-apple-xl flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-semibold text-text-primary mb-2">
                  {t('otpTitle')}
                </h2>
                <p className="text-text-secondary mb-6">
                  {t('otpDesc')} <span className="font-medium text-text-primary">{email}</span>
                </p>

                {error && (
                  <div className="mb-4 p-3 bg-action-danger/10 text-action-danger rounded-apple-lg text-sm">
                    {error}
                  </div>
                )}

                <div className="flex justify-center gap-2 mb-6">
                  {otpCode.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { otpRefs.current[i] = el }}
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={digit}
                      onChange={(e) => handleOtpInput(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className="w-11 h-13 text-center text-xl font-semibold border border-border-primary rounded-apple-lg focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 outline-none bg-surface-primary text-text-primary transition-colors"
                    />
                  ))}
                </div>

                <button
                  onClick={() => handleVerifyOtp()}
                  className="btn-primary w-full mb-4 disabled:opacity-50 flex items-center justify-center gap-2"
                  disabled={isVerifying}
                >
                  {isVerifying ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {t('otpVerifying')}
                    </>
                  ) : t('otpVerify')}
                </button>

                <div className="flex items-center justify-center gap-4 text-sm">
                  <button
                    onClick={() => { setError(''); handleSendOtp(); }}
                    className="text-accent-primary font-medium hover:underline"
                    disabled={isLoading}
                  >
                    {isLoading ? t('otpSending') : t('otpResend')}
                  </button>
                  <span className="text-text-tertiary">|</span>
                  <button
                    onClick={() => { setOtpSent(false); setOtpCode(['', '', '', '', '', '']); setError(''); }}
                    className="text-accent-primary font-medium hover:underline"
                  >
                    {t('otpDifferentEmail')}
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={() => { setShowAuth(false); setOtpSent(false); setOtpCode(['', '', '', '', '', '']); setError(''); setEmail(''); }}
              className="absolute top-4 right-4 text-text-tertiary hover:text-text-primary transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {showWaitlist && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-primary rounded-apple-xl shadow-apple-xl p-8 w-full max-w-md animate-scale-in">
            {!waitlistSubmitted ? (
              <>
                <div className="text-center mb-8">
                  <div className="w-12 h-12 bg-accent-primary rounded-apple-xl flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-semibold text-text-primary">
                    {t('waitlistTitle')}
                  </h2>
                  <p className="text-text-secondary mt-1">
                    {t('waitlistSubtitle')}
                  </p>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-text-secondary mb-1">{t('authEmail')}</label>
                  <input
                    type="email"
                    value={waitlistEmail}
                    onChange={(e) => setWaitlistEmail(e.target.value)}
                    className="input"
                    placeholder="you@example.com"
                    onKeyDown={(e) => e.key === 'Enter' && handleWaitlistSubmit()}
                  />
                </div>

                <button 
                  onClick={handleWaitlistSubmit} 
                  className="btn-primary w-full disabled:opacity-50 flex items-center justify-center gap-2"
                  disabled={waitlistLoading || !waitlistEmail}
                >
                  {waitlistLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {t('waitlistSubmitting')}
                    </>
                  ) : t('waitlistNotify')}
                </button>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="w-8 h-8 text-success" />
                </div>
                <h2 className="text-2xl font-semibold text-text-primary mb-3">
                  {t('waitlistSuccessTitle')}
                </h2>
                <p className="text-text-secondary mb-6">
                  {t('waitlistSuccessDesc')}
                </p>
                <button
                  onClick={() => { setShowWaitlist(false); setWaitlistSubmitted(false); setWaitlistEmail(''); }}
                  className="btn-primary"
                >
                  {t('waitlistDone')}
                </button>
              </div>
            )}

            <button
              onClick={() => { setShowWaitlist(false); setWaitlistSubmitted(false); setWaitlistEmail(''); }}
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
