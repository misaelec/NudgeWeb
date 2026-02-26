import { supabaseConfig } from './supabase'
import { supabaseAuth } from './auth'

const API_URL = supabaseConfig.projectUrl

export interface SupabaseReminder {
  id: string
  user_id: string
  title: string
  notes?: string
  due_date: string
  priority: 'high' | 'medium' | 'low'
  is_completed: boolean
  completed_at?: string
  recurrence?: string
  created_at: string
  updated_at: string
}

export interface ReminderInput {
  title: string
  notes?: string
  dueDate: Date
  priority: 'high' | 'medium' | 'low'
  recurrence?: string
}

class ReminderSyncService {
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

  private getUserId(): string | null {
    if (typeof window === 'undefined') return null
    const stored = localStorage.getItem('supabase_session')
    if (stored) {
      try {
        const session = JSON.parse(stored)
        return session.user?.id || null
      } catch {
        return null
      }
    }
    return null
  }

  async createReminder(input: ReminderInput): Promise<SupabaseReminder | null> {
    this.accessToken = supabaseAuth.currentAccessToken
    const userId = this.getUserId()
    
    if (!this.accessToken || !userId) {
      return null
    }

    try {
      const response = await fetch(`${API_URL}/rest/v1/reminders`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          user_id: userId,
          title: input.title,
          notes: input.notes || null,
          due_date: input.dueDate ? new Date(input.dueDate).toISOString() : null,
          priority: input.priority,
          recurrence: input.recurrence || null,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Failed to create reminder in Supabase:', response.status, errorText)
        return null
      }

      const text = await response.text()
      if (!text) {
        return null
      }
      
      const data = JSON.parse(text)
      return data
    } catch (error) {
      return null
    }
  }

  async updateReminder(id: string, updates: Partial<ReminderInput> & { isCompleted?: boolean }): Promise<boolean> {
    this.accessToken = supabaseAuth.currentAccessToken
    const userId = this.getUserId()
    
    if (!this.accessToken || !userId) {
      return false
    }

    try {
      const body: Record<string, any> = {}
      
      if (updates.title !== undefined) body.title = updates.title
      if (updates.notes !== undefined) body.notes = updates.notes || null
      if (updates.dueDate !== undefined) body.due_date = updates.dueDate ? new Date(updates.dueDate).toISOString() : null
      if (updates.priority !== undefined) body.priority = updates.priority
      if (updates.isCompleted !== undefined) {
        body.is_completed = updates.isCompleted
        body.completed_at = updates.isCompleted ? new Date().toISOString() : null
      }
      if (updates.recurrence !== undefined) body.recurrence = updates.recurrence || null

      const response = await fetch(`${API_URL}/rest/v1/reminders?id=eq.${id}&user_id=eq.${userId}`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Failed to update reminder in Supabase:', response.status, errorText)
        return false
      }

      const text = await response.text()
      if (text) {
        try {
          JSON.parse(text)
        } catch {
          // ignore
        }
      }
      return true
    } catch (error) {
      return false
    }
  }

  async deleteReminder(id: string): Promise<boolean> {
    this.accessToken = supabaseAuth.currentAccessToken
    const userId = this.getUserId()
    
    if (!this.accessToken || !userId) {
      return false
    }

    try {
      const response = await fetch(`${API_URL}/rest/v1/reminders?id=eq.${id}&user_id=eq.${userId}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      })

      if (!response.ok) {
        return false
      }

      return true
    } catch (error) {
      return false
    }
  }

  async fetchReminders(): Promise<SupabaseReminder[]> {
    this.accessToken = supabaseAuth.currentAccessToken
    const userId = this.getUserId()
    
    if (!this.accessToken || !userId) {
      return []
    }

    try {
      const response = await fetch(
        `${API_URL}/rest/v1/reminders?user_id=eq.${userId}&order=due_date.asc`,
        {
          method: 'GET',
          headers: this.getHeaders(),
        }
      )

      if (!response.ok) {
        return []
      }

      const data = await response.json()
      return data
    } catch (error) {
      return []
    }
  }

  async syncReminders(localReminders: ReminderInput[]): Promise<{ success: boolean; synced: number; failed: number }> {
    this.accessToken = supabaseAuth.currentAccessToken
    
    if (!this.accessToken) {
      return { success: false, synced: 0, failed: 0 }
    }

    let synced = 0
    let failed = 0

    for (const reminder of localReminders) {
      const result = await this.createReminder(reminder)
      if (result) {
        synced++
      } else {
        failed++
      }
    }

    return { success: failed === 0, synced, failed }
  }
}

export const reminderSyncService = new ReminderSyncService()
