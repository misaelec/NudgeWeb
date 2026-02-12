import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

const STORAGE_VERSION = 'nudge-storage-v2'

export interface Objective {
  id: string
  title: string
  description: string
  category: 'work' | 'personal' | 'health' | 'learning'
  priority: 'high' | 'medium' | 'low'
  progress: number
  keyResults: KeyResult[]
  createdAt: Date
  dueDate?: Date
  completed: boolean
}

export interface KeyResult {
  id: string
  title: string
  completed: boolean
  progress: number
}

export interface FearObjective {
  id: string
  fear: string
  why: string
  prevention: string
  repair: string
  actionSteps: ActionStep[]
  reflections: Reflection[]
  status: 'active' | 'resolved' | 'abandoned'
  createdAt: Date
}

export interface ActionStep {
  id: string
  title: string
  completed: boolean
  createdAt: Date
}

export interface Reflection {
  id: string
  question: string
  answer: string
  createdAt: Date
}

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

export interface CalendarEvent {
  id: string
  title: string
  description?: string
  startDate: Date
  endDate: Date
  location?: string
  color: string
  sourceType: 'local' | 'google' | 'apple'
  createdAt: Date
}

export interface JournalEntry {
  id: string
  content: string
  mood?: string
  tags: string[]
  createdAt: Date
}

export interface Streak {
  type: 'journal' | 'focus' | 'reminders' | 'objectives'
  currentCount: number
  longestCount: number
  lastCompletedDate: string
}

export interface UserPreferences {
  remindersEnabled: boolean
  calendarEnabled: boolean
  eventsEnabled: boolean
  pomodoroEnabled: boolean
  appBlockingEnabled: boolean
  journalEnabled: boolean
  objectivesEnabled: boolean
  visualEffectsEnabled: boolean
  darkMode: 'light' | 'dark' | 'system'
  notificationsEnabled: boolean
  reminderNotifications: boolean
  focusNotifications: boolean
  streakNotifications: boolean
}

interface AppState {
  objectives: Objective[]
  fearObjectives: FearObjective[]
  reminders: Reminder[]
  calendarEvents: CalendarEvent[]
  journalEntries: JournalEntry[]
  pomodoroSessions: number
  totalFocusMinutes: number
  streaks: Record<string, Streak>
  featureFlags: Record<string, boolean>
  preferences: UserPreferences
  searchQuery: string

  objectiveActions: {
    addObjective: (obj: Omit<Objective, 'id' | 'createdAt' | 'completed' | 'keyResults' | 'progress'>) => void
    updateObjective: (id: string, updates: Partial<Objective>) => void
    deleteObjective: (id: string) => void
    addKeyResult: (objectiveId: string, kr: Omit<KeyResult, 'id'>) => void
    toggleKeyResult: (objectiveId: string, keyResultId: string) => void
  }

  fearActions: {
    addFearObjective: (fear: Omit<FearObjective, 'id' | 'createdAt' | 'actionSteps' | 'reflections'>) => void
    updateFearObjective: (id: string, updates: Partial<FearObjective>) => void
    deleteFearObjective: (id: string) => void
    addActionStep: (fearId: string, step: Omit<ActionStep, 'id' | 'createdAt'>) => void
    toggleActionStep: (fearId: string, stepId: string) => void
    addReflection: (fearId: string, reflection: Omit<Reflection, 'id' | 'createdAt'>) => void
  }

  reminderActions: {
    addReminder: (rem: Omit<Reminder, 'id' | 'createdAt' | 'completed'>) => void
    updateReminder: (id: string, updates: Partial<Reminder>) => void
    deleteReminder: (id: string) => void
    toggleReminder: (id: string) => void
    markReminderComplete: (id: string) => void
  }

  calendarActions: {
    addEvent: (event: Omit<CalendarEvent, 'id' | 'createdAt'>) => void
    updateEvent: (id: string, updates: Partial<CalendarEvent>) => void
    deleteEvent: (id: string) => void
  }

  journalActions: {
    addEntry: (entry: Omit<JournalEntry, 'id' | 'createdAt'>) => void
    deleteEntry: (id: string) => void
  }

  pomodoroActions: {
    completeSession: (minutes: number) => void
    reset: () => void
  }

