'use client'

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react'
import { supabaseAuth, User } from '@/lib/auth'
import { settingsSyncService } from '@/lib/settingsSync'
import { useSupabaseSync } from '@/hooks/useSupabaseSync'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signUp: (email: string, password: string) => Promise<{ success: boolean; error?: string; needsConfirmation?: boolean }>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

async function loadUserSettings() {
  try {
    const prefs = await settingsSyncService.fetchPreferences()
    if (prefs) {
      const settings = {
        darkMode: prefs.dark_mode || 'dark',
        notificationsEnabled: prefs.notifications_enabled,
        reminderNotifications: prefs.reminder_notifications,
        focusNotifications: prefs.focus_notifications,
        streakNotifications: prefs.streak_notifications,
        visualEffectsEnabled: prefs.visual_effects_enabled,
      }
      localStorage.setItem('nudge-settings', JSON.stringify(settings))
      
      const featureFlags = {
        reminders: prefs.reminders_enabled,
        calendar: prefs.calendar_enabled,
        pomodoro: prefs.pomodoro_enabled,
        journal: prefs.journal_enabled,
      }
      localStorage.setItem('nudge-feature-flags', JSON.stringify(featureFlags))
      
      window.dispatchEvent(new Event('feature-flags-updated'))
      window.dispatchEvent(new Event('settings-updated'))
    }
  } catch (error) {
    console.error('Failed to load user settings:', error)
  }
}

function RealtimeSyncWrapper() {
  useSupabaseSync()
  return null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadSession = async () => {
      const stored = localStorage.getItem('supabase_session')
      if (stored) {
        try {
          const session = JSON.parse(stored)
          setUser(session.user)
        } catch (e) {
          console.error('Failed to parse session', e)
          setUser(null)
        }
      } else {
        setUser(null)
      }
      setLoading(false)
    }

    loadSession()

    const handleStorageChange = async () => {
      await loadSession()
    }

    const handleAuthChange = async () => {
      await loadSession()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('auth-state-change', handleAuthChange)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('auth-state-change', handleAuthChange)
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    const result = await supabaseAuth.signIn(email, password)
    return result
  }

  const signUp = async (email: string, password: string) => {
    const result = await supabaseAuth.signUp(email, password)
    return result
  }

  const signInWithGoogle = async () => {
    await supabaseAuth.signInWithGoogle()
  }

  const signOut = async () => {
    await supabaseAuth.signOut()
    sessionStorage.setItem('logged_out', 'true')
    setUser(null)
    window.location.href = '/landing'
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signInWithGoogle, signOut }}>
      <RealtimeSyncWrapper />
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
