'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

export const getURL = () => {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL

  if (siteUrl) {
    let url = siteUrl.includes('http') ? siteUrl : `https://${siteUrl}`
    url = url.charAt(url.length - 1) === '/' ? url : `${url}/`
    return `${url}auth/callback`
  }

  return 'http://localhost:3000/auth/callback'
}

export const supabaseConfig = {
  projectUrl: 'https://tdidckvdawyctcswoppi.supabase.co',
  anonKey: 'sb_publishable_4HHk7Qa7gY-Qnoa8dbCa6Q_ZnebZgQJ',
}

export const supabaseAuthUrl = `${supabaseConfig.projectUrl}/auth/v1`

let supabaseInstance: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    supabaseInstance = createBrowserClient(
      supabaseConfig.projectUrl,
      supabaseConfig.anonKey,
      {
        isSingleton: true,
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
          flowType: 'pkce',
        },
      }
    )
  }
  return supabaseInstance
}

export const supabase = getSupabaseClient()

export function syncSupabaseSession(accessToken: string, refreshToken: string) {
  if (supabaseInstance) {
    supabaseInstance.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    }).then(({ data, error }) => {
      if (error) {
        console.error('Error setting session:', error)
      }
    })
  }
}

export function getSupabaseAuthHeaders() {
  const stored = typeof window !== 'undefined' ? localStorage.getItem('supabase_session') : null
  if (stored) {
    try {
      const session = JSON.parse(stored)
      return {
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': supabaseConfig.anonKey,
      }
    } catch {
      return {}
    }
  }
  return {}
}