  streakActions: {
    incrementStreak: (type: Streak['type']) => void
    checkAndUpdateStreaks: () => void
  }

  settingsActions: {
    toggleFeature: (key: string) => void
    updatePreferences: (updates: Partial<UserPreferences>) => void
  }

  setSearchQuery: (query: string) => void
}

const defaultPreferences: UserPreferences = {
  remindersEnabled: true,
  calendarEnabled: true,
  eventsEnabled: true,
  pomodoroEnabled: true,
  appBlockingEnabled: true,
  journalEnabled: true,
  objectivesEnabled: true,
  visualEffectsEnabled: true,
  darkMode: 'dark',
  notificationsEnabled: true,
  reminderNotifications: true,
  focusNotifications: true,
  streakNotifications: true,
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      objectives: [],
      fearObjectives: [],
      reminders: [],
      calendarEvents: [],
      journalEntries: [],
      pomodoroSessions: 0,
      totalFocusMinutes: 0,
      streaks: {
        journal: { type: 'journal', currentCount: 0, longestCount: 0, lastCompletedDate: '' },
        focus: { type: 'focus', currentCount: 0, longestCount: 0, lastCompletedDate: '' },
        reminders: { type: 'reminders', currentCount: 0, longestCount: 0, lastCompletedDate: '' },
        objectives: { type: 'objectives', currentCount: 0, longestCount: 0, lastCompletedDate: '' },
      },
      featureFlags: {
        reminders: true,
        calendar: true,
        events: true,
        pomodoro: true,
        appBlocking: true,
        journal: true,
        objectives: true,
      },
      preferences: defaultPreferences,
      searchQuery: '',

      objectiveActions: {
        addObjective: (obj) => set((state) => ({
          objectives: [...state.objectives, {
            ...obj,
            id: generateId(),
            createdAt: new Date(),
            completed: false,
            keyResults: [],
            progress: 0,
          }]
        })),
        updateObjective: (id, updates) => set((state) => ({
          objectives: state.objectives.map((o) =>
            o.id === id ? { ...o, ...updates } : o
          )
        })),
        deleteObjective: (id) => set((state) => ({
          objectives: state.objectives.filter((o) => o.id !== id)
        })),
        addKeyResult: (objectiveId, kr) => set((state) => ({
          objectives: state.objectives.map((o) =>
            o.id === objectiveId
              ? { ...o, keyResults: [...o.keyResults, { ...kr, id: generateId() }] }
              : o
          )
        })),
        toggleKeyResult: (objectiveId, keyResultId) => set((state) => ({
          objectives: state.objectives.map((o) =>
            o.id === objectiveId
              ? {
                  ...o,
                  keyResults: o.keyResults.map((kr) =>
                    kr.id === keyResultId
                      ? { ...kr, completed: !kr.completed, progress: kr.completed ? 0 : 100 }
                      : kr
                  ),
                  progress: calculateObjectiveProgress(
                    o.keyResults.map((kr) =>
                      kr.id === keyResultId ? { ...kr, completed: !kr.completed } : kr
                    )
                  )
                }
              : o
          )
        })),
      },

      fearActions: {
        addFearObjective: (fear) => set((state) => ({
          fearObjectives: [...state.fearObjectives, {
            ...fear,
            id: generateId(),
            createdAt: new Date(),
            actionSteps: [],
            reflections: [],
          }]
        })),
        updateFearObjective: (id, updates) => set((state) => ({
          fearObjectives: state.fearObjectives.map((f) =>
            f.id === id ? { ...f, ...updates } : f
          )
        })),
        deleteFearObjective: (id) => set((state) => ({
          fearObjectives: state.fearObjectives.filter((f) => f.id !== id)
        })),
        addActionStep: (fearId, step) => set((state) => ({
          fearObjectives: state.fearObjectives.map((f) =>
            f.id === fearId
              ? { ...f, actionSteps: [...f.actionSteps, { ...step, id: generateId(), createdAt: new Date() }] }
              : f
          )
        })),
        toggleActionStep: (fearId, stepId) => set((state) => ({
          fearObjectives: state.fearObjectives.map((f) =>
            f.id === fearId
              ? {
                  ...f,
                  actionSteps: f.actionSteps.map((s) =>
                    s.id === stepId ? { ...s, completed: !s.completed } : s
                  )
                }
              : f
          )
        })),
        addReflection: (fearId, reflection) => set((state) => ({
          fearObjectives: state.fearObjectives.map((f) =>
            f.id === fearId
              ? { ...f, reflections: [...f.reflections, { ...reflection, id: generateId(), createdAt: new Date() }] }
              : f
          )
        })),
      },

      reminderActions: {
        addReminder: (rem) => set((state) => ({
          reminders: [...state.reminders, {
            ...rem,
            id: generateId(),
            createdAt: new Date(),
            completed: false,
          }]
        })),
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
        markReminderComplete: (id) => {
          set((state) => ({
            reminders: state.reminders.map((r) =>
              r.id === id ? { ...r, completed: true } : r
            )
          }))
          get().streakActions.incrementStreak('reminders')
        },
      },

      calendarActions: {
        addEvent: (event) => set((state) => ({
          calendarEvents: [...state.calendarEvents, {
            ...event,
            id: generateId(),
            createdAt: new Date(),
          }]
        })),
        updateEvent: (id, updates) => set((state) => ({
          calendarEvents: state.calendarEvents.map((e) =>
            e.id === id ? { ...e, ...updates } : e
          )
        })),
        deleteEvent: (id) => set((state) => ({
          calendarEvents: state.calendarEvents.filter((e) => e.id !== id)
        })),
      },

      journalActions: {
        addEntry: (entry) => set((state) => {
          get().streakActions.incrementStreak('journal')
          return {
            journalEntries: [...state.journalEntries, {
              ...entry,
              id: generateId(),
              createdAt: new Date(),
            }]
          }
        }),
        deleteEntry: (id) => set((state) => ({
          journalEntries: state.journalEntries.filter((e) => e.id !== id)
        })),
      },

      pomodoroActions: {
        completeSession: (minutes) => {
          set((state) => ({
            pomodoroSessions: state.pomodoroSessions + 1,
            totalFocusMinutes: state.totalFocusMinutes + minutes,
          }))
          get().streakActions.incrementStreak('focus')
        },
        reset: () => set({ pomodoroSessions: 0, totalFocusMinutes: 0 }),
      },

      streakActions: {
        incrementStreak: (type) => set((state) => {
          const today = new Date().toISOString().split('T')[0]
          const streak = state.streaks[type]
          
          if (streak.lastCompletedDate === today) {
            return { streaks: { ...state.streaks } }
          }

          const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
          const isConsecutive = streak.lastCompletedDate === yesterday || streak.lastCompletedDate === today
          
          const newCount = isConsecutive ? streak.currentCount + 1 : 1
          const newLongest = Math.max(newCount, streak.longestCount)

          return {
            streaks: {
              ...state.streaks,
              [type]: {
                ...streak,
                currentCount: newCount,
                longestCount: newLongest,
                lastCompletedDate: today,
              }
            }
          }
        }),
        checkAndUpdateStreaks: () => set((state) => {
          const today = new Date().toISOString().split('T')[0]
          const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
          
          const updatedStreaks = { ...state.streaks }
          
          Object.keys(updatedStreaks).forEach((key) => {
            const streak = updatedStreaks[key]
            if (streak.lastCompletedDate !== today && streak.lastCompletedDate !== yesterday) {
              updatedStreaks[key] = { ...streak, currentCount: 0 }
            }
          })
          
          return { streaks: updatedStreaks }
        }),
      },

      settingsActions: {
        toggleFeature: (key) => set((state) => ({
          featureFlags: { ...state.featureFlags, [key]: !state.featureFlags[key] }
        })),
        updatePreferences: (updates) => set((state) => ({
          preferences: { ...state.preferences, ...updates }
        })),
      },

      setSearchQuery: (query) => set({ searchQuery: query }),
    }),
    {
      name: STORAGE_VERSION,
    }
  )
)

function calculateObjectiveProgress(keyResults: KeyResult[]): number {
  if (keyResults.length === 0) return 0
  const completed = keyResults.filter((kr) => kr.completed).length
  return Math.round((completed / keyResults.length) * 100)
}
