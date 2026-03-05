import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'

export type CalendarProvider = 'google' | 'apple' | 'outlook' | 'nudge'
export type VisibilityType = 'busy' | 'full' | 'title_only'
export type SyncDirection = 'one_way' | 'bidirectional'

export interface ConnectedCalendar {
  id: string
  userId: string
  provider: CalendarProvider
  accountEmail: string
  accountName?: string
  calendarId?: string
  isPrimary: boolean
  color: string
  webhookChannelId?: string | null
  webhookExpiration?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface CalendarSyncRule {
  id: string
  userId: string
  sourceCalendarId: string
  targetCalendarId: string
  isEnabled: boolean
  visibilityType: VisibilityType
  syncDirection: SyncDirection
  createdAt: Date
  updatedAt: Date
}

interface CalendarSyncState {
  calendars: ConnectedCalendar[]
  syncRules: CalendarSyncRule[]
  isLoading: boolean
  error: string | null

  // Calendar actions
  addCalendar: (calendar: Omit<ConnectedCalendar, 'id' | 'createdAt' | 'updatedAt'>) => void
  removeCalendar: (id: string) => void
  updateCalendar: (id: string, updates: Partial<ConnectedCalendar>) => void
  setCalendars: (calendars: ConnectedCalendar[]) => void
  fetchConnectedCalendars: (userId: string) => Promise<void>

  // Sync rule actions
  addSyncRule: (rule: Omit<CalendarSyncRule, 'id' | 'createdAt' | 'updatedAt'>) => void
  removeSyncRule: (id: string) => void
  updateSyncRule: (id: string, updates: Partial<CalendarSyncRule>) => void
  toggleSyncRule: (id: string) => void
  setSyncRules: (rules: CalendarSyncRule[]) => void

  // Utilities
  getCalendarsByProvider: (provider: CalendarProvider) => ConnectedCalendar[]
  getRulesForSource: (sourceCalendarId: string) => CalendarSyncRule[]
  getRulesForTarget: (targetCalendarId: string) => CalendarSyncRule[]
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useCalendarSyncStore = create<CalendarSyncState>((set, get) => ({
  calendars: [],
  syncRules: [],
  isLoading: false,
  error: null,

  fetchConnectedCalendars: async (userId) => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch(`/api/calendar/list?t=${Date.now()}`, {
        headers: { 'x-user-id': userId }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch calendars')
      }

      const data = await response.json()

      const mappedCalendars = data.calendars.map((c: any) => ({
        id: c.id,
        userId: c.user_id,
        provider: c.provider,
        accountEmail: c.account_email,
        accountName: c.account_name,
        calendarId: c.calendar_id,
        isPrimary: c.is_primary,
        color: c.color,
        webhookChannelId: c.webhook_channel_id,
        webhookExpiration: c.webhook_expiration,
        createdAt: new Date(c.created_at),
        updatedAt: new Date(c.updated_at),
      }))

      set({
        calendars: mappedCalendars,
        syncRules: (data.rules || []).map((r: any) => ({
          id: r.id,
          userId: r.user_id,
          sourceCalendarId: r.source_calendar_id,
          targetCalendarId: r.target_calendar_id,
          isEnabled: r.is_enabled,
          visibilityType: r.visibility_type,
          syncDirection: r.sync_direction,
          createdAt: new Date(r.created_at),
          updatedAt: new Date(r.updated_at),
        })),
        isLoading: false
      })

      // JIT webhook renewal: silently renew webhooks expiring within 48 hours
      const fortyEightHoursFromNow = Date.now() + 48 * 60 * 60 * 1000
      for (const cal of mappedCalendars) {
        if (cal.provider !== 'google') continue
        const needsRenewal = !cal.webhookChannelId ||
          !cal.webhookExpiration ||
          new Date(cal.webhookExpiration).getTime() < fortyEightHoursFromNow

        if (needsRenewal) {
          fetch('/api/calendar/renew-webhook', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ calendar_id: cal.id }),
          }).catch((e) => console.error('JIT webhook renewal failed:', e))
        }
      }
    } catch (error) {
      console.error('Error fetching calendars:', error)
      set({ isLoading: false, error: 'Failed to fetch calendars' })
    }
  },

