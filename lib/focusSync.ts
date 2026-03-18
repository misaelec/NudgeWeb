import { supabaseConfig } from './supabase'
import { supabaseAuth } from './auth'

const API_URL = supabaseConfig.projectUrl

class FocusSyncService {
  private getHeaders() {
    const token = supabaseAuth.currentAccessToken
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'apikey': supabaseConfig.anonKey,
      'Prefer': 'return=minimal',
    }
  }

  private getUserId(): string | null {
    if (typeof window === 'undefined') return null
    try {
      const stored = localStorage.getItem('supabase_session')
      if (stored) return JSON.parse(stored)?.user?.id ?? null
    } catch {}
    return null
  }

  async saveSession(durationMinutes: number): Promise<void> {
    const userId = this.getUserId()
    if (!userId || !supabaseAuth.currentAccessToken) return
    try {
      await fetch(`${API_URL}/rest/v1/focus_sessions`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          user_id: userId,
          duration_minutes: durationMinutes,
          total_minutes: durationMinutes,
          sessions_completed: 1,
          is_completed: true,
          completed_at: new Date().toISOString(),
        }),
      })
    } catch {}
  }

  async loadTotals(): Promise<{ sessions: number; minutes: number } | null> {
    const userId = this.getUserId()
    if (!userId || !supabaseAuth.currentAccessToken) return null
    try {
      const res = await fetch(
        `${API_URL}/rest/v1/focus_sessions?user_id=eq.${userId}&select=duration_minutes`,
        { headers: this.getHeaders() }
      )
      if (!res.ok) return null
      const rows: { duration_minutes: number }[] = await res.json()
      return {
        sessions: rows.length,
        minutes: rows.reduce((sum, r) => sum + r.duration_minutes, 0),
      }
    } catch {
      return null
    }
  }

  async saveStreak(
    type: string,
    currentCount: number,
    longestCount: number,
    lastCompletedDate: string | null
  ): Promise<void> {
    const userId = this.getUserId()
    if (!userId || !supabaseAuth.currentAccessToken) return
    try {
      const headers = { ...this.getHeaders(), Prefer: 'resolution=merge-duplicates' }
      await fetch(`${API_URL}/rest/v1/streaks`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          user_id: userId,
          streak_type: type,
          current_count: currentCount,
          longest_count: longestCount,
          last_completed_date: lastCompletedDate,
          updated_at: new Date().toISOString(),
        }),
      })
    } catch {}
  }

  async loadStreaks(): Promise<Record<string, { currentCount: number; longestCount: number; lastCompletedDate: string | null }> | null> {
    const userId = this.getUserId()
    if (!userId || !supabaseAuth.currentAccessToken) return null
    try {
      const res = await fetch(
        `${API_URL}/rest/v1/streaks?user_id=eq.${userId}&select=streak_type,current_count,longest_count,last_completed_date`,
        { headers: this.getHeaders() }
      )
      if (!res.ok) return null
      const rows: { streak_type: string; current_count: number; longest_count: number; last_completed_date: string | null }[] = await res.json()
      const result: Record<string, { currentCount: number; longestCount: number; lastCompletedDate: string | null }> = {}
      for (const row of rows) {
        result[row.streak_type] = {
          currentCount: row.current_count,
          longestCount: row.longest_count,
          lastCompletedDate: row.last_completed_date,
        }
      }
      return result
    } catch {
      return null
    }
  }
}

export const focusSync = new FocusSyncService()
