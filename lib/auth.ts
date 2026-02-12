import { supabaseConfig, supabaseAuthUrl } from './supabase'

export interface User {
  id: string
  email: string
  name?: string
  avatar_url?: string
}

export interface AuthSession {
  access_token: string
  refresh_token: string
  user: User
}

class SupabaseAuth {
  private sessionKey = 'supabase_session'
  private accessToken: string | null = null
  private refreshToken: string | null = null

  constructor() {
    this.loadSession()
  }

  private loadSession() {
    if (typeof window === 'undefined') return
    const data = localStorage.getItem(this.sessionKey)
    if (data) {
      try {
        const session = JSON.parse(data)
        this.accessToken = session.access_token
        this.refreshToken = session.refresh_token
      } catch (e) {
        console.error('Failed to parse session', e)
      }
    }
  }

  private saveSession(session: AuthSession) {
    if (typeof window === 'undefined') return
    localStorage.setItem(this.sessionKey, JSON.stringify(session))
    this.accessToken = session.access_token
    this.refreshToken = session.refresh_token
  }

  private clearSession() {
    if (typeof window === 'undefined') return
    localStorage.removeItem(this.sessionKey)
    this.accessToken = null
    this.refreshToken = null
  }

  get headers() {
    return {
      'apikey': supabaseConfig.anonKey,
      'Content-Type': 'application/json',
    }
  }

  get authHeaders() {
    return {
      ...this.headers,
      'Authorization': `Bearer ${this.accessToken}`,
    }
  }

  get isAuthenticated(): boolean {
    return !!this.accessToken
  }

  get currentAccessToken(): string | null {
    return this.accessToken
  }

  async signUp(email: string, password: string): Promise<{ success: boolean; error?: string; needsConfirmation?: boolean }> {
    try {
      const response = await fetch(`${supabaseAuthUrl}/signup`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.status === 200 || response.status === 201) {
        if (data.access_token) {
          this.saveSession({
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            user: data.user,
          })
          window.dispatchEvent(new Event('auth-state-change'))
          return { success: true }
        } else {
          return { success: false, needsConfirmation: true }
        }
      } else {
        return { success: false, error: data.message || data.msg || 'Sign up failed' }
      }
    } catch (error) {
      return { success: false, error: 'Network error' }
    }
  }

  async signIn(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${supabaseAuthUrl}/token?grant_type=password`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.status === 200) {
        this.saveSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          user: data.user,
        })
        window.dispatchEvent(new Event('auth-state-change'))
        return { success: true }
      } else {
        return { success: false, error: data.error_description || data.message || 'Invalid credentials' }
      }
    } catch (error) {
      return { success: false, error: 'Network error' }
    }
  }

  async signOut(): Promise<void> {
    try {
      if (this.accessToken) {
        await fetch(`${supabaseAuthUrl}/logout`, {
          method: 'POST',
          headers: this.authHeaders,
        })
      }
    } catch (e) {
      console.error('Sign out error', e)
    }
    this.clearSession()
  }

  async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${supabaseAuthUrl}/recover`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ email }),
      })

      if (response.status === 200) {
        return { success: true }
      } else {
        const data = await response.json()
        return { success: false, error: data.message || 'Failed to send reset email' }
      }
    } catch (error) {
      return { success: false, error: 'Network error' }
    }
  }

  async signInWithGoogle(): Promise<void> {
    const redirectUrl = typeof window !== 'undefined' 
      ? `${window.location.origin}/auth/callback`
      : 'http://localhost:3000/auth/callback'
    
    const scopes = 'email profile'
    const encodedRedirect = encodeURIComponent(redirectUrl)
    const encodedScopes = encodeURIComponent(scopes)

    const authUrl = `${supabaseAuthUrl}/authorize?provider=google&redirect_to=${encodedRedirect}&scopes=${encodedScopes}`
    
    if (typeof window !== 'undefined') {
      window.location.href = authUrl
    }
  }

  async handleCallback(): Promise<{ success: boolean; error?: string }> {
    if (typeof window === 'undefined') return { success: false, error: 'No window' }

    const hash = window.location.hash.substring(1)
    const params = new URLSearchParams(hash)
    const accessToken = params.get('access_token')
    const refreshToken = params.get('refresh_token')
    const expiresAt = params.get('expires_at')

    if (!accessToken || !refreshToken) {
      return { success: false, error: 'Missing tokens' }
    }

    try {
      const response = await fetch(`${supabaseAuthUrl}/user`, {
        method: 'GET',
        headers: {
          'apikey': supabaseConfig.anonKey,
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      })

      if (response.status !== 200) {
        return { success: false, error: 'Failed to get user' }
      }

      const user = await response.json()
      
      this.saveSession({
        access_token: accessToken,
        refresh_token: refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.user_metadata?.display_name || user.user_metadata?.name || user.email?.split('@')[0],
          avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture,
        },
      })

      window.dispatchEvent(new Event('auth-state-change'))
      window.history.replaceState({}, document.title, window.location.pathname)
      return { success: true }
    } catch (error) {
      return { success: false, error: 'Failed to process callback' }
    }
  }
}

export const supabaseAuth = new SupabaseAuth()
