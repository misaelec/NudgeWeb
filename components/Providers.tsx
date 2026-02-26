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
    const isAuthRoute = typeof window !== 'undefined' && window.location.pathname.startsWith('/auth')
    
    if (isAuthRoute) {
      console.log('[AuthProvider] On auth route, skipping session load')
      setLoading(false)
      return
    }

    const loadSession = async () => {
      console.log('[AuthProvider] Loading session...')
      try {
        // First check localStorage (client-side session)
        const stored = localStorage.getItem('supabase_session')
        let clientSession = null
        
        if (stored) {
          try {
            clientSession = JSON.parse(stored)
          } catch (e) {
            console.error('Failed to parse session', e)
          }
        }

        // Get session from Supabase (will use cookies if available)
        const { data: { session }, error } = await supabase.auth.getSession()
        
        console.log('[AuthProvider] getSession result:', { session: !!session, error: error?.message })
        
        if (error) {
          console.error('[AuthProvider] Session error:', error.message)
          localStorage.removeItem('supabase_session')
          setUser(null)
        } else if (session?.user) {
          console.log('[AuthProvider] Session found, user:', session.user.id)
          localStorage.setItem('supabase_session', JSON.stringify({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            user: session.user,
          }))
          setUser(session.user as User)
        } else if (clientSession?.user) {
          // Fallback to stored session
          console.log('[AuthProvider] Using stored session')
          setUser(clientSession.user)
        } else {
          console.log('[AuthProvider] No session found')
          localStorage.removeItem('supabase_session')
          setUser(null)
        }
      } catch (err) {
        console.error('[AuthProvider] Failed to load session:', err)
        setUser(null)
      } finally {
        console.log('[AuthProvider] Setting loading to false')
        setLoading(false)
      }
    }

    if (!initialized.current) {
      initialized.current = true
      loadSession()
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[AuthProvider] Auth state changed:', event, session ? 'has session' : 'no session')
      
      if (event === 'SIGNED_OUT') {
        localStorage.removeItem('supabase_session')
        setUser(null)
      } else if (session?.user) {
        console.log('[AuthProvider] Setting user from state change:', session.user.id)
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
    
    // Clear server-side cookies
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (e) {
      // Ignore errors
    }
    
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
