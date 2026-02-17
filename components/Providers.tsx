'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabaseAuth, User } from '@/lib/auth'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signUp: (email: string, password: string) => Promise<{ success: boolean; error?: string; needsConfirmation?: boolean }>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadSession = () => {
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

    const handleStorageChange = () => {
      loadSession()
    }

    const handleAuthChange = () => {
      loadSession()
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
    if (result.success) {
      const stored = localStorage.getItem('supabase_session')
      if (stored) {
        const session = JSON.parse(stored)
        setUser(session.user)
      }
    }
    return result
  }

  const signUp = async (email: string, password: string) => {
    const result = await supabaseAuth.signUp(email, password)
    if (result.success) {
      const stored = localStorage.getItem('supabase_session')
      if (stored) {
        const session = JSON.parse(stored)
        setUser(session.user)
      }
    }
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
