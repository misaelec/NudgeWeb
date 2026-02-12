import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

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
  addReminder: (rem: Omit<Reminder, 'id' | 'createdAt' | 'completed'>) => void
  updateReminder: (id: string, updates: Partial<Reminder>) => void
  deleteReminder: (id: string) => void
  toggleReminder: (id: string) => void
  markReminderComplete: (id: string) => void
}

export const useReminderStore = create<ReminderStore>()(
  persist(
    (set, get) => ({
      reminders: [],

      addReminder: (rem) => {
        console.log('useReminderStore.addReminder called:', rem)
        set((state) => ({
          reminders: [...state.reminders, {
            ...rem,
            id: generateId(),
            createdAt: new Date(),
            completed: false,
          }]
        }))
        console.log('Reminders after add:', get().reminders)
      },

      updateReminder: (id, updates) => set((state) => ({
        reminders: state.reminders.map((r) =>
          r.id === id ? { ...r, ...updates } : r
        )
      })),

      deleteReminder: (id) => set((state) => ({
        reminders: state.reminders.filter((r) => r.id !== id)
      })),

      toggleReminder: (id) => set((state) => ({
        reminders: state.reminders.map((r) =>
          r.id === id ? { ...r, completed: !r.completed } : r
        )
      })),

      markReminderComplete: (id) => set((state) => ({
        reminders: state.reminders.map((r) =>
          r.id === id ? { ...r, completed: true } : r
        )
      })),
    }),
    {
      name: 'nudge-reminders-v1',
    }
  )
)
