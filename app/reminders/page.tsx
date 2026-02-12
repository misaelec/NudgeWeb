'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import { useAuth } from '@/components/Providers'
import { useStore } from '@/lib/store'
import {
  Plus,
  Bell,
  Clock,
  AlertCircle,
  CheckCircle2,
  Calendar,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { format } from 'date-fns'

export default function RemindersPage() {
  const { user, loading } = useAuth()
  const { reminderActions, featureFlags } = useStore()
  const [mounted, setMounted] = useState(false)
  const [showAddReminder, setShowAddReminder] = useState(false)
  const [showCompleted, setShowCompleted] = useState(false)
  const [newReminder, setNewReminder] = useState({
    title: '',
    notes: '',
    dueDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    priority: 'medium' as 'high' | 'medium' | 'low'
  })
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all')

  const { reminders } = useStore()

  useEffect(() => {
    setMounted(true)
  }, [])

  const filteredReminders = reminders.filter(r => {
    if (filter === 'pending') return !r.completed
    if (filter === 'completed') return r.completed
    return true
  })

  const pendingCount = reminders.filter(r => !r.completed).length
  const highPriorityCount = reminders.filter(r => !r.completed && r.priority === 'high').length

  const handleAddReminder = () => {
    if (!newReminder.title.trim()) return
    reminderActions.addReminder({
      title: newReminder.title,
      notes: newReminder.notes,
      dueDate: new Date(newReminder.dueDate),
      priority: newReminder.priority
    })
    setShowAddReminder(false)
    setNewReminder({ title: '', notes: '', dueDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"), priority: 'medium' })
  }

  const handleDeleteReminder = (id: string) => {
    reminderActions.deleteReminder(id)
  }

  if (loading || !mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-apple-gray-50">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-apple-blue/20 rounded-apple-xl animate-pulse" />
          <p className="text-apple-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  const isRemindersEnabled = featureFlags?.reminders !== false

  return (
    <div className="min-h-screen bg-apple-gray-50 dark:bg-apple-gray-950">
      <Sidebar />

      <main className="ml-64 p-8">
        <div className="max-w-4xl mx-auto">
          <header className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-semibold text-apple-gray-900 dark:text-white mb-2">
                Reminders
              </h1>
              <p className="text-apple-gray-500">
                {pendingCount} pending, {highPriorityCount} high priority
              </p>
            </div>
            {isRemindersEnabled && (
              <button
                onClick={() => setShowAddReminder(true)}
                className="btn-primary"
              >
                <Plus className="w-5 h-5 mr-2 inline" />
                Add Reminder
              </button>
            )}
          </header>

          {!isRemindersEnabled ? (
            <div className="card text-center py-12">
              <Bell className="w-16 h-16 mx-auto mb-4 text-apple-gray-300" />
              <h3 className="text-lg font-medium text-apple-gray-900 dark:text-white mb-2">
                Reminders Disabled
              </h3>
              <p className="text-apple-gray-500">
                Enable reminders in Settings to use this feature.
              </p>
            </div>
          ) : (
            <>
              <div className="flex gap-2 mb-6">
                {(['all', 'pending', 'completed'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-2 rounded-apple-lg font-medium transition-all ${
                      filter === f
                        ? 'bg-apple-blue text-white'
                        : 'bg-apple-gray-100 dark:bg-apple-gray-800 text-apple-gray-600 dark:text-apple-gray-400'
                    }`}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>

              {filteredReminders.length > 0 ? (
                <div className="space-y-3">
                  {filteredReminders.map(reminder => (
                    <ReminderCard
                      key={reminder.id}
                      reminder={reminder}
                      onToggle={() => reminderActions.toggleReminder(reminder.id)}
                      onDelete={() => handleDeleteReminder(reminder.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="card text-center py-12">
                  <Bell className="w-16 h-16 mx-auto mb-4 text-apple-gray-300" />
                  <h3 className="text-lg font-medium text-apple-gray-900 dark:text-white mb-2">
                    {filter === 'completed' ? 'No completed reminders' : 'No reminders yet'}
                  </h3>
                  <p className="text-apple-gray-500">
                    {filter === 'completed'
                      ? 'Complete some reminders to see them here.'
                      : 'Create your first reminder to stay on track.'}
                  </p>
                </div>
              )}

              {reminders.some(r => r.completed) && (
                <button
                  onClick={() => setShowCompleted(!showCompleted)}
                  className="mt-6 flex items-center justify-center gap-2 w-full py-3 text-sm text-apple-gray-500 hover:text-apple-gray-700 dark:hover:text-apple-gray-300 transition-colors"
                >
                  {showCompleted ? (
                    <>Hide completed <ChevronUp className="w-4 h-4" /></>
                  ) : (
                    <>Show completed <ChevronDown className="w-4 h-4" /></>
                  )}
                </button>
              )}
            </>
          )}
        </div>
      </main>

      {showAddReminder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-apple-gray-900 rounded-apple-xl shadow-apple-xl p-6 w-full max-w-md animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-apple-gray-900 dark:text-white">Add Reminder</h2>
              <button
                onClick={() => setShowAddReminder(false)}
                className="p-2 hover:bg-apple-gray-100 dark:hover:bg-apple-gray-800 rounded-apple-lg"
              >
                <X className="w-5 h-5 text-apple-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-apple-gray-700 dark:text-apple-gray-300 mb-1">Title</label>
                <input
                  type="text"
                  value={newReminder.title}
                  onChange={e => setNewReminder({ ...newReminder, title: e.target.value })}
                  className="input"
                  placeholder="What do you need to remember?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-apple-gray-700 dark:text-apple-gray-300 mb-1">Notes</label>
                <textarea
                  value={newReminder.notes}
                  onChange={e => setNewReminder({ ...newReminder, notes: e.target.value })}
                  className="input"
                  rows={2}
                  placeholder="Add details..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-apple-gray-700 dark:text-apple-gray-300 mb-1">Due Date</label>
                <input
                  type="datetime-local"
                  value={newReminder.dueDate}
                  onChange={e => setNewReminder({ ...newReminder, dueDate: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-apple-gray-700 dark:text-apple-gray-300 mb-1">Priority</label>
                <div className="flex gap-2">
                  {(['high', 'medium', 'low'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => setNewReminder({ ...newReminder, priority: p })}
                      className={`flex-1 py-2 rounded-apple-lg font-medium transition-all ${
                        newReminder.priority === p
                          ? p === 'high'
                            ? 'bg-apple-red text-white'
                            : p === 'medium'
                              ? 'bg-apple-orange text-white'
                              : 'bg-apple-green text-white'
                          : 'bg-apple-gray-100 dark:bg-apple-gray-800 text-apple-gray-600 dark:text-apple-gray-400'
                      }`}
                    >
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowAddReminder(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={handleAddReminder} className="btn-primary flex-1">Add Reminder</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ReminderCard({ reminder, onToggle, onDelete }: {
  reminder: any
  onToggle: () => void
  onDelete: () => void
}) {
  const priorityConfig = {
    high: { icon: AlertCircle, color: 'text-apple-red', bg: 'bg-apple-red/10' },
    medium: { icon: Clock, color: 'text-apple-orange', bg: 'bg-apple-orange/10' },
    low: { icon: CheckCircle2, color: 'text-apple-green', bg: 'bg-apple-green/10' }
  }

  const config = priorityConfig[reminder.priority as keyof typeof priorityConfig]

  return (
    <div className={`card transition-all ${reminder.completed ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-4">
        <button
          onClick={onToggle}
          className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
            reminder.completed
              ? 'bg-apple-green border-apple-green'
              : 'border-apple-gray-300 dark:border-apple-gray-600 hover:border-apple-blue'
          }`}
        >
          {reminder.completed && <CheckCircle2 className="w-4 h-4 text-white" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h4 className={`font-medium ${reminder.completed ? 'line-through text-apple-gray-500' : 'text-apple-gray-900 dark:text-white'}`}>
                {reminder.title}
              </h4>
              {reminder.notes && (
                <p className="text-sm text-apple-gray-500 mt-1">{reminder.notes}</p>
              )}
            </div>
            <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${config.bg} ${config.color}`}>
              <config.icon className="w-3 h-3" />
              {reminder.priority}
            </div>
          </div>

          <div className="flex items-center gap-4 mt-3 text-xs text-apple-gray-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {format(new Date(reminder.dueDate), 'MMM d, yyyy')}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {format(new Date(reminder.dueDate), 'h:mm a')}
            </span>
          </div>
        </div>

        <button
          onClick={onDelete}
          className="p-2 text-apple-gray-400 hover:text-apple-red hover:bg-apple-red/10 rounded-apple-lg transition-all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