  addCalendar: (calendar) => set((state) => ({
    calendars: [...state.calendars, {
      ...calendar,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }]
  })),

  removeCalendar: (id) => set((state) => ({
    calendars: state.calendars.filter(c => c.id !== id),
    syncRules: state.syncRules.filter(
      r => r.sourceCalendarId !== id && r.targetCalendarId !== id
    )
  })),

  updateCalendar: (id, updates) => set((state) => ({
    calendars: state.calendars.map(c =>
      c.id === id ? { ...c, ...updates, updatedAt: new Date() } : c
    )
  })),

  setCalendars: (calendars) => set({ calendars }),

  addSyncRule: async (rule) => {
    const tempId = uuidv4()
    set((state) => ({
      syncRules: [...state.syncRules, {
        ...rule,
        id: tempId,
        createdAt: new Date(),
        updatedAt: new Date(),
      }]
    }))
    
    try {
      const response = await fetch('/api/calendar/sync-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: rule.userId,
          source_calendar_id: rule.sourceCalendarId,
          target_calendar_id: rule.targetCalendarId,
          visibility_type: rule.visibilityType,
          sync_direction: rule.syncDirection,
        })
      })
      console.log('addSyncRule response:', response.status)
      const data = await response.json()
      console.log('addSyncRule data:', data)
      if (data.rule) {
        set((state) => ({
          syncRules: state.syncRules.map(r => 
            r.id === tempId ? { ...r, id: data.rule.id } : r
          )
        }))
      }
    } catch (error) {
      console.error('Error creating sync rule:', error)
    }
  },

  removeSyncRule: async (id) => {
    const state = get()
    const rule = state.syncRules.find(r => r.id === id)
    set((state) => ({
      syncRules: state.syncRules.filter(r => r.id !== id)
    }))
    
    try {
      await fetch(`/api/calendar/sync-rules?rule_id=${id}`, { method: 'DELETE' })
    } catch (error) {
      console.error('Error deleting sync rule:', error)
      if (rule) {
        set((state) => ({ syncRules: [...state.syncRules, rule] }))
      }
    }
  },

  updateSyncRule: async (id, updates) => {
    const state = get()
    const oldRule = state.syncRules.find(r => r.id === id)
    set((state) => ({
      syncRules: state.syncRules.map(r =>
        r.id === id ? { ...r, ...updates, updatedAt: new Date() } : r
      )
    }))
    
    try {
      await fetch('/api/calendar/sync-rules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rule_id: id,
          updates: {
            is_enabled: updates.isEnabled,
            visibility_type: updates.visibilityType,
            sync_direction: updates.syncDirection,
          }
        })
      })
    } catch (error) {
      console.error('Error updating sync rule:', error)
      if (oldRule) {
        set((state) => ({
          syncRules: state.syncRules.map(r => r.id === id ? oldRule : r)
        }))
      }
    }
  },

  toggleSyncRule: async (id) => {
    const state = get()
    const rule = state.syncRules.find(r => r.id === id)
    if (!rule) return
    
    const newEnabled = !rule.isEnabled
    set((state) => ({
      syncRules: state.syncRules.map(r =>
        r.id === id ? { ...r, isEnabled: newEnabled, updatedAt: new Date() } : r
      )
    }))
    
    try {
      await fetch('/api/calendar/sync-rules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rule_id: id,
          updates: { is_enabled: newEnabled }
        })
      })
    } catch (error) {
      console.error('Error toggling sync rule:', error)
      if (rule) {
        set((state) => ({
          syncRules: state.syncRules.map(r => r.id === id ? rule : r)
        }))
      }
    }
  },

  setSyncRules: (rules) => set({ syncRules: rules }),

  getCalendarsByProvider: (provider) =>
    get().calendars.filter(c => c.provider === provider),

  getRulesForSource: (sourceCalendarId) =>
    get().syncRules.filter(r => r.sourceCalendarId === sourceCalendarId),

  getRulesForTarget: (targetCalendarId) =>
    get().syncRules.filter(r => r.targetCalendarId === targetCalendarId),

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}))
