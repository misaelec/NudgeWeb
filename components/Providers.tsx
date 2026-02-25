'use client'

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react'
import { supabaseAuth, User } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
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
  const initialized = useRef(false)

  useEffect(() => {
    const loadSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Session error:', error.message)
          localStorage.removeItem('supabase_session')
          setUser(null)
        } else if (session?.user) {
          localStorage.setItem('supabase_session', JSON.stringify({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            user: session.user,
          }))
          setUser(session.user as User)
        } else {
          localStorage.removeItem('supabase_session')
          setUser(null)
        }
      } catch (err) {
        console.error('Failed to load session:', err)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    if (!initialized.current) {
      initialized.current = true
      loadSession()
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session ? 'has session' : 'no session')
      
      if (event === 'SIGNED_OUT') {
        localStorage.removeItem('supabase_session')
        setUser(null)
      } else if (session?.user) {
        localStorage.setItem('supabase_session', JSON.stringify({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          user: session.user,
        }))
        setUser(session.user as User)
      }
    })

    return () => {
      subscription.unsubscribe()
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
