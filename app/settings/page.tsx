'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import { useAuth } from '@/components/Providers'
import { useStore } from '@/lib/store'
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
  Smartphone
} from 'lucide-react'

export default function SettingsPage() {
  const { user, loading, signOut } = useAuth()
  const { featureFlags, settingsActions } = useStore()
  const [mounted, setMounted] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [notifications, setNotifications] = useState(true)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem('nudge-settings')
    if (stored) {
      const settings = JSON.parse(stored)
      setDarkMode(settings.darkMode || false)
      setNotifications(settings.notifications !== false)
    }
  }, [])

  const toggleDarkMode = () => {
    const newValue = !darkMode
    setDarkMode(newValue)
    const settings = JSON.parse(localStorage.getItem('nudge-settings') || '{}')
    localStorage.setItem('nudge-settings', JSON.stringify({ ...settings, darkMode: newValue }))
    document.documentElement.classList.toggle('dark', newValue)
  }

  const toggleNotifications = () => {
    const newValue = !notifications
    setNotifications(newValue)
    const settings = JSON.parse(localStorage.getItem('nudge-settings') || '{}')
    localStorage.setItem('nudge-settings', JSON.stringify({ ...settings, notifications: newValue }))
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
                    {darkMode ? <Moon className="w-5 h-5 text-accent-secondary" /> : <Sun className="w-5 h-5 text-action-warning" />}
                    <div>
                      <p className="font-medium text-text-primary">Dark Mode</p>
                      <p className="text-sm text-text-tertiary">Switch between light and dark theme</p>
                    </div>
                  </div>
                  <button
                    onClick={toggleDarkMode}
                    className={`relative w-14 h-8 rounded-full transition-colors ${
                      darkMode ? 'bg-accent-primary' : 'bg-border-primary'
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                        darkMode ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-surface-secondary rounded-apple-lg">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-action-warning" />
                    <div>
                      <p className="font-medium text-text-primary">Notifications</p>
                      <p className="text-sm text-text-tertiary">Receive push notifications</p>
                    </div>
                  </div>
                  <button
                    onClick={toggleNotifications}
                    className={`relative w-14 h-8 rounded-full transition-colors ${
                      notifications ? 'bg-accent-primary' : 'bg-border-primary'
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                        notifications ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
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
