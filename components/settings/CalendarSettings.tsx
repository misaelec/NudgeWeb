'use client'

import { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { useCalendarSyncStore, ConnectedCalendar, CalendarSyncRule, VisibilityType } from '@/lib/calendarSyncStore'
import { useAuth } from '@/components/Providers'
import { Calendar, X, Globe, Loader2, RefreshCw } from 'lucide-react'
import { useStore } from '@/lib/store'

const CALENDAR_COLORS = [
  '#ea4335', '#f4511e', '#e67c73', '#f09300',
  '#f6bf26', '#33b679', '#0b8043', '#039be5',
  '#4285f4', '#3f51b5', '#7986cb', '#8e24aa',
  '#616161', '#a79b8e',
]

const PROVIDER_LABELS: Record<string, string> = {
  google: 'Google Calendar',
  apple: 'Apple Calendar',
  outlook: 'Outlook',
  nudge: 'Nudge (Local)',
}

const VISIBILITY_OPTIONS: { value: VisibilityType; label: string }[] = [
  { value: 'title_only', label: 'Original Name' },
  { value: 'busy', label: 'Show as Busy' },
  { value: 'full', label: 'Full Details' },
]

function CalendarCard({ calendar, onRemove, onSync, onColorChange, isSyncing }: {
  calendar: ConnectedCalendar
  onRemove: () => void
  onSync?: () => void
  onColorChange?: (color: string) => void
  isSyncing?: boolean
}) {
  const [showColors, setShowColors] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showColors) return
    const handleClick = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowColors(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showColors])

  return (
    <div className="flex items-center justify-between p-4 bg-surface-secondary rounded-apple-lg">
      <div className="flex items-center gap-3">
        <div className="relative" ref={pickerRef}>
          <button
            onClick={() => onColorChange && setShowColors(!showColors)}
            className="w-4 h-4 rounded-full ring-2 ring-transparent hover:ring-text-tertiary transition-all cursor-pointer"
            style={{ backgroundColor: calendar.color }}
            title="Change color"
          />
          {showColors && (
            <div className="absolute top-7 -left-1 z-50 bg-surface-primary border border-border-primary rounded-apple-lg p-3 shadow-lg grid grid-cols-7 gap-3 w-fit">
              {CALENDAR_COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => {
                    onColorChange?.(color)
                    setShowColors(false)
                  }}
                  className={`w-4 h-4 rounded-full transition-transform hover:scale-125 ${
                    calendar.color === color ? 'ring-2 ring-text-primary ring-offset-2 ring-offset-surface-primary' : ''
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          )}
        </div>
        <div>
          <p className="font-medium text-text-primary">
            {calendar.provider === 'nudge' ? 'My Nudge Calendar' : calendar.accountEmail}
          </p>
          <p className="text-sm text-text-tertiary">{PROVIDER_LABELS[calendar.provider]}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {onSync && (
          <button
            onClick={onSync}
            disabled={isSyncing}
            className="text-text-tertiary hover:text-accent-primary transition-colors disabled:opacity-50"
            title="Sync Now"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          </button>
        )}
        <button
          onClick={onRemove}
          className="text-text-tertiary hover:text-action-danger transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}

function SyncRuleRow({
  rule,
  calendars,
  onToggle,
  onVisibilityChange,
  onRemove
}: {
  rule: CalendarSyncRule
  calendars: ConnectedCalendar[]
  onToggle: () => void
  onVisibilityChange: (v: VisibilityType) => void
  onRemove: () => void
}) {
  const sourceCalendar = calendars.find(c => c.id === rule.sourceCalendarId)
  const targetCalendar = calendars.find(c => c.id === rule.targetCalendarId)

  if (!sourceCalendar || !targetCalendar) return null

  return (
    <div className="flex items-center gap-4 py-3 border-b border-border-primary last:border-0">
      <div className="flex-1 flex items-center gap-2">
        <span className="text-sm font-medium text-text-primary">
          {sourceCalendar.provider === 'nudge' ? 'My Nudge Calendar' : sourceCalendar.accountEmail}
        </span>
        <span className="text-text-tertiary">→</span>
        <span className="text-sm font-medium text-text-primary">
          {targetCalendar.provider === 'nudge' ? 'My Nudge Calendar' : targetCalendar.accountEmail}
        </span>
      </div>

      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={rule.isEnabled}
          onChange={onToggle}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-border-primary peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border-primary after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-primary"></div>
      </label>

      <select
        value={rule.visibilityType}
        onChange={(e) => onVisibilityChange(e.target.value as VisibilityType)}
        className="text-sm bg-surface-secondary border border-border-primary rounded-apple-lg px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
      >
        {VISIBILITY_OPTIONS.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>

      <button onClick={onRemove} className="text-text-tertiary hover:text-action-danger">
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

function AddRuleModal({ 
  calendars, 
  onClose, 
  onSave 
}: { 
  calendars: ConnectedCalendar[]
  onClose: () => void
  onSave: (sourceId: string, targetId: string) => void 
}) {
  const [sourceId, setSourceId] = useState('')
  const [targetId, setTargetId] = useState('')

  const sourceCalendars = calendars
  const targetCalendars = calendars.filter(c => c.id !== sourceId)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-surface-primary border border-border-primary rounded-apple-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Add Sync Rule</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">From Calendar</label>
            <select 
              value={sourceId}
              onChange={(e) => setSourceId(e.target.value)}
              className="w-full bg-surface-secondary border border-border-primary rounded-apple-lg px-3 py-2 text-text-primary"
            >
              <option value="">Select source calendar</option>
              {sourceCalendars.map(cal => (
                <option key={cal.id} value={cal.id}>
                  {cal.provider === 'nudge' ? 'My Nudge Calendar' : cal.accountEmail}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">To Calendar</label>
            <select 
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className="w-full bg-surface-secondary border border-border-primary rounded-apple-lg px-3 py-2 text-text-primary"
            >
              <option value="">Select target calendar</option>
              {targetCalendars.map(cal => (
                <option key={cal.id} value={cal.id}>
                  {cal.provider === 'nudge' ? 'My Nudge Calendar' : cal.accountEmail}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 btn-secondary">Cancel</button>
          <button 
            onClick={() => onSave(sourceId, targetId)} 
            disabled={!sourceId || !targetId}
            className="flex-1 btn-primary disabled:opacity-50"
          >
            Add Rule
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CalendarSettings() {
  const { 
    calendars, 
    syncRules, 
    addCalendar, 
    removeCalendar, 
    addSyncRule,
    removeSyncRule,
    toggleSyncRule,
    updateSyncRule,
    setCalendars,
    setSyncRules,
    fetchConnectedCalendars,
    isLoading
  } = useCalendarSyncStore()
  
  const { user } = useAuth()
  const searchParams = useSearchParams()

  const [showAddRuleModal, setShowAddRuleModal] = useState(false)
  const [syncingCalendarId, setSyncingCalendarId] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    fetchConnectedCalendars(user.id)
  }, [user, fetchConnectedCalendars])

  useEffect(() => {
    const success = searchParams.get('success')
    if (success === 'calendar_connected') {
      fetchConnectedCalendars(user?.id!)
      window.history.replaceState({}, '', '/app/settings')
    }
  }, [searchParams, user, fetchConnectedCalendars])

  const handleConnectGoogle = () => {
    if (!user) return
    window.location.href = `/api/calendar/google/connect?user_id=${user.id}`
  }

  const handleRemoveCalendar = async (calendarId: string) => {
    try {
      await fetch(`/api/calendar/disconnect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ calendar_id: calendarId })
      })
      removeCalendar(calendarId)
    } catch (error) {
      console.error('Failed to remove calendar:', error)
    }
  }

  const handleColorChange = async (calendarId: string, color: string) => {
    // Update calendar store (settings UI)
    const { updateCalendar } = useCalendarSyncStore.getState()
    updateCalendar(calendarId, { color })

    // Update local calendar events to reflect the new color instantly
    const cal = calendars.find(c => c.id === calendarId)
    if (cal) {
      const sourceType = cal.provider === 'nudge' ? 'local' : cal.provider
      const store = useStore.getState()
      store.setCalendarEvents(
        store.calendarEvents.map(e =>
          e.sourceType === sourceType ? { ...e, color } : e
        )
      )
    }

    try {
      await fetch('/api/calendar/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ calendar_id: calendarId, color }),
      })
    } catch (error) {
      console.error('Failed to update calendar color:', error)
    }
  }

  const handleSyncCalendar = async (calendarId: string) => {
    setSyncingCalendarId(calendarId)
    try {
      await fetch('/api/calendar/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ calendar_id: calendarId }),
      })
    } catch (error) {
      console.error('Failed to sync calendar:', error)
    } finally {
      setSyncingCalendarId(null)
    }
  }

  const nudgeCalendar = calendars.find(c => c.provider === 'nudge')
  const externalCalendars = calendars.filter(c => c.provider !== 'nudge')
  const googleCalendars = calendars.filter(c => c.provider === 'google')

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-text-tertiary" />
      </div>
    )
  }

  // Only show external calendars in the connections list (not the Nudge local calendar)
  const displayCalendars = externalCalendars
  // All calendars including nudge — needed for sync rules
  const allCalendars = nudgeCalendar ? calendars : [
    {
      id: 'nudge-local',
      userId: user?.id || '',
      provider: 'nudge' as const,
      accountEmail: user?.email || 'me@example.com',
      accountName: 'My Nudge Calendar',
      isPrimary: true,
      color: '#6366f1',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    ...calendars
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
            <Calendar className="w-5 h-5 text-accent-secondary" />
            Calendar Connections
          </h2>
          <p className="text-sm text-text-tertiary mt-1">
            Connect external calendars to sync events with your Nudge calendar.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {displayCalendars.map(calendar => (
          <CalendarCard
            key={calendar.id}
            calendar={calendar}
            onRemove={() => handleRemoveCalendar(calendar.id)}
            onSync={calendar.provider !== 'nudge' ? () => handleSyncCalendar(calendar.id) : undefined}
            onColorChange={(color) => handleColorChange(calendar.id, color)}
            isSyncing={syncingCalendarId === calendar.id}
          />
        ))}
      </div>

      <button 
        onClick={handleConnectGoogle}
        className="btn-secondary flex items-center gap-2"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Connect Google Calendar
      </button>

      {calendars.length > 1 && (
        <div className="mt-8">
          <h3 className="text-md font-semibold text-text-primary mb-1">Sync Rules</h3>
          <p className="text-sm text-text-tertiary mb-4">
            Configure how events sync between your calendars.
          </p>

          <div className="bg-surface-secondary rounded-apple-lg overflow-hidden">
            <div className="grid grid-cols-[2fr_80px_140px_40px] gap-4 px-4 py-3 bg-background-primary border-b border-border-primary text-sm font-medium text-text-tertiary">
              <div>Sync from → to</div>
              <div>On</div>
              <div>Show as</div>
              <div></div>
            </div>

            {syncRules.map(rule => (
              <SyncRuleRow
                key={rule.id}
                rule={rule}
                calendars={allCalendars}
                onToggle={() => toggleSyncRule(rule.id)}
                onVisibilityChange={(v) => updateSyncRule(rule.id, { visibilityType: v })}
                onRemove={() => removeSyncRule(rule.id)}
              />
            ))}
          </div>

          <button onClick={() => setShowAddRuleModal(true)} className="mt-4 text-sm text-accent-primary hover:underline font-medium">
            + Add custom rule
          </button>
        </div>
      )}

      {googleCalendars.length === 0 && (
        <div className="bg-accent-secondary/10 border border-accent-secondary/20 rounded-apple-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <Globe className="w-4 h-4 text-accent-secondary" />
            <h4 className="text-sm font-medium text-text-primary">Connect Your Calendars</h4>
          </div>
          <p className="text-xs text-text-tertiary">
            Link your Google Calendar to automatically sync events with Nudge. 
            You'll be able to configure which events show up and how they're displayed.
          </p>
        </div>
      )}

      {showAddRuleModal && (
        <AddRuleModal
          calendars={allCalendars}
          onClose={() => setShowAddRuleModal(false)}
          onSave={(sourceId, targetId) => {
            if (!user) return
            addSyncRule({
              userId: user.id,
              sourceCalendarId: sourceId,
              targetCalendarId: targetId,
              isEnabled: true,
              visibilityType: 'title_only',
              syncDirection: 'one_way',
            })
            setShowAddRuleModal(false)
          }}
        />
      )}
    </div>
  )
}
