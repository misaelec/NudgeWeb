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
  syncFromRealtime: (reminder: Partial<Reminder> & { id: string }, updates?: { isCompleted?: boolean, oldIsCompleted?: boolean }) => void
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
        
        // Sync to Supabase in background (only if no ID - meaning it's a new local reminder)
        if (!rem.id) {
          reminderSyncService.createReminder(convertToInput(newReminder), newReminder.id)
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
            isCompleted: reminder.completed 
          })
        }
      },

      setReminders: (reminders) => set({ reminders }),

      syncFromRealtime: (reminder, updates?) => {
        // skip
        set((state) => {
          const existing = state.reminders.find(r => r.id === reminder.id)
          
          // Skip if reminder doesn't exist locally
          if (!existing) {
            return { reminders: [...state.reminders, reminder as Reminder] }
          }
          
          // Skip completion status changes - preserve user's local toggle
          const isSameExceptCompletion = 
            existing.title === reminder.title &&
            existing.notes === reminder.notes &&
            existing.priority === reminder.priority &&
            (existing.dueDate?.getTime() === reminder.dueDate?.getTime())
          
          if (isSameExceptCompletion) {
            // skip
            return state
          }
          
          return {
            reminders: state.reminders.map(r => r.id === reminder.id ? { ...r, ...reminder } : r)
          }
        })
      },

      syncFromSupabase: async () => {
        set({ isLoading: true })
        
        const supabaseReminders = await reminderSyncService.fetchReminders()
        
        if (supabaseReminders.length > 0) {
          const localReminders = supabaseReminders.map(convertToLocal)
          set({ reminders: localReminders, lastSynced: new Date().toISOString() })
        }
        
        set({ isLoading: false })
      },

      syncToSupabase: async () => {
        set({ isLoading: true })
        
        const result = await reminderSyncService.syncReminders(
          get().reminders.map(convertToInput)
        )
        
        if (result.success) {
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
