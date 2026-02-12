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

  async createReminder(input: ReminderInput): Promise<SupabaseReminder | null> {
    this.accessToken = supabaseAuth.currentAccessToken
    
    if (!this.accessToken) {
      console.log('No access token, using local storage only')
      return null
    }

    try {
      const response = await fetch(`${API_URL}/rest/v1/reminders`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          title: input.title,
          notes: input.notes,
          due_date: input.dueDate.toISOString(),
          priority: input.priority,
          recurrence: input.recurrence,
        }),
      })

      if (!response.ok) {
        console.error('Failed to create reminder in Supabase:', response.status)
        return null
      }

      const data = await response.json()
      console.log('Reminder created in Supabase:', data)
      return data
    } catch (error) {
      console.error('Error creating reminder in Supabase:', error)
      return null
    }
  }

  async updateReminder(id: string, updates: Partial<ReminderInput> & { isCompleted?: boolean }): Promise<boolean> {
    this.accessToken = supabaseAuth.currentAccessToken
    
    if (!this.accessToken) {
      console.log('No access token, using local storage only')
      return false
    }

    try {
      const body: Record<string, any> = {}
      
      if (updates.title !== undefined) body.title = updates.title
      if (updates.notes !== undefined) body.notes = updates.notes
      if (updates.dueDate !== undefined) body.due_date = updates.dueDate.toISOString()
      if (updates.priority !== undefined) body.priority = updates.priority
      if (updates.isCompleted !== undefined) {
        body.is_completed = updates.isCompleted
        body.completed_at = updates.isCompleted ? new Date().toISOString() : null
      }
      if (updates.recurrence !== undefined) body.recurrence = updates.recurrence

      const response = await fetch(`${API_URL}/rest/v1/reminders?id=eq.${id}`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        console.error('Failed to update reminder in Supabase:', response.status)
        return false
      }

      console.log('Reminder updated in Supabase:', id)
      return true
    } catch (error) {
      console.error('Error updating reminder in Supabase:', error)
      return false
    }
  }

  async deleteReminder(id: string): Promise<boolean> {
    this.accessToken = supabaseAuth.currentAccessToken
    
    if (!this.accessToken) {
      console.log('No access token, using local storage only')
      return false
    }

    try {
      const response = await fetch(`${API_URL}/rest/v1/reminders?id=eq.${id}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      })

      if (!response.ok) {
        console.error('Failed to delete reminder in Supabase:', response.status)
        return false
      }

      console.log('Reminder deleted from Supabase:', id)
      return true
    } catch (error) {
      console.error('Error deleting reminder from Supabase:', error)
      return false
    }
  }

  async fetchReminders(): Promise<SupabaseReminder[]> {
    this.accessToken = supabaseAuth.currentAccessToken
    
    if (!this.accessToken) {
      console.log('No access token, returning empty array')
      return []
    }

    try {
      const response = await fetch(
        `${API_URL}/rest/v1/reminders?order=due_date.asc`,
        {
          method: 'GET',
          headers: this.getHeaders(),
        }
      )

      if (!response.ok) {
        console.error('Failed to fetch reminders from Supabase:', response.status)
        return []
      }

      const data = await response.json()
      console.log('Fetched reminders from Supabase:', data.length)
      return data
    } catch (error) {
      console.error('Error fetching reminders from Supabase:', error)
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
