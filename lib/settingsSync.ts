import { supabaseConfig } from './supabase'

const API_URL = supabaseConfig.projectUrl

export interface SupabaseUserPreferences {
  id: string
  user_id: string
  reminders_enabled: boolean
  calendar_enabled: boolean
  pomodoro_enabled: boolean
  journal_enabled: boolean
  visual_effects_enabled: boolean
  dark_mode: string
  notifications_enabled: boolean
  reminder_notifications: boolean
  focus_notifications: boolean
  streak_notifications: boolean
  created_at: string
  updated_at: string
}

export interface UserPreferencesInput {
  reminders_enabled?: boolean
  calendar_enabled?: boolean
  pomodoro_enabled?: boolean
  journal_enabled?: boolean
  visual_effects_enabled?: boolean
  dark_mode?: string
  notifications_enabled?: boolean
  reminder_notifications?: boolean
  focus_notifications?: boolean
  streak_notifications?: boolean
}

function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null
  const stored = localStorage.getItem('supabase_session')
  if (stored) {
    try {
      const session = JSON.parse(stored)
      return session.access_token || null
    } catch {
      return null
    }
  }
  return null
}

class SettingsSyncService {
  private getHeaders() {
    const token = getAccessToken()
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'apikey': supabaseConfig.anonKey,
    }
  }

  async fetchPreferences(): Promise<SupabaseUserPreferences | null> {
    const token = getAccessToken()
    if (!token) {
      return null
    }

    try {
      const res = await fetch(`${API_URL}/rest/v1/user_preferences?select=*`, {
        headers: this.getHeaders(),
      })

      if (!res.ok) {
        throw new Error(`Failed to fetch preferences: ${res.status}`)
      }

      const data = await res.json()
      return data[0] || null
    } catch (error) {
      console.error('Error fetching preferences from Supabase:', error)
      return null
    }
  }

  async updatePreferences(updates: UserPreferencesInput): Promise<boolean> {
    const token = getAccessToken()
    if (!token) {
      return false
    }

    try {
      const current = await this.fetchPreferences()
      if (!current) {
        return false
      }

      const res = await fetch(`${API_URL}/rest/v1/user_preferences?id=eq.${current.id}`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify(updates),
      })

      return res.ok
    } catch (error) {
      console.error('Error updating preferences in Supabase:', error)
      return false
    }
  }
}

export const settingsSyncService = new SettingsSyncService()
