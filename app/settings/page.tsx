'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import { useAuth } from '@/components/Providers'
import { useStore } from '@/lib/store'
import { notificationService } from '@/lib/notifications'
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
  Globe,
  HelpCircle,
  LogOut,
  ChevronRight,
  Smartphone,
  BellOff,
  Zap,
  BarChart3
} from 'lucide-react'

export default function SettingsPage() {
  const { user, loading, signOut } = useAuth()
  const { featureFlags, settingsActions, preferences, streaks, pomodoroSessions, totalFocusMinutes } = useStore()
  const [mounted, setMounted] = useState(false)
  const [darkMode, setDarkMode] = useState<'light' | 'dark' | 'system'>('dark')
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [reminderNotifications, setReminderNotifications] = useState(true)
  const [focusNotifications, setFocusNotifications] = useState(true)
  const [streakNotifications, setStreakNotifications] = useState(true)
  const [visualEffectsEnabled, setVisualEffectsEnabled] = useState(true)
  const [notificationPermission, setNotificationPermission] = useState<string>('default')

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem('nudge-settings')
    if (stored) {
      const settings = JSON.parse(stored)
      setDarkMode(settings.darkMode || 'dark')
      setNotificationsEnabled(settings.notificationsEnabled !== false)
      setReminderNotifications(settings.reminderNotifications !== false)
      setFocusNotifications(settings.focusNotifications !== false)
      setStreakNotifications(settings.streakNotifications !== false)
      setVisualEffectsEnabled(settings.visualEffectsEnabled !== false)
    }
    if (typeof window !== 'undefined') {
      setNotificationPermission(notificationService.permissionStatus)
    }
  }, [])

  const toggleDarkMode = () => {
    const newValue = darkMode === 'dark' ? 'light' : 'dark'
    setDarkMode(newValue)
    const settings = JSON.parse(localStorage.getItem('nudge-settings') || '{}')
    localStorage.setItem('nudge-settings', JSON.stringify({ ...settings, darkMode: newValue }))
    document.documentElement.classList.toggle('dark', newValue === 'dark')
  }

  const toggleVisualEffects = () => {
    const newValue = !visualEffectsEnabled
    setVisualEffectsEnabled(newValue)
    settingsActions.updatePreferences({ visualEffectsEnabled: newValue })
    const settings = JSON.parse(localStorage.getItem('nudge-settings') || '{}')
    localStorage.setItem('nudge-settings', JSON.stringify({ ...settings, visualEffectsEnabled: newValue }))
  }

  const toggleNotifications = () => {
    const newValue = !notificationsEnabled
    setNotificationsEnabled(newValue)
    settingsActions.updatePreferences({ notificationsEnabled: newValue })
    const settings = JSON.parse(localStorage.getItem('nudge-settings') || '{}')
    localStorage.setItem('nudge-settings', JSON.stringify({ ...settings, notificationsEnabled: newValue }))
  }

  const toggleReminderNotifications = () => {
    const newValue = !reminderNotifications
    setReminderNotifications(newValue)
    settingsActions.updatePreferences({ reminderNotifications: newValue })
  }

  const toggleFocusNotifications = () => {
    const newValue = !focusNotifications
    setFocusNotifications(newValue)
    settingsActions.updatePreferences({ focusNotifications: newValue })
  }

  const toggleStreakNotifications = () => {
    const newValue = !streakNotifications
    setStreakNotifications(newValue)
    settingsActions.updatePreferences({ streakNotifications: newValue })
  }

  const requestNotificationPermission = async () => {
    const granted = await notificationService.requestPermission()
    setNotificationPermission(granted ? 'granted' : 'denied')
  }

  const featureList = [
    { key: 'reminders', icon: Bell, label: 'Reminders', description: 'Create and manage reminders' },
    { key: 'calendar', icon: Calendar, label: 'Calendar', description: 'View and manage events' },
    { key: 'events', icon: Clock, label: 'Events', description: 'Schedule and track events' },
    { key: 'pomodoro', icon: Sparkles, label: 'Focus Timer', description: 'Pomodoro technique for productivity' },
    { key: 'appBlocking', icon: Shield, label: 'App Blocking', description: 'Block distractions during focus' },
    { key: 'journal', icon: BookOpen, label: 'Journal', description: 'Write daily reflections' },
    { key: 'objectives', icon: Target, label: 'Objectives', description: 'Track OKRs and goals' },
  ]

  if (loading || !mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-primary">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-accent-primary/20 rounded-apple-xl animate-pulse" />
          <p className="text-text-tertiary">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  const enabledCount = Object.values(featureFlags || {}).filter(Boolean).length

  return (
    <div className="min-h-screen bg-background-primary">
      <Sidebar />

      <main className="ml-64 p-8">
        <div className="max-w-4xl mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl font-semibold text-text-primary mb-2">
              Settings
            </h1>
            <p className="text-text-tertiary">Customize your Nudge experience</p>
          </header>

          <div className="space-y-6">
            <section className="card">
              <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-accent-secondary" />
                Profile
              </h2>
              <div className="flex items-center gap-4 p-4 bg-surface-secondary rounded-apple-lg">
                <div className="w-16 h-16 bg-accent-secondary rounded-full flex items-center justify-center text-white text-xl font-semibold">
                  {(user.name || user.email).charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-text-primary">{user.name || user.email.split('@')[0]}</p>
                  <p className="text-sm text-text-tertiary">{user.email}</p>
                </div>
                <button className="btn-secondary text-sm">Edit Profile</button>
              </div>
            </section>

            <section className="card">
              <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                <ToggleRight className="w-5 h-5 text-accent-secondary" />
                Appearance
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-surface-secondary rounded-apple-lg">
                  <div className="flex items-center gap-3">
                    {darkMode === 'dark' ? <Moon className="w-5 h-5 text-accent-secondary" /> : <Sun className="w-5 h-5 text-action-warning" />}
                    <div>
                      <p className="font-medium text-text-primary">Dark Mode</p>
                      <p className="text-sm text-text-tertiary">Switch between light and dark theme</p>
                    </div>
                  </div>
                  <button
                    onClick={toggleDarkMode}
                    className={`relative w-14 h-8 rounded-full transition-colors ${
                      darkMode === 'dark' ? 'bg-accent-primary' : 'bg-border-primary'
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                        darkMode === 'dark' ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-surface-secondary rounded-apple-lg">
                  <div className="flex items-center gap-3">
                    <Zap className="w-5 h-5 text-accent-secondary" />
                    <div>
                      <p className="font-medium text-text-primary">Visual Effects</p>
                      <p className="text-sm text-text-tertiary">Animations and transitions</p>
                    </div>
                  </div>
                  <button
                    onClick={toggleVisualEffects}
                    className={`relative w-14 h-8 rounded-full transition-colors ${
                      visualEffectsEnabled ? 'bg-accent-primary' : 'bg-border-primary'
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                        visualEffectsEnabled ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </section>

            <section className="card">
              <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                <Bell className="w-5 h-5 text-action-warning" />
                Notifications
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-surface-secondary rounded-apple-lg">
                  <div className="flex items-center gap-3">
                    {notificationPermission === 'granted' ? <Bell className="w-5 h-5 text-success" /> : <BellOff className="w-5 h-5 text-text-tertiary" />}
                    <div>
                      <p className="font-medium text-text-primary">Push Notifications</p>
                      <p className="text-sm text-text-tertiary">
                        {notificationPermission === 'granted' ? 'Enabled' : 'Click to enable'}
                      </p>
                    </div>
                  </div>
                  {notificationPermission !== 'granted' ? (
                    <button onClick={requestNotificationPermission} className="btn-secondary text-sm">
                      Enable
                    </button>
                  ) : (
                    <button
                      onClick={toggleNotifications}
                      className={`relative w-14 h-8 rounded-full transition-colors ${
                        notificationsEnabled ? 'bg-accent-primary' : 'bg-border-primary'
                      }`}
                    >
                      <span
                        className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                          notificationsEnabled ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  )}
                </div>

                {notificationsEnabled && (
                  <>
                    <div className="flex items-center justify-between p-4 bg-surface-secondary rounded-apple-lg ml-4">
                      <div>
                        <p className="font-medium text-text-primary">Reminder Notifications</p>
                        <p className="text-sm text-text-tertiary">Get notified when reminders are due</p>
                      </div>
                      <button
                        onClick={toggleReminderNotifications}
                        className={`relative w-14 h-8 rounded-full transition-colors ${
                          reminderNotifications ? 'bg-accent-primary' : 'bg-border-primary'
                        }`}
                      >
                        <span
                          className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                            reminderNotifications ? 'translate-x-7' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-surface-secondary rounded-apple-lg ml-4">
                      <div>
                        <p className="font-medium text-text-primary">Focus Notifications</p>
                        <p className="text-sm text-text-tertiary">Session and break reminders</p>
                      </div>
                      <button
                        onClick={toggleFocusNotifications}
                        className={`relative w-14 h-8 rounded-full transition-colors ${
                          focusNotifications ? 'bg-accent-primary' : 'bg-border-primary'
                        }`}
                      >
                        <span
                          className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                            focusNotifications ? 'translate-x-7' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-surface-secondary rounded-apple-lg ml-4">
                      <div>
                        <p className="font-medium text-text-primary">Streak Notifications</p>
                        <p className="text-sm text-text-tertiary">Milestone achievements</p>
                      </div>
                      <button
                        onClick={toggleStreakNotifications}
                        className={`relative w-14 h-8 rounded-full transition-colors ${
                          streakNotifications ? 'bg-accent-primary' : 'bg-border-primary'
                        }`}
                      >
                        <span
                          className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                            streakNotifications ? 'translate-x-7' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </>
                )}
              </div>
            </section>

            <section className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-accent-secondary" />
                  Features
                </h2>
                <span className="text-sm text-text-tertiary">{enabledCount} of {featureList.length} enabled</span>
              </div>
              <p className="text-sm text-text-tertiary mb-4">Toggle features on or off based on your needs</p>
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
                      <button
                        onClick={() => settingsActions.toggleFeature(feature.key)}
                        className={`relative w-14 h-8 rounded-full transition-colors ${
                          isEnabled ? 'bg-accent-primary' : 'bg-border-primary'
                        }`}
                      >
                        <span
                          className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                            isEnabled ? 'translate-x-7' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  )
                })}
              </div>
            </section>

            <section className="card">
              <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-success" />
                Your Stats
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-surface-secondary rounded-apple-lg text-center">
                  <p className="text-2xl font-semibold text-text-primary">{streaks.journal?.currentCount || 0}</p>
                  <p className="text-sm text-text-tertiary">Journal Streak</p>
                </div>
                <div className="p-4 bg-surface-secondary rounded-apple-lg text-center">
                  <p className="text-2xl font-semibold text-text-primary">{streaks.focus?.currentCount || 0}</p>
                  <p className="text-sm text-text-tertiary">Focus Streak</p>
                </div>
                <div className="p-4 bg-surface-secondary rounded-apple-lg text-center">
                  <p className="text-2xl font-semibold text-text-primary">{pomodoroSessions}</p>
                  <p className="text-sm text-text-tertiary">Sessions Today</p>
                </div>
                <div className="p-4 bg-surface-secondary rounded-apple-lg text-center">
                  <p className="text-2xl font-semibold text-text-primary">{totalFocusMinutes}</p>
                  <p className="text-sm text-text-tertiary">Minutes Focused</p>
                </div>
              </div>
            </section>

            <section className="card">
              <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-accent-secondary" />
                Sync
              </h2>
              <div className="space-y-3">
                <button className="w-full flex items-center justify-between p-4 bg-surface-secondary rounded-apple-lg hover:bg-border-primary transition-colors">
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-text-tertiary" />
                    <span className="font-medium text-text-primary">Sync with iOS App</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-text-tertiary" />
                </button>
                <button className="w-full flex items-center justify-between p-4 bg-surface-secondary rounded-apple-lg hover:bg-border-primary transition-colors">
                  <div className="flex items-center gap-3">
                    <Lock className="w-5 h-5 text-text-tertiary" />
                    <span className="font-medium text-text-primary">Privacy Policy</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-text-tertiary" />
                </button>
                <button className="w-full flex items-center justify-between p-4 bg-surface-secondary rounded-apple-lg hover:bg-border-primary transition-colors">
                  <div className="flex items-center gap-3">
                    <HelpCircle className="w-5 h-5 text-text-tertiary" />
                    <span className="font-medium text-text-primary">Help & Support</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-text-tertiary" />
                </button>
              </div>
            </section>

            <section className="card">
              <button
                onClick={() => signOut()}
                className="w-full flex items-center justify-center gap-2 p-4 bg-action-danger/10 text-action-danger rounded-apple-lg hover:bg-action-danger/20 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Sign Out</span>
              </button>
            </section>

            <div className="text-center text-sm text-text-tertiary">
              <p>Nudge Web v1.0.0</p>
              <p className="mt-1">Built with Next.js & Tailwind CSS</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
