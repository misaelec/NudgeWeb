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

function applyTheme(darkMode: string) {
  if (typeof document !== 'undefined') {
    if (darkMode === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }
}

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
      
      applyTheme(settings.darkMode)
      
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

    const loadSession = async () => {
      console.log('[AuthProvider] loadSession — checking localStorage...')
      try {
        const stored = localStorage.getItem('supabase_session')
        let clientSession = null

        if (stored) {
          try {
            clientSession = JSON.parse(stored)
          } catch (e) {
            console.error('[AuthProvider] Failed to parse stored session', e)
          }
        }

        if (clientSession?.user) {
          console.log('[AuthProvider] Restored user from localStorage:', clientSession.user.email)
          setUser(clientSession.user)
        } else {
          // Fallback: check if the Supabase client has a session (e.g. from auto-refresh)
          const { data: { session } } = await supabase.auth.getSession()

          if (session?.user) {
            const supaUser = session.user
            const mappedUser: User = {
              id: supaUser.id,
              email: supaUser.email || '',
              name: supaUser.user_metadata?.display_name || supaUser.user_metadata?.name || supaUser.email?.split('@')[0],
              avatar_url: supaUser.user_metadata?.avatar_url || supaUser.user_metadata?.picture,
            }
            localStorage.setItem('supabase_session', JSON.stringify({
              access_token: session.access_token,
              refresh_token: session.refresh_token,
              user: mappedUser,
            }))
            console.log('[AuthProvider] Restored user from Supabase client:', mappedUser.email)
            setUser(mappedUser)
          } else {
            console.log('[AuthProvider] No session found anywhere')
            localStorage.removeItem('supabase_session')
            setUser(null)
          }
        }
      } catch (err) {
        console.error('[AuthProvider] loadSession error:', err)
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
      console.log('[AuthProvider] onAuthStateChange:', event)

      if (event === 'SIGNED_OUT') {
        localStorage.removeItem('supabase_session')
        setUser(null)
      } else if (session?.user) {
        const supaUser = session.user
        const mappedUser: User = {
          id: supaUser.id,
          email: supaUser.email || '',
          name: supaUser.user_metadata?.display_name || supaUser.user_metadata?.name || supaUser.email?.split('@')[0],
          avatar_url: supaUser.user_metadata?.avatar_url || supaUser.user_metadata?.picture,
        }
        localStorage.setItem('supabase_session', JSON.stringify({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          user: mappedUser,
        }))
        setUser(mappedUser)

        if (event === 'SIGNED_IN') {
          console.log('[AuthProvider] SIGNED_IN — loading user settings...')
          loadUserSettings()
        }
      }
    })

    // Listen for custom auth-state-change event dispatched from /auth/callback
    const handleAuthEvent = () => {
      console.log('[AuthProvider] Custom auth-state-change event received, reloading...')
      loadSession()
    }
    window.addEventListener('auth-state-change', handleAuthEvent)

    // On auth routes, retry after a short delay to pick up session stored by callback page
    if (isAuthRoute) {
      setTimeout(loadSession, 500)
    }

    return () => {
      subscription.unsubscribe()
      window.removeEventListener('auth-state-change', handleAuthEvent)
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
    console.log('[SignOut] Starting sign out...')

    // 1. Sign out from the Supabase JS client (clears its persisted session)
    try {
      await supabase.auth.signOut()
      console.log('[SignOut] Supabase client signed out')
    } catch (e) {
      console.error('[SignOut] Supabase client signOut error:', e)
    }

    // 2. Clear custom localStorage session
    localStorage.removeItem('supabase_session')
    console.log('[SignOut] Cleared supabase_session from localStorage')

    // 3. Clear server-side cookies
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (e) {
      // Ignore errors
    }

    sessionStorage.setItem('logged_out', 'true')
    setUser(null)
    console.log('[SignOut] Redirecting to /landing')
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
