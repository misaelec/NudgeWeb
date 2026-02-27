'use client'

import { createBrowserClient } from '@supabase/ssr'
import { supabaseConfig } from './supabase'

/**
 * Cookie-based Supabase client for auth operations (login, OAuth, magic links).
 * Uses @supabase/ssr which stores the PKCE code_verifier in cookies instead of
 * localStorage, so it survives cross-tab navigation (e.g. clicking a magic link).
 */
export function getAuthClient() {
  return createBrowserClient(
    supabaseConfig.projectUrl,
    supabaseConfig.anonKey,
    {
      isSingleton: true,
      auth: {
        flowType: 'pkce',
      },
    }
  )
}
