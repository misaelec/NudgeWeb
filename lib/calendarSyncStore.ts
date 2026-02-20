import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'

export type CalendarProvider = 'google' | 'apple' | 'outlook' | 'nudge'
export type VisibilityType = 'busy' | 'full' | 'blocked'
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
      
      set({
        calendars: data.calendars.map((c: any) => ({
          id: c.id,
          userId: c.user_id,
          provider: c.provider,
          accountEmail: c.account_email,
          accountName: c.account_name,
          calendarId: c.calendar_id,
          isPrimary: c.is_primary,
          color: c.color,
          createdAt: new Date(c.created_at),
          updatedAt: new Date(c.updated_at),
        })),
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

  addSyncRule: (rule) => set((state) => ({
    syncRules: [...state.syncRules, {
      ...rule,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }]
  })),

  removeSyncRule: (id) => set((state) => ({
    syncRules: state.syncRules.filter(r => r.id !== id)
  })),

  updateSyncRule: (id, updates) => set((state) => ({
    syncRules: state.syncRules.map(r =>
      r.id === id ? { ...r, ...updates, updatedAt: new Date() } : r
    )
  })),

  toggleSyncRule: (id) => set((state) => ({
    syncRules: state.syncRules.map(r =>
      r.id === id ? { ...r, isEnabled: !r.isEnabled, updatedAt: new Date() } : r
    )
  })),

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
