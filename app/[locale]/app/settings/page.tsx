'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/Providers'
import { useStore } from '@/lib/store'
import { notificationService } from '@/lib/notifications'
import { settingsSyncService } from '@/lib/settingsSync'
import CalendarSettings from '@/components/settings/CalendarSettings'
import { useTranslations } from 'next-intl'
import { useSubscriptionStore } from '@/lib/subscriptionStore'
import { supabaseAuth } from '@/lib/auth'
import {
  Settings,
  Bell,
  Calendar,
  Clock,
  Shield,
  BookOpen,
  Target,
  TrendingUp,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  User,
  Mail,
  Lock,
  Moon,
  Sun,
  HelpCircle,
  LogOut,
  ChevronRight,
  Smartphone,
  BellOff,
  Zap,
  BarChart3,
  CreditCard,
  CheckCircle2,
  Loader2
} from 'lucide-react'

function Toggle({ enabled, onClick }: { enabled: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
        enabled ? 'bg-accent-primary' : 'bg-border-primary'
      }`}
    >
      <span
        className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform ${
          enabled ? 'translate-x-7' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

export default function SettingsPage() {
  const router = useRouter()
  const { user, loading, signOut } = useAuth()
  const t = useTranslations('settings')
  const tc = useTranslations('common')
  const { settingsActions, preferences, streaks, pomodoroSessions, totalFocusMinutes } = useStore()
  const [mounted, setMounted] = useState(false)
  const [darkMode, setDarkMode] = useState<'light' | 'dark' | 'system'>('dark')
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [reminderNotifications, setReminderNotifications] = useState(true)
  const [focusNotifications, setFocusNotifications] = useState(true)
  const [streakNotifications, setStreakNotifications] = useState(true)
  const [visualEffectsEnabled, setVisualEffectsEnabled] = useState(true)
  const [notificationPermission, setNotificationPermission] = useState<string>('default')
  const [billingLoading, setBillingLoading] = useState(false)
  const { plan, status: subStatus, cancel_at_period_end, current_period_end, fetchSubscription } = useSubscriptionStore()
  const isPro = plan === 'pro' && (subStatus === 'active' || subStatus === 'trialing')
  const searchParams = useSearchParams()
  const billingSuccess = searchParams.get('billing') === 'success'
  const [featureFlags, setFeatureFlags] = useState<Record<string, boolean>>({
    reminders: true,
    calendar: true,
    events: true,
    pomodoro: true,
    appBlocking: true,
    journal: true,
    objectives: true,
    happiness: true,
  })

  useEffect(() => {
    const loadSettings = () => {
      setMounted(true)
      
      const settingsStored = localStorage.getItem('nudge-settings')
      if (settingsStored) {
        const settings = JSON.parse(settingsStored)
        setDarkMode(settings.darkMode || 'dark')
        setNotificationsEnabled(settings.notificationsEnabled !== false)
        setReminderNotifications(settings.reminderNotifications !== false)
        setFocusNotifications(settings.focusNotifications !== false)
        setStreakNotifications(settings.streakNotifications !== false)
        setVisualEffectsEnabled(settings.visualEffectsEnabled !== false)
      }
      
      const featuresStored = localStorage.getItem('nudge-feature-flags')
      if (featuresStored) {
        setFeatureFlags(JSON.parse(featuresStored))
      }
      
      if (typeof window !== 'undefined') {
        setNotificationPermission(notificationService.permissionStatus)
      }
    }
    loadSettings()
    
    const handleSettingsChange = () => loadSettings()
    window.addEventListener('storage', handleSettingsChange)
    window.addEventListener('settings-updated', handleSettingsChange)
    window.addEventListener('feature-flags-updated', handleSettingsChange)
    return () => {
      window.removeEventListener('storage', handleSettingsChange)
      window.removeEventListener('settings-updated', handleSettingsChange)
      window.removeEventListener('feature-flags-updated', handleSettingsChange)
    }
  }, [])

  const toggleDarkMode = async () => {
    const newValue = darkMode === 'dark' ? 'light' : 'dark'
    setDarkMode(newValue)
    const settings = JSON.parse(localStorage.getItem('nudge-settings') || '{}')
    localStorage.setItem('nudge-settings', JSON.stringify({ ...settings, darkMode: newValue }))
    document.documentElement.classList.toggle('dark', newValue === 'dark')
    window.dispatchEvent(new Event('settings-updated'))
    await settingsSyncService.updatePreferences({ dark_mode: newValue })
  }

  const toggleVisualEffects = () => {
    const newValue = !visualEffectsEnabled
    setVisualEffectsEnabled(newValue)
    if (settingsActions?.updatePreferences) {
      settingsActions.updatePreferences({ visualEffectsEnabled: newValue })
    }
    const settings = JSON.parse(localStorage.getItem('nudge-settings') || '{}')
    localStorage.setItem('nudge-settings', JSON.stringify({ ...settings, visualEffectsEnabled: newValue }))
    settingsSyncService.updatePreferences({ visual_effects_enabled: newValue })
  }

  const toggleNotifications = () => {
    const newValue = !notificationsEnabled
    setNotificationsEnabled(newValue)
    if (settingsActions?.updatePreferences) {
      settingsActions.updatePreferences({ notificationsEnabled: newValue })
    }
    const settings = JSON.parse(localStorage.getItem('nudge-settings') || '{}')
    localStorage.setItem('nudge-settings', JSON.stringify({ ...settings, notificationsEnabled: newValue }))
    settingsSyncService.updatePreferences({ notifications_enabled: newValue })
  }

  const toggleReminderNotifications = () => {
    const newValue = !reminderNotifications
    setReminderNotifications(newValue)
    if (settingsActions?.updatePreferences) {
      settingsActions.updatePreferences({ reminderNotifications: newValue })
    }
    settingsSyncService.updatePreferences({ reminder_notifications: newValue })
  }

  const toggleFocusNotifications = () => {
    const newValue = !focusNotifications
    setFocusNotifications(newValue)
    if (settingsActions?.updatePreferences) {
      settingsActions.updatePreferences({ focusNotifications: newValue })
    }
    settingsSyncService.updatePreferences({ focus_notifications: newValue })
  }

  const toggleStreakNotifications = () => {
    const newValue = !streakNotifications
    setStreakNotifications(newValue)
    if (settingsActions?.updatePreferences) {
      settingsActions.updatePreferences({ streakNotifications: newValue })
    }
    settingsSyncService.updatePreferences({ streak_notifications: newValue })
  }

  const requestNotificationPermission = async () => {
    const granted = await notificationService.requestPermission()
    setNotificationPermission(granted ? 'granted' : 'denied')
  }

  const featureList = [
    { key: 'reminders', icon: Bell, label: t('featureReminders'), description: t('featureRemindersDesc') },
    { key: 'calendar', icon: Calendar, label: t('featureCalendar'), description: t('featureCalendarDesc') },
    { key: 'pomodoro', icon: Sparkles, label: t('featureFocus'), description: t('featureFocusDesc') },
    { key: 'journal', icon: BookOpen, label: t('featureJournal'), description: t('featureJournalDesc') },
    { key: 'happiness', icon: Target, label: t('featureWellbeing'), description: t('featureWellbeingDesc') },
  ]

  const toggleFeature = (key: string) => {
    const newFlags = { ...featureFlags, [key]: !featureFlags[key] }
    setFeatureFlags(newFlags)
    localStorage.setItem('nudge-feature-flags', JSON.stringify(newFlags))
    window.dispatchEvent(new Event('feature-flags-updated'))
    
    const supabaseKeyMap: Record<string, string> = {
      reminders: 'reminders_enabled',
      calendar: 'calendar_enabled',
      pomodoro: 'pomodoro_enabled',
      journal: 'journal_enabled',
    }
    
    if (supabaseKeyMap[key]) {
      settingsSyncService.updatePreferences({ [supabaseKeyMap[key]]: newFlags[key] })
    }
  }

  if (loading || !mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-primary">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-accent-primary/20 rounded-apple-xl animate-pulse" />
          <p className="text-text-tertiary">{tc('loading')}</p>
        </div>
      </div>
    )
  }

  const handleUpgrade = async (interval: 'monthly' | 'yearly') => {
    if (!user) return
    setBillingLoading(true)
    try {
      const token = supabaseAuth.currentAccessToken
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': user.id, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ interval }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch { setBillingLoading(false) }
  }

  const handleManageBilling = async () => {
    if (!user) return
    setBillingLoading(true)
    try {
      const token = supabaseAuth.currentAccessToken
      const res = await fetch('/api/billing/portal', {
        method: 'POST',
        headers: { 'x-user-id': user.id, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch { setBillingLoading(false) }
  }

  if (!user) return null

  const enabledCount = featureList.filter(f => featureFlags[f.key] !== false).length

  return (
    <div className="min-h-screen bg-background-primary">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold text-text-primary mb-2">
            {t('title')}
          </h1>
          <p className="text-text-tertiary">{t('subtitle')}</p>
        </header>

        <div className="space-y-6">
          <section className="card">
            <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-accent-secondary" />
              {t('profile')}
            </h2>
            <div className="flex items-center gap-4 p-4 bg-surface-secondary rounded-apple-lg">
              <div className="w-16 h-16 bg-accent-secondary rounded-full flex items-center justify-center text-white text-xl font-semibold">
                {(user.name || user.email).charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="font-medium text-text-primary">{user.name || user.email.split('@')[0]}</p>
                <p className="text-sm text-text-tertiary">{user.email}</p>
              </div>
              <button className="btn-secondary text-sm">{t('editProfile')}</button>
            </div>
          </section>

          <section className="card">
            <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <ToggleRight className="w-5 h-5 text-accent-secondary" />
              {t('appearance')}
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-surface-secondary rounded-apple-lg">
                <div className="flex items-center gap-3">
                  {darkMode === 'dark' ? <Moon className="w-5 h-5 text-accent-secondary" /> : <Sun className="w-5 h-5 text-action-warning" />}
                  <div>
                    <p className="font-medium text-text-primary">{t('darkMode')}</p>
                    <p className="text-sm text-text-tertiary">{t('darkModeDesc')}</p>
                  </div>
                </div>
                <Toggle enabled={darkMode === 'dark'} onClick={toggleDarkMode} />
              </div>

              <div className="flex items-center justify-between p-4 bg-surface-secondary rounded-apple-lg">
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-accent-secondary" />
                  <div>
                    <p className="font-medium text-text-primary">{t('visualEffects')}</p>
                    <p className="text-sm text-text-tertiary">{t('visualEffectsDesc')}</p>
                  </div>
                </div>
                <Toggle enabled={visualEffectsEnabled} onClick={toggleVisualEffects} />
              </div>
            </div>
          </section>

          <section className="card">
            <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5 text-action-warning" />
              {t('notifications')}
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-surface-secondary rounded-apple-lg">
                <div className="flex items-center gap-3">
                  {notificationPermission === 'granted' ? <Bell className="w-5 h-5 text-success" /> : <BellOff className="w-5 h-5 text-text-tertiary" />}
                  <div>
                    <p className="font-medium text-text-primary">{t('pushNotifications')}</p>
                    <p className="text-sm text-text-tertiary">
                      {notificationPermission === 'granted' ? t('pushEnabled') : t('pushDisabled')}
                    </p>
                  </div>
                </div>
                {notificationPermission !== 'granted' ? (
                  <button onClick={requestNotificationPermission} className="btn-secondary text-sm">
                    {tc('enable')}
                  </button>
                ) : (
                  <Toggle enabled={notificationsEnabled} onClick={toggleNotifications} />
                )}
              </div>

              {notificationsEnabled && (
                <>
                  <div className="flex items-center justify-between p-4 bg-surface-secondary rounded-apple-lg ml-4 pl-8">
                    <div>
                      <p className="font-medium text-text-primary">{t('reminderNotifications')}</p>
                      <p className="text-sm text-text-tertiary">{t('reminderNotificationsDesc')}</p>
                    </div>
                    <Toggle enabled={reminderNotifications} onClick={toggleReminderNotifications} />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-surface-secondary rounded-apple-lg ml-4 pl-8">
                    <div>
                      <p className="font-medium text-text-primary">{t('focusNotifications')}</p>
                      <p className="text-sm text-text-tertiary">{t('focusNotificationsDesc')}</p>
                    </div>
                    <Toggle enabled={focusNotifications} onClick={toggleFocusNotifications} />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-surface-secondary rounded-apple-lg ml-4 pl-8">
                    <div>
                      <p className="font-medium text-text-primary">{t('streakNotifications')}</p>
                      <p className="text-sm text-text-tertiary">{t('streakNotificationsDesc')}</p>
                    </div>
                    <Toggle enabled={streakNotifications} onClick={toggleStreakNotifications} />
                  </div>
                </>
              )}
            </div>
          </section>

          <section className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-accent-secondary" />
                {t('features')}
              </h2>
              <span className="text-sm text-text-tertiary">{t('featuresEnabled', { count: enabledCount, total: featureList.length })}</span>
            </div>
            <p className="text-sm text-text-tertiary mb-4">{t('featuresSubtitle')}</p>
            <div className="space-y-3">
              {featureList.map(feature => {
                const isEnabled = featureFlags?.[feature.key] !== false
                return (
                  <div
                    key={feature.key}
                    className="flex items-center justify-between p-4 bg-surface-secondary rounded-apple-lg"
                  >
                    <div className="flex items-center gap-3">
                      <feature.icon className="w-5 h-5 text-text-tertiary" />
                      <div>
                        <p className="font-medium text-text-primary">{feature.label}</p>
                        <p className="text-sm text-text-tertiary">{feature.description}</p>
                      </div>
                    </div>
                    <Toggle enabled={isEnabled} onClick={() => toggleFeature(feature.key)} />
                  </div>
                )
              })}
            </div>
          </section>

          <section className="card">
            <Suspense fallback={<div className="py-8 text-center text-text-tertiary">{tc('loading')}</div>}>
              <CalendarSettings />
            </Suspense>
          </section>

          <section className="card">
            <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-success" />
              {t('stats')}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-surface-secondary rounded-apple-lg text-center">
                <p className="text-2xl font-semibold text-text-primary">{streaks.journal?.currentCount || 0}</p>
                <p className="text-sm text-text-tertiary">{t('journalStreak')}</p>
              </div>
              <div className="p-4 bg-surface-secondary rounded-apple-lg text-center">
                <p className="text-2xl font-semibold text-text-primary">{streaks.focus?.currentCount || 0}</p>
                <p className="text-sm text-text-tertiary">{t('focusStreak')}</p>
              </div>
              <div className="p-4 bg-surface-secondary rounded-apple-lg text-center">
                <p className="text-2xl font-semibold text-text-primary">{pomodoroSessions}</p>
                <p className="text-sm text-text-tertiary">{t('sessionsToday')}</p>
              </div>
              <div className="p-4 bg-surface-secondary rounded-apple-lg text-center">
                <p className="text-2xl font-semibold text-text-primary">{totalFocusMinutes}</p>
                <p className="text-sm text-text-tertiary">{t('minutesFocused')}</p>
              </div>
            </div>
          </section>

          <section className="card">
            <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-accent-secondary" />
              {t('more')}
            </h2>
            <div className="space-y-3">
              <button className="w-full flex items-center justify-between p-4 bg-surface-secondary rounded-apple-lg hover:bg-border-primary transition-colors">
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-text-tertiary" />
                  <span className="font-medium text-text-primary">{t('privacyPolicy')}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-text-tertiary" />
              </button>
              <button className="w-full flex items-center justify-between p-4 bg-surface-secondary rounded-apple-lg hover:bg-border-primary transition-colors">
                <div className="flex items-center gap-3">
                  <HelpCircle className="w-5 h-5 text-text-tertiary" />
                  <span className="font-medium text-text-primary">{t('helpSupport')}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-text-tertiary" />
              </button>
            </div>
          </section>

          {/* ── Billing ── */}
          <section className="card">
            <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-accent-secondary" />
              Plan &amp; Billing
            </h2>

            {billingSuccess && (
              <div className="flex items-center gap-2 p-3 bg-success/10 text-success rounded-apple-lg text-sm mb-4">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                You&apos;re now on Pro! Welcome aboard.
              </div>
            )}

            {isPro ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-surface-secondary rounded-apple-lg">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-accent-primary" />
                    <div>
                      <p className="font-medium text-text-primary">Nudge Pro</p>
                      <p className="text-sm text-text-tertiary capitalize">{subStatus}{cancel_at_period_end ? ' · Cancels' : ''}{current_period_end ? ` ${new Date(current_period_end).toLocaleDateString()}` : ''}</p>
                    </div>
                  </div>
                  <span className="text-xs font-medium bg-accent-primary/10 text-accent-primary px-2 py-1 rounded-full">Active</span>
                </div>
                <button
                  onClick={handleManageBilling}
                  disabled={billingLoading}
                  className="w-full flex items-center justify-center gap-2 p-3 bg-surface-secondary rounded-apple-lg text-sm font-medium text-text-primary hover:bg-border-primary transition-colors disabled:opacity-50"
                >
                  {billingLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                  Manage Subscription
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-surface-secondary rounded-apple-lg">
                  <div>
                    <p className="font-medium text-text-primary">Free Plan</p>
                    <p className="text-sm text-text-tertiary">Reminders, focus timer, local calendar</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleUpgrade('monthly')}
                    disabled={billingLoading}
                    className="flex flex-col items-center p-4 bg-surface-secondary rounded-apple-lg border border-border-primary hover:border-accent-primary transition-colors disabled:opacity-50"
                  >
                    <span className="font-semibold text-text-primary">$5.99</span>
                    <span className="text-xs text-text-tertiary">per month</span>
                  </button>
                  <button
                    onClick={() => handleUpgrade('yearly')}
                    disabled={billingLoading}
                    className="flex flex-col items-center p-4 bg-accent-primary/10 rounded-apple-lg border border-accent-primary hover:bg-accent-primary/20 transition-colors disabled:opacity-50 relative"
                  >
                    <span className="absolute -top-2 right-2 text-xs bg-success text-white px-1.5 py-0.5 rounded-full">Best value</span>
                    <span className="font-semibold text-text-primary">$47.99</span>
                    <span className="text-xs text-text-tertiary">per year · ~$4/mo</span>
                  </button>
                </div>
                {billingLoading && (
                  <div className="flex items-center justify-center gap-2 text-sm text-text-tertiary">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Redirecting to checkout...
                  </div>
                )}
              </div>
            )}
          </section>

          <section className="card">
            <button
              onClick={() => signOut()}
              className="w-full flex items-center justify-center gap-2 p-4 bg-action-danger/10 text-action-danger rounded-apple-lg hover:bg-action-danger/20 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">{t('signOut')}</span>
            </button>
          </section>

          <div className="text-center text-sm text-text-tertiary">
            <p>Nudge Web v1.0.0</p>
            <p className="mt-1">Built with ❤️ by Nudge</p>
          </div>
        </div>
      </div>
    </div>
  )
}
