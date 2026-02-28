'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'

import { useAuth } from '@/components/Providers'
import { useStore, CalendarEvent } from '@/lib/store'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  X,
  Search,
  CircleDot
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
  subDays,
  isSameMonth,
  isSameDay,
  isToday
} from 'date-fns'

const timePresets = [
  '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
  '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM',
  '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM',
  '8:00 PM', '9:00 PM', '10:00 PM'
]

const durations = [
  { label: '15 min', minutes: 15 },
  { label: '30 min', minutes: 30 },
  { label: '1 hour', minutes: 60 },
  { label: '1.5 hours', minutes: 90 },
  { label: '2 hours', minutes: 120 },
  { label: '3 hours', minutes: 180 },
]

export default function CalendarPage() {
  const { user, loading } = useAuth()
  const { calendarActions, featureFlags, searchQuery, setSearchQuery } = useStore()
  const [mounted, setMounted] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())
  const [showAddEvent, setShowAddEvent] = useState(false)
  const [viewMode, setViewMode] = useState<'month' | 'search'>('month')
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    startTime: '9:00 AM',
    duration: 60,
  })
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [showDurationPicker, setShowDurationPicker] = useState(false)

  const { calendarEvents: localEvents } = useStore()
  const [dbEvents, setDbEvents] = useState<CalendarEvent[]>([])

  const fetchDbEvents = useCallback(async () => {
    if (!user) return
    try {
      const res = await fetch('/api/calendar/events', {
        headers: { 'x-user-id': user.id },
      })
      if (res.ok) {
        const data = await res.json()
        setDbEvents(
          (data.events || []).map((e: any) => ({
            id: e.id,
            title: e.title,
            description: e.description,
            startDate: new Date(e.startDate),
            endDate: new Date(e.endDate),
            location: e.location,
            color: e.color || '#ea4335',
            sourceType: e.sourceType || 'google',
            createdAt: new Date(e.createdAt),
          }))
        )
      }
    } catch (err) {
      console.error('Failed to fetch DB events:', err)
    }
  }, [user])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && user) {
      fetchDbEvents()
    }
  }, [mounted, user, fetchDbEvents])

  // Merge local (Zustand) events with DB (synced) events, dedup by id
  const calendarEvents = useMemo(() => {
    const seen = new Set<string>()
    const merged: CalendarEvent[] = []
    for (const e of localEvents) {
      if (!seen.has(e.id)) {
        seen.add(e.id)
        merged.push(e)
      }
    }
    for (const e of dbEvents) {
      if (!seen.has(e.id)) {
        seen.add(e.id)
        merged.push(e)
      }
    }
    return merged
  }, [localEvents, dbEvents])

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

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return []
    const query = searchQuery.toLowerCase()
    return calendarEvents.filter(event => {
      const titleMatch = event.title.toLowerCase().includes(query)
      const descMatch = event.description?.toLowerCase().includes(query)
      const locMatch = event.location?.toLowerCase().includes(query)
      return titleMatch || descMatch || locMatch
    })
  }, [calendarEvents, searchQuery])

  const eventsForSelectedDate = useMemo(() => {
    if (!selectedDate) return []
    return calendarEvents.filter(e => isSameDay(new Date(e.startDate), selectedDate))
  }, [calendarEvents, selectedDate])

  const timeToMinutes = (time: string) => {
    const [timePart, period] = time.split(' ')
    const [hours, minutes] = timePart.split(':').map(Number)
    let h = hours
    if (period === 'PM' && hours !== 12) h += 12
    if (period === 'AM' && hours === 12) h = 0
    return h * 60 + minutes
  }

  const minutesToTime = (minutes: number) => {
    const period = minutes >= 12 ? 'PM' : 'AM'
    let h = minutes >= 12 ? (minutes >= 24 ? minutes - 24 : minutes) : minutes
    if (h >= 12) h -= 12
    if (h === 0) h = 12
    const m = minutes % 60
    return `${h}:${m.toString().padStart(2, '0')} ${period}`
  }

  const handleAddEvent = () => {
    if (!newEvent.title.trim()) return
    const startMinutes = timeToMinutes(newEvent.startTime)
    const endMinutes = startMinutes + newEvent.duration
    const startDate = new Date(`${newEvent.startDate}T00:00`)
    startDate.setHours(Math.floor(startMinutes / 60), startMinutes % 60)
    const endDate = new Date(startDate.getTime() + newEvent.duration * 60000)
    calendarActions.addEvent({
      title: newEvent.title,
      description: newEvent.description,
      startDate,
      endDate,
      location: '',
      color: '#0086E3',
      sourceType: 'local'
    })
    setShowAddEvent(false)
    setNewEvent({ title: '', description: '', startDate: format(new Date(), 'yyyy-MM-dd'), startTime: '9:00 AM', duration: 60 })
  }

  const getEventsForDay = (day: Date) => {
    return calendarEvents.filter(e => isSameDay(new Date(e.startDate), day))
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

  const isEventsEnabled = featureFlags?.events !== false

  return (
    <div className="min-h-screen bg-background-primary">
      

      
        <div className="max-w-7xl mx-auto">
          <header className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-semibold text-text-primary mb-1">
                Calendar
              </h1>
              <p className="text-text-tertiary">{format(currentMonth, 'MMMM yyyy')}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setViewMode(e.target.value ? 'search' : 'month')
                  }}
                  placeholder="Search..."
                  className="input pl-10 w-48 text-sm py-2"
                />
              </div>
              {isEventsEnabled && (
                <button
                  onClick={() => setShowAddEvent(true)}
                  className="btn-primary flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Event
                </button>
              )}
            </div>
          </header>

          {viewMode === 'search' ? (
            <div className="card">
              <h2 className="text-lg font-semibold text-text-primary mb-4">
                Search Results ({searchResults.length})
              </h2>
              {searchResults.length > 0 ? (
                <div className="space-y-3">
                  {searchResults.map(event => (
                    <div
                      key={event.id}
                      className="p-4 bg-surface-secondary rounded-xl hover:bg-border-primary/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="w-1 h-full min-h-[48px] rounded-full" style={{ backgroundColor: event.color }} />
                          <div>
                            <h4 className="font-medium text-text-primary">{event.title}</h4>
                            <p className="text-sm text-text-tertiary mt-0.5">
                              {format(new Date(event.startDate), 'EEEE, MMMM d')} at {format(new Date(event.startDate), 'h:mm a')}
                            </p>
                            {event.description && (
                              <p className="text-sm text-text-tertiary mt-2">{event.description}</p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => calendarActions.deleteEvent(event.id)}
                          className="p-2 text-text-tertiary hover:text-action-danger hover:bg-action-danger/10 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Search className="w-12 h-12 mx-auto mb-4 text-text-placeholder" />
                  <p className="text-text-tertiary">No events found for "{searchQuery}"</p>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3 card p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                      className="p-2 hover:bg-surface-secondary rounded-lg transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5 text-text-primary" />
                    </button>
                    <button
                      onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                      className="p-2 hover:bg-surface-secondary rounded-lg transition-colors"
                    >
                      <ChevronRight className="w-5 h-5 text-text-primary" />
                    </button>
                  </div>
                    <button
                      onClick={() => {
                        setCurrentMonth(new Date())
                        setSelectedDate(new Date())
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-accent-primary hover:bg-accent-primary/10 rounded-lg transition-colors"
                    >
                      <CircleDot className="w-4 h-4" />
                      Today
                    </button>
                </div>

                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-xs font-medium text-text-tertiary py-2 uppercase tracking-wider">
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
                          relative p-2 min-h-[90px] rounded-xl text-left transition-all
                          ${isCurrentMonth ? 'hover:bg-surface-secondary' : 'opacity-40'}
                          ${isSelected ? 'bg-accent-primary/15 ring-2 ring-accent-primary' : ''}
                        `}
                      >
                        <span className={`
                          inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
                          ${isTodayDate 
                            ? 'bg-accent-primary text-white shadow-lg shadow-accent-primary/30' 
                            : isSelected 
                              ? 'text-accent-primary' 
                              : 'text-text-primary'}
                        `}>
                          {format(day, 'd')}
                        </span>
                        {dayEvents.length > 0 && (
                          <div className="mt-1.5 space-y-1">
                            {dayEvents.slice(0, 2).map(e => (
                              <div
                                key={e.id}
                                className="text-xs px-1.5 py-0.5 rounded-md truncate font-medium"
                                style={{ 
                                  backgroundColor: `${e.color}20`, 
                                  color: e.color 
                                }}
                              >
                                {format(new Date(e.startDate), 'h:mm')} {e.title}
                              </div>
                            ))}
                            {dayEvents.length > 2 && (
                              <div className="text-xs text-text-tertiary pl-1">
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

              <div className="space-y-4">
                <div className="card p-5">
                  <h3 className="font-semibold text-text-primary mb-4">
                    {selectedDate ? format(selectedDate, 'EEEE, MMMM d') : 'Select a date'}
                  </h3>
                  {eventsForSelectedDate.length > 0 ? (
                    <div className="space-y-3">
                      {eventsForSelectedDate.map(event => (
                        <div
                          key={event.id}
                          className="p-4 bg-surface-secondary rounded-xl"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-text-primary">
                                {event.title}
                              </h4>
                              {event.sourceType === 'google' && (
                                <span className="text-[10px] px-1.5 py-0.5 bg-[#ea4335]/10 text-[#ea4335] rounded-md font-medium">G</span>
                              )}
                            </div>
                            {event.sourceType === 'local' && (
                              <button
                                onClick={() => calendarActions.deleteEvent(event.id)}
                                className="text-text-tertiary hover:text-action-danger transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-text-tertiary">
                            <Clock className="w-3.5 h-3.5" />
                            {format(new Date(event.startDate), 'h:mm a')} - {format(new Date(event.endDate), 'h:mm a')}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CalendarIcon className="w-10 h-10 mx-auto mb-3 text-text-placeholder" />
                      <p className="text-sm text-text-tertiary">No events</p>
                    </div>
                  )}
                </div>

                <div className="card p-5">
                  <h4 className="font-medium text-text-primary mb-3 text-sm">Quick Add</h4>
                  <button
                    onClick={() => {
                      setNewEvent(prev => ({ ...prev, startDate: selectedDate ? format(subDays(selectedDate, 0), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd') }))
                      setShowAddEvent(true)
                    }}
                    disabled={!selectedDate}
                    className="w-full btn-secondary py-3 text-sm disabled:opacity-50"
                  >
                    Add Event on {selectedDate ? format(selectedDate, 'MMM d') : '...'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      

      {showAddEvent && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface-primary rounded-2xl shadow-2xl w-full max-w-md animate-scale-in">
            <div className="p-6 border-b border-border-primary">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-text-primary">New Event</h2>
                <button
                  onClick={() => setShowAddEvent(false)}
                  className="p-2 hover:bg-surface-secondary rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-text-tertiary" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="w-full text-lg font-medium bg-transparent border-b border-border-primary pb-3 focus:outline-none focus:border-accent-primary text-text-primary placeholder:text-text-tertiary"
                  placeholder="Event title"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-tertiary uppercase tracking-wider mb-2">Date</label>
                <input
                  type="date"
                  value={newEvent.startDate}
                  onChange={e => setNewEvent({ ...newEvent, startDate: e.target.value })}
                  className="input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <label className="block text-xs font-medium text-text-tertiary uppercase tracking-wider mb-2">Start</label>
                  <button
                    onClick={() => { setShowTimePicker(!showTimePicker); setShowDurationPicker(false); }}
                    className="input text-left flex items-center justify-between"
                  >
                    {newEvent.startTime}
                    <Clock className="w-4 h-4 text-text-tertiary" />
                  </button>
                  {showTimePicker && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-surface-secondary rounded-xl shadow-xl border border-border-primary max-h-48 overflow-y-auto z-10">
                      {timePresets.map(time => (
                        <button
                          key={time}
                          onClick={() => { setNewEvent({ ...newEvent, startTime: time }); setShowTimePicker(false); }}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-accent-primary/10 transition-colors ${
                            newEvent.startTime === time ? 'text-accent-primary font-medium' : 'text-text-primary'
                          }`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="relative">
                  <label className="block text-xs font-medium text-text-tertiary uppercase tracking-wider mb-2">Duration</label>
                  <button
                    onClick={() => { setShowDurationPicker(!showDurationPicker); setShowTimePicker(false); }}
                    className="input text-left flex items-center justify-between"
                  >
                    {durations.find(d => d.minutes === newEvent.duration)?.label || '1 hour'}
                    <Clock className="w-4 h-4 text-text-tertiary" />
                  </button>
                  {showDurationPicker && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-surface-secondary rounded-xl shadow-xl border border-border-primary max-h-48 overflow-y-auto z-10">
                      {durations.map(d => (
                        <button
                          key={d.label}
                          onClick={() => { setNewEvent({ ...newEvent, duration: d.minutes }); setShowDurationPicker(false); }}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-accent-primary/10 transition-colors ${
                            newEvent.duration === d.minutes ? 'text-accent-primary font-medium' : 'text-text-primary'
                          }`}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <textarea
                  value={newEvent.description}
                  onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
                  className="input resize-none"
                  rows={2}
                  placeholder="Add description..."
                />
              </div>

              <div className="flex gap-3 pt-2">
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
