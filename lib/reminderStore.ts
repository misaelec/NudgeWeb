import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import { reminderSyncService, SupabaseReminder, ReminderInput } from './reminderSync'

const generateId = () => uuidv4()

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
  updateReminder: (id: string, updates: Partial<Reminder>, skipSync?: boolean) => void
  deleteReminder: (id: string, skipSync?: boolean) => void
  toggleReminder: (id: string, skipSync?: boolean) => void
  setReminders: (reminders: Reminder[]) => void
  syncFromRealtime: (reminder: Partial<Reminder> & { id: string }, updates?: { isCompleted?: boolean }) => void
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

      updateReminder: (id, updates, skipSync = false) => {
        set((state) => ({
          reminders: state.reminders.map((r) =>
            r.id === id ? { ...r, ...updates } : r
          )
        }))
        
        if (skipSync) return
        
        const reminder = get().reminders.find(r => r.id === id)
        if (reminder) {
          reminderSyncService.updateReminder(id, convertToInput(reminder))
        }
      },

      deleteReminder: (id, skipSync = false) => {
        set((state) => ({
          reminders: state.reminders.filter((r) => r.id !== id)
        }))
        
        if (skipSync) return
        
        reminderSyncService.deleteReminder(id)
      },

      toggleReminder: (id, skipSync = false) => {
        set((state) => ({
          reminders: state.reminders.map((r) =>
            r.id === id ? { ...r, completed: !r.completed } : r
          )
        }))
        
        if (skipSync) return
        
        const reminder = get().reminders.find(r => r.id === id)
        if (reminder) {
          reminderSyncService.updateReminder(id, { 
            ...convertToInput(reminder), 
            isCompleted: !reminder.completed 
          })
        }
      },

      setReminders: (reminders) => set({ reminders }),

      syncFromRealtime: (reminder, updates?) => {
        set((state) => {
          const existing = state.reminders.find(r => r.id === reminder.id)
          if (existing) {
            const hasChanges = updates?.isCompleted !== undefined 
              ? existing.completed !== updates.isCompleted
              : false
            
            if (!hasChanges) {
              console.log('⏭️ No changes detected, skipping syncFromRealtime')
              return state
            }
            
            return {
              reminders: state.reminders.map(r => 
                r.id === reminder.id 
                  ? { ...r, ...reminder, completed: updates?.isCompleted ?? r.completed } 
                  : r
              )
            }
          }
          return {
            reminders: [...state.reminders, reminder as Reminder]
          }
        })
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
