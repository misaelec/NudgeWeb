import { supabaseConfig } from './supabase'
import { supabaseAuth } from './auth'

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

class SettingsSyncService {
  private accessToken: string | null = null

  setAccessToken(token: string) {
    this.accessToken = token
  }

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.accessToken}`,
      'apikey': supabaseConfig.anonKey,
    }
  }

  async fetchPreferences(): Promise<SupabaseUserPreferences | null> {
    this.accessToken = supabaseAuth.currentAccessToken
    
    if (!this.accessToken) {
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
    this.accessToken = supabaseAuth.currentAccessToken
    
    if (!this.accessToken) {
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
