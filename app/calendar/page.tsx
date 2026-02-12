'use client'

import { useState, useEffect, useMemo } from 'react'
import Sidebar from '@/components/Sidebar'
import { useAuth } from '@/components/Providers'
import { useStore } from '@/lib/store'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  X
} from 'lucide-react'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday
} from 'date-fns'

export default function CalendarPage() {
  const { user, loading } = useAuth()
  const { calendarActions, featureFlags } = useStore()
  const [mounted, setMounted] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())
  const [showAddEvent, setShowAddEvent] = useState(false)
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    startTime: '09:00',
    endTime: '10:00',
    location: ''
  })

  const { calendarEvents } = useStore()

  useEffect(() => {
    setMounted(true)
  }, [])

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart)
    const endDate = endOfWeek(monthEnd)
    const days = []
    let day = startDate
    while (day <= endDate) {
      days.push(day)
      day = addDays(day, 1)
    }
    return days
  }, [currentMonth])

  const eventsForSelectedDate = useMemo(() => {
    if (!selectedDate) return []
    return calendarEvents.filter(e => isSameDay(new Date(e.startDate), selectedDate))
  }, [calendarEvents, selectedDate])

  const handleAddEvent = () => {
    if (!newEvent.title.trim()) return
    const startDate = new Date(`${newEvent.startDate}T${newEvent.startTime}`)
    const endDate = new Date(`${newEvent.startDate}T${newEvent.endTime}`)
    calendarActions.addEvent({
      title: newEvent.title,
      description: newEvent.description,
      startDate,
      endDate,
      location: newEvent.location,
      color: '#007AFF'
    })
    setShowAddEvent(false)
    setNewEvent({ title: '', description: '', startDate: format(new Date(), 'yyyy-MM-dd'), startTime: '09:00', endTime: '10:00', location: '' })
  }

  const getEventsForDay = (day: Date) => {
    return calendarEvents.filter(e => isSameDay(new Date(e.startDate), day))
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

  const isEventsEnabled = featureFlags?.events !== false

  return (
    <div className="min-h-screen bg-apple-gray-50 dark:bg-apple-gray-950">
      <Sidebar />

      <main className="ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          <header className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-semibold text-apple-gray-900 dark:text-white mb-2">
                Calendar
              </h1>
              <p className="text-apple-gray-500">Manage your events and schedule</p>
            </div>
            {isEventsEnabled && (
              <button
                onClick={() => setShowAddEvent(true)}
                className="btn-primary"
              >
                <Plus className="w-5 h-5 mr-2 inline" />
                Add Event
              </button>
            )}
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 card">
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  className="p-2 hover:bg-apple-gray-100 dark:hover:bg-apple-gray-800 rounded-apple-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-apple-gray-600 dark:text-apple-gray-400" />
                </button>
                <h2 className="text-xl font-semibold text-apple-gray-900 dark:text-white">
                  {format(currentMonth, 'MMMM yyyy')}
                </h2>
                <button
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  className="p-2 hover:bg-apple-gray-100 dark:hover:bg-apple-gray-800 rounded-apple-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-apple-gray-600 dark:text-apple-gray-400" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-sm font-medium text-apple-gray-500 py-2">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {days.map((day, idx) => {
                  const dayEvents = getEventsForDay(day)
                  const isCurrentMonth = isSameMonth(day, currentMonth)
                  const isSelected = selectedDate && isSameDay(day, selectedDate)
                  const isTodayDate = isToday(day)

                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedDate(day)}
                      className={`
                        relative p-2 min-h-[80px] rounded-apple-lg text-left transition-all
                        ${isCurrentMonth ? 'hover:bg-apple-gray-100 dark:hover:bg-apple-gray-800' : 'opacity-40'}
                        ${isSelected ? 'bg-apple-blue/10 ring-2 ring-apple-blue' : ''}
                      `}
                    >
                      <span className={`
                        inline-flex items-center justify-center w-7 h-7 rounded-full text-sm
                        ${isTodayDate ? 'bg-apple-blue text-white font-semibold' : 'text-apple-gray-700 dark:text-apple-gray-300'}
                      `}>
                        {format(day, 'd')}
                      </span>
                      {dayEvents.length > 0 && (
                        <div className="mt-1 space-y-1">
                          {dayEvents.slice(0, 2).map(e => (
                            <div
                              key={e.id}
                              className="text-xs px-1.5 py-0.5 rounded truncate"
                              style={{ backgroundColor: `${e.color}20`, color: e.color }}
                            >
                              {e.title}
                            </div>
                          ))}
                          {dayEvents.length > 2 && (
                            <div className="text-xs text-apple-gray-500">
                              +{dayEvents.length - 2} more
                            </div>
                          )}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="card">
              <h3 className="font-semibold text-apple-gray-900 dark:text-white mb-4">
                {selectedDate ? format(selectedDate, 'EEEE, MMMM d') : 'Select a date'}
              </h3>
              {eventsForSelectedDate.length > 0 ? (
                <div className="space-y-4">
                  {eventsForSelectedDate.map(event => (
                    <div
                      key={event.id}
                      className="p-4 bg-apple-gray-50 dark:bg-apple-gray-800 rounded-apple-lg"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-apple-gray-900 dark:text-white">
                          {event.title}
                        </h4>
                        <button
                          onClick={() => calendarActions.deleteEvent(event.id)}
                          className="text-apple-gray-400 hover:text-apple-red transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      {event.description && (
                        <p className="text-sm text-apple-gray-500 mb-2">{event.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-apple-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(event.startDate), 'h:mm a')} - {format(new Date(event.endDate), 'h:mm a')}
                        </span>
                      </div>
                      {event.location && (
                        <p className="text-xs text-apple-gray-500 flex items-center gap-1 mt-2">
                          <MapPin className="w-3 h-3" />
                          {event.location}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-apple-gray-400">
                  <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No events scheduled</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {showAddEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-apple-gray-900 rounded-apple-xl shadow-apple-xl p-6 w-full max-w-md animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-apple-gray-900 dark:text-white">Add Event</h2>
              <button
                onClick={() => setShowAddEvent(false)}
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
                  value={newEvent.title}
                  onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="input"
                  placeholder="Event title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-apple-gray-700 dark:text-apple-gray-300 mb-1">Description</label>
                <textarea
                  value={newEvent.description}
                  onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
                  className="input"
                  rows={3}
                  placeholder="Add details..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-apple-gray-700 dark:text-apple-gray-300 mb-1">Date</label>
                <input
                  type="date"
                  value={newEvent.startDate}
                  onChange={e => setNewEvent({ ...newEvent, startDate: e.target.value })}
                  className="input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-apple-gray-700 dark:text-apple-gray-300 mb-1">Start</label>
                  <input
                    type="time"
                    value={newEvent.startTime}
                    onChange={e => setNewEvent({ ...newEvent, startTime: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-apple-gray-700 dark:text-apple-gray-300 mb-1">End</label>
                  <input
                    type="time"
                    value={newEvent.endTime}
                    onChange={e => setNewEvent({ ...newEvent, endTime: e.target.value })}
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-apple-gray-700 dark:text-apple-gray-300 mb-1">Location</label>
                <input
                  type="text"
                  value={newEvent.location}
                  onChange={e => setNewEvent({ ...newEvent, location: e.target.value })}
                  className="input"
                  placeholder="Add location"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowAddEvent(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={handleAddEvent} className="btn-primary flex-1">Add Event</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
