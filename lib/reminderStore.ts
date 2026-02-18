import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { reminderSyncService, SupabaseReminder, ReminderInput } from './reminderSync'

const generateId = () => crypto.randomUUID()

export interface Reminder {
  id: string
  title: string
  notes?: string
  dueDate: Date
  priority: 'high' | 'medium' | 'low'
  completed: boolean
  recurrence?: string
  createdAt: Date
}

interface ReminderStore {
  reminders: Reminder[]
  isLoading: boolean
  lastSynced: string | null
  addReminder: (rem: Partial<Reminder> & { title: string }) => void
  updateReminder: (id: string, updates: Partial<Reminder>) => void
  deleteReminder: (id: string) => void
  toggleReminder: (id: string) => void
  syncFromSupabase: () => Promise<void>
  syncToSupabase: () => Promise<void>
}

const convertToLocal = (supabaseReminder: SupabaseReminder): Reminder => ({
  id: supabaseReminder.id,
  title: supabaseReminder.title,
  notes: supabaseReminder.notes,
  dueDate: new Date(supabaseReminder.due_date),
  priority: supabaseReminder.priority,
  completed: supabaseReminder.is_completed,
  recurrence: supabaseReminder.recurrence,
  createdAt: new Date(supabaseReminder.created_at),
})

const convertToInput = (reminder: Reminder): ReminderInput => ({
  title: reminder.title,
  notes: reminder.notes,
  dueDate: typeof reminder.dueDate === 'string' ? new Date(reminder.dueDate) : reminder.dueDate,
  priority: reminder.priority,
  recurrence: reminder.recurrence,
})

export const useReminderStore = create<ReminderStore>()(
  persist(
    (set, get) => ({
      reminders: [],
      isLoading: false,
      lastSynced: null,

      addReminder: (rem) => {
        console.log('useReminderStore.addReminder called:', rem)
        
        const newReminder: Reminder = {
          ...rem,
          id: rem.id || generateId(),
          createdAt: rem.createdAt || new Date(),
          completed: rem.completed ?? false,
          dueDate: rem.dueDate ? new Date(rem.dueDate) : new Date(),
          priority: rem.priority || 'medium',
        }
        
        set((state) => ({
          reminders: [...state.reminders, newReminder]
        }))
        
        console.log('Reminders after add:', get().reminders)
        
        // Sync to Supabase in background (only if no ID - meaning it's a new local reminder)
        if (!rem.id) {
          reminderSyncService.createReminder(convertToInput(newReminder))
        }
      },

      updateReminder: (id, updates) => {
        set((state) => ({
          reminders: state.reminders.map((r) =>
            r.id === id ? { ...r, ...updates } : r
          )
        }))
        
        // Sync to Supabase
        const reminder = get().reminders.find(r => r.id === id)
        if (reminder) {
          reminderSyncService.updateReminder(id, convertToInput(reminder))
        }
      },

      deleteReminder: (id) => {
        set((state) => ({
          reminders: state.reminders.filter((r) => r.id !== id)
        }))
        
        // Sync to Supabase
        reminderSyncService.deleteReminder(id)
      },

      toggleReminder: (id) => {
        set((state) => ({
          reminders: state.reminders.map((r) =>
            r.id === id ? { ...r, completed: !r.completed } : r
          )
        }))
        
        // Sync to Supabase
        const reminder = get().reminders.find(r => r.id === id)
        if (reminder) {
          reminderSyncService.updateReminder(id, { 
            ...convertToInput(reminder), 
            isCompleted: !reminder.completed 
          })
        }
      },

      syncFromSupabase: async () => {
        set({ isLoading: true })
        console.log('Syncing from Supabase...')
        
        const supabaseReminders = await reminderSyncService.fetchReminders()
        
        if (supabaseReminders.length > 0) {
          const localReminders = supabaseReminders.map(convertToLocal)
          set({ reminders: localReminders, lastSynced: new Date().toISOString() })
          console.log('Synced from Supabase:', localReminders.length, 'reminders')
        }
        
        set({ isLoading: false })
      },

      syncToSupabase: async () => {
        set({ isLoading: true })
        console.log('Syncing to Supabase...')
        
        const result = await reminderSyncService.syncReminders(
          get().reminders.map(convertToInput)
        )
        
        if (result.success) {
          console.log('Synced to Supabase:', result.synced, 'reminders')
          set({ lastSynced: new Date().toISOString() })
        } else {
          console.error('Failed to sync to Supabase:', result)
        }
        
        set({ isLoading: false })
      },
    }),
    {
      name: 'nudge-reminders-v1',
    }
  )
)
