'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import { useAuth } from '@/components/Providers'
import { useStore } from '@/lib/store'
import { notificationService } from '@/lib/notifications'
import {
  Plus,
  Bell,
  Clock,
  AlertCircle,
  CheckCircle2,
  Calendar,
  X,
  ChevronDown,
  ChevronUp,
  Search,
  BellOff,
  TrendingUp,
  Zap,
  Edit2
} from 'lucide-react'
import { format } from 'date-fns'

type Filter = 'all' | 'pending' | 'completed'

export default function RemindersPage() {
  const { user, loading } = useAuth()
  const { reminderActions, preferences, searchQuery, setSearchQuery } = useStore()
  const [mounted, setMounted] = useState(false)
  const [showAddReminder, setShowAddReminder] = useState(false)
  const [showEditReminder, setShowEditReminder] = useState(false)
  const [editingReminder, setEditingReminder] = useState<any>(null)
  const [showCompleted, setShowCompleted] = useState(false)
  const [filter, setFilter] = useState<Filter>('all')
  const [notificationPermission, setNotificationPermission] = useState<string>('default')

  const [newReminder, setNewReminder] = useState({
    title: '',
    notes: '',
    dueDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    priority: 'medium' as 'high' | 'medium' | 'low',
    notify: true
  })

  const { reminders } = useStore()

  useEffect(() => {
    setMounted(true)
    if (typeof window !== 'undefined') {
      setNotificationPermission(notificationService.permissionStatus)
    }
  }, [])

  useEffect(() => {
    if (mounted && preferences.notificationsEnabled && preferences.reminderNotifications) {
      notificationService.requestPermission()
    }
  }, [mounted, preferences])

  const filteredReminders = reminders.filter(r => {
    const matchesFilter = filter === 'all' 
      ? true 
      : filter === 'completed' 
        ? r.completed 
        : !r.completed
    
    const matchesSearch = searchQuery === '' 
      ? true 
      : r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.notes?.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesFilter && matchesSearch
  })

  const pendingCount = reminders.filter(r => !r.completed).length
  const highPriorityCount = reminders.filter(r => !r.completed && r.priority === 'high').length

  const handleAddReminder = async () => {
    if (!newReminder.title.trim()) return

    const dueDate = new Date(newReminder.dueDate)
    
    reminderActions.addReminder({
      title: newReminder.title,
      notes: newReminder.notes,
      dueDate,
      priority: newReminder.priority
    })

    if (newReminder.notify && preferences.reminderNotifications) {
      try {
        notificationService.handleReminderNotification(newReminder.title, dueDate, '')
      } catch (e) {
        console.error('Notification error:', e)
      }
    }

    setShowAddReminder(false)
    setNewReminder({ title: '', notes: '', dueDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"), priority: 'medium', notify: true })
  }

  const handleEditReminder = async () => {
    if (!editingReminder || !editingReminder.title.trim()) return

    const dueDate = new Date(editingReminder.dueDate)
    
    reminderActions.updateReminder(editingReminder.id, {
      title: editingReminder.title,
      notes: editingReminder.notes,
      dueDate,
      priority: editingReminder.priority
    })

    setShowEditReminder(false)
    setEditingReminder(null)
  }

  const openEditReminder = (reminder: any) => {
    setEditingReminder({
      ...reminder,
      dueDate: format(new Date(reminder.dueDate), "yyyy-MM-dd'T'HH:mm")
    })
    setShowEditReminder(true)
  }

  const handleToggleReminder = async (id: string, title: string) => {
    reminderActions.toggleReminder(id)
    
    const reminder = reminders.find(r => r.id === id)
    if (reminder && !reminder.completed) {
      await notificationService.showReminderCompleted(title)
    }
  }

  const requestNotificationPermission = async () => {
    const granted = await notificationService.requestPermission()
    setNotificationPermission(granted ? 'granted' : 'denied')
  }

  if (loading || !mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-primary">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-accent-primary/20 rounded-apple-xl animate-pulse" />
          <p className="text-text-tertiary">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  const isRemindersEnabled = preferences.remindersEnabled

  return (
    <div className="min-h-screen bg-background-primary">
      <Sidebar />

      <main className="ml-64 p-8">
        <div className="max-w-4xl mx-auto">
          <header className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-semibold text-text-primary mb-2">
                Reminders
              </h1>
                <p className="text-text-tertiary">
                  {pendingCount} pending, {highPriorityCount} High priority
                </p>
            </div>
            <div className="flex items-center gap-3">
              {notificationPermission !== 'granted' && (
                <button
                  onClick={requestNotificationPermission}
                  className="btn-secondary flex items-center gap-2"
                >
                  <BellOff className="w-4 h-4" />
                  Enable Notifications
                </button>
              )}
              {isRemindersEnabled && (
                <button
                  onClick={() => setShowAddReminder(true)}
                  className="btn-primary flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add Reminder
                </button>
              )}
            </div>
          </header>

          <div className="card mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search reminders..."
                className="input pl-12"
              />
            </div>
          </div>

          {!isRemindersEnabled ? (
            <div className="card text-center py-12">
              <Bell className="w-16 h-16 mx-auto mb-4 text-text-placeholder" />
              <h3 className="text-lg font-medium text-text-primary mb-2">
                Reminders Disabled
              </h3>
              <p className="text-text-tertiary">
                Enable reminders in Settings to use this feature.
              </p>
            </div>
          ) : (
            <>
              <div className="flex gap-2 mb-6">
                {(['all', 'pending', 'completed'] as Filter[]).map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-2 rounded-apple-lg font-medium transition-all ${
                      filter === f
                        ? 'bg-accent-primary text-white'
                        : 'bg-surface-secondary text-text-secondary hover:bg-border-primary'
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
                      onToggle={() => handleToggleReminder(reminder.id, reminder.title)}
                      onDelete={() => reminderActions.deleteReminder(reminder.id)}
                      onEdit={() => openEditReminder(reminder)}
                    />
                  ))}
                </div>
              ) : (
                <div className="card text-center py-12">
                  <Bell className="w-16 h-16 mx-auto mb-4 text-text-placeholder" />
                  <h3 className="text-lg font-medium text-text-primary mb-2">
                    {filter === 'completed' ? 'No completed reminders' : 'No reminders found'}
                  </h3>
                  <p className="text-text-tertiary">
                    {filter === 'completed'
                      ? 'Complete some reminders to see them here.'
                      : searchQuery ? 'Try a different search term.'
                      : 'Create your first reminder to stay on track.'}
                  </p>
                </div>
              )}

              {reminders.some(r => r.completed) && (
                <button
                  onClick={() => setShowCompleted(!showCompleted)}
                  className="mt-6 flex items-center justify-center gap-2 w-full py-3 text-sm text-text-tertiary hover:text-text-primary transition-colors"
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
          <div className="bg-surface-primary rounded-apple-xl shadow-apple-xl p-6 w-full max-w-md animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-text-primary">Add Reminder</h2>
              <button
                onClick={() => setShowAddReminder(false)}
                className="p-2 hover:bg-surface-secondary rounded-apple-lg transition-colors"
              >
                <X className="w-5 h-5 text-text-tertiary" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Title</label>
                <input
                  type="text"
                  value={newReminder.title}
                  onChange={e => setNewReminder({ ...newReminder, title: e.target.value })}
                  className="input"
                  placeholder="What do you need to remember?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Notes</label>
                <textarea
                  value={newReminder.notes}
                  onChange={e => setNewReminder({ ...newReminder, notes: e.target.value })}
                  className="input"
                  rows={2}
                  placeholder="Add details..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Due Date</label>
                <input
                  type="datetime-local"
                  value={newReminder.dueDate}
                  onChange={e => setNewReminder({ ...newReminder, dueDate: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Priority</label>
                <div className="flex gap-2">
                  {(['high', 'medium', 'low'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => setNewReminder({ ...newReminder, priority: p })}
                      className={`flex-1 py-2 rounded-apple-lg font-medium transition-all ${
                        newReminder.priority === p
                          ? p === 'high'
                            ? 'bg-action-danger text-white'
                            : p === 'medium'
                              ? 'bg-action-warning text-white'
                              : 'bg-success text-white'
                          : 'bg-surface-secondary text-text-secondary hover:bg-border-primary'
                      }`}
                    >
                      {p === 'high' && <AlertCircle className="w-4 h-4 inline mr-1" />}
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {preferences.notificationsEnabled && (
                <label className="flex items-center gap-3 p-3 bg-surface-secondary rounded-apple-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newReminder.notify}
                    onChange={e => setNewReminder({ ...newReminder, notify: e.target.checked })}
                    className="w-5 h-5 rounded border-border-primary bg-surface-primary text-accent-primary focus:ring-accent-primary"
                  />
                  <div>
                    <p className="font-medium text-text-primary">Notification</p>
                    <p className="text-sm text-text-tertiary">Get notified when due</p>
                  </div>
                </label>
              )}

              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowAddReminder(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={handleAddReminder} className="btn-primary flex-1">Add Reminder</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditReminder && editingReminder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-primary rounded-apple-xl shadow-apple-xl p-6 w-full max-w-md animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-text-primary">Edit Reminder</h2>
              <button
                onClick={() => { setShowEditReminder(false); setEditingReminder(null); }}
                className="p-2 hover:bg-surface-secondary rounded-apple-lg transition-colors"
              >
                <X className="w-5 h-5 text-text-tertiary" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Title</label>
                <input
                  type="text"
                  value={editingReminder.title}
                  onChange={e => setEditingReminder({ ...editingReminder, title: e.target.value })}
                  className="input"
                  placeholder="What do you need to remember?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Notes</label>
                <textarea
                  value={editingReminder.notes}
                  onChange={e => setEditingReminder({ ...editingReminder, notes: e.target.value })}
                  className="input"
                  rows={2}
                  placeholder="Add details..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Due Date</label>
                <input
                  type="datetime-local"
                  value={editingReminder.dueDate}
                  onChange={e => setEditingReminder({ ...editingReminder, dueDate: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Priority</label>
                <div className="flex gap-2">
                  {(['high', 'medium', 'low'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => setEditingReminder({ ...editingReminder, priority: p })}
                      className={`flex-1 py-2 rounded-apple-lg font-medium transition-all ${
                        editingReminder.priority === p
                          ? p === 'high'
                            ? 'bg-action-danger text-white'
                            : p === 'medium'
                              ? 'bg-action-warning text-white'
                              : 'bg-success text-white'
                          : 'bg-surface-secondary text-text-secondary hover:bg-border-primary'
                      }`}
                    >
                      {p === 'high' && <AlertCircle className="w-4 h-4 inline mr-1" />}
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => { setShowEditReminder(false); setEditingReminder(null); }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button onClick={handleEditReminder} className="btn-primary flex-1">
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ReminderCard({ reminder, onToggle, onDelete, onEdit }: {
  reminder: any
  onToggle: () => void
  onDelete: () => void
  onEdit: () => void
}) {
  const priorityConfig = {
    high: { icon: AlertCircle, color: 'text-action-danger', bg: 'bg-action-danger/10' },
    medium: { icon: Clock, color: 'text-action-warning', bg: 'bg-action-warning/10' },
    low: { icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10' }
  }

  const config = priorityConfig[reminder.priority as keyof typeof priorityConfig]

  return (
    <div className={`card transition-all ${reminder.completed ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-4">
        <button
          onClick={onToggle}
          className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
            reminder.completed
              ? 'bg-success border-success'
              : 'border-border-primary hover:border-accent-primary'
          }`}
        >
          {reminder.completed && <CheckCircle2 className="w-4 h-4 text-white" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h4 className={`font-medium ${reminder.completed ? 'line-through text-text-tertiary' : 'text-text-primary'}`}>
                {reminder.title}
              </h4>
              {reminder.notes && (
                <p className="text-sm text-text-tertiary mt-1">{reminder.notes}</p>
              )}
            </div>
            <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${config.bg} ${config.color}`}>
              <config.icon className="w-3 h-3" />
              {reminder.priority.charAt(0).toUpperCase() + reminder.priority.slice(1)}
            </div>
          </div>

          <div className="flex items-center gap-4 mt-3 text-xs text-text-tertiary">
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
          className="p-2 text-text-tertiary hover:text-action-danger hover:bg-action-danger/10 rounded-apple-lg transition-all"
        >
          <X className="w-4 h-4" />
        </button>
        <button
          onClick={onEdit}
          className="p-2 text-text-tertiary hover:text-accent-primary hover:bg-accent-primary/10 rounded-apple-lg transition-all"
        >
          <Edit2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
