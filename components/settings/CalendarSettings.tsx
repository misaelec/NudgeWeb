'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { useCalendarSyncStore, ConnectedCalendar, CalendarSyncRule, VisibilityType, SyncDirection } from '@/lib/calendarSyncStore'
import { useAuth } from '@/components/Providers'
import { Calendar, Plus, X, Globe, Loader2 } from 'lucide-react'

const PROVIDER_LABELS: Record<string, string> = {
  google: 'Google Calendar',
  apple: 'Apple Calendar',
  outlook: 'Outlook',
  nudge: 'Nudge (Local)',
}

const VISIBILITY_OPTIONS: { value: VisibilityType; label: string }[] = [
  { value: 'busy', label: 'Show as Busy' },
  { value: 'full', label: 'Show Full Details' },
  { value: 'blocked', label: 'Blocked' },
]

const DIRECTION_OPTIONS: { value: SyncDirection; label: string }[] = [
  { value: 'one_way', label: 'One-way' },
  { value: 'bidirectional', label: 'Bidirectional' },
]

function CalendarCard({ calendar, onRemove }: { calendar: ConnectedCalendar; onRemove: () => void }) {
  return (
    <div className="flex items-center justify-between p-4 bg-surface-secondary rounded-apple-lg">
      <div className="flex items-center gap-3">
        <div 
          className="w-4 h-4 rounded-full" 
          style={{ backgroundColor: calendar.color }}
        />
        <div>
          <p className="font-medium text-text-primary">{calendar.accountName || calendar.accountEmail}</p>
          <p className="text-sm text-text-tertiary">{PROVIDER_LABELS[calendar.provider]}</p>
        </div>
      </div>
      <button
        onClick={onRemove}
        className="text-text-tertiary hover:text-action-danger transition-colors"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  )
}

function SyncRuleRow({ 
  rule, 
  calendars,
  onToggle,
  onVisibilityChange,
  onDirectionChange 
}: { 
  rule: CalendarSyncRule
  calendars: ConnectedCalendar[]
  onToggle: () => void
  onVisibilityChange: (v: VisibilityType) => void
  onDirectionChange: (d: SyncDirection) => void
}) {
  const sourceCalendar = calendars.find(c => c.id === rule.sourceCalendarId)
  const targetCalendar = calendars.find(c => c.id === rule.targetCalendarId)

  if (!sourceCalendar || !targetCalendar) return null

  return (
    <div className="flex items-center gap-4 py-3 border-b border-border-primary last:border-0">
      <div className="flex-1 flex items-center gap-2">
        <span className="text-sm font-medium text-text-primary">
          {sourceCalendar.accountName || sourceCalendar.accountEmail}
        </span>
        <span className="text-text-tertiary">→</span>
        <span className="text-sm font-medium text-text-primary">
          {targetCalendar.accountName || targetCalendar.accountEmail}
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

      <select
        value={rule.syncDirection}
        onChange={(e) => onDirectionChange(e.target.value as SyncDirection)}
        className="text-sm bg-surface-secondary border border-border-primary rounded-apple-lg px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
      >
        {DIRECTION_OPTIONS.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )
}

export default function CalendarSettings() {
  const { 
    calendars, 
    syncRules, 
    addCalendar, 
    removeCalendar, 
    toggleSyncRule,
    updateSyncRule,
    setCalendars,
    setSyncRules,
    fetchConnectedCalendars,
    isLoading
  } = useCalendarSyncStore()
  
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const [justConnected, setJustConnected] = useState(false)

  // Load calendars from Supabase on mount
  useEffect(() => {
    console.log('📅 CalendarSettings: useEffect triggered', { user: user?.id })
    if (!user) {
      console.log('📅 CalendarSettings: No user, skipping fetch')
      return
    }
    console.log('📅 CalendarSettings: Fetching calendars for user:', user.id)
    fetchConnectedCalendars(user.id).then(() => {
      console.log('📅 CalendarSettings: Fetch complete')
    }).catch(err => {
      console.error('📅 CalendarSettings: Fetch error', err)
    })
  }, [user, fetchConnectedCalendars])

  // Check for OAuth redirect params
  useEffect(() => {
    const success = searchParams.get('success')
    const error = searchParams.get('error')
    if (success === 'calendar_connected' || error) {
      console.log('📅 CalendarSettings: OAuth redirect detected, re-fetching')
      setJustConnected(true)
      fetchConnectedCalendars(user?.id!).then(() => {
        console.log('📅 CalendarSettings: Re-fetch after OAuth complete')
      })
      // Clear URL params
      window.history.replaceState({}, '', '/app/settings')
    }
  }, [searchParams, user, fetchConnectedCalendars])

  const handleConnectGoogle = () => {
    if (!user) return
    // Direct redirect - the API route will redirect to Google
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

  // Get nudge calendar and external calendars
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

  // Ensure nudge calendar always exists in display
  const displayCalendars = nudgeCalendar ? calendars : [
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

      {externalCalendars.length > 0 && (
        <div className="mt-8">
          <h3 className="text-md font-semibold text-text-primary mb-1">Sync Rules</h3>
          <p className="text-sm text-text-tertiary mb-4">
            Configure how events from connected calendars sync to your Nudge calendar.
          </p>

          <div className="bg-surface-secondary rounded-apple-lg overflow-hidden">
            <div className="grid grid-cols-[2fr_80px_140px_140px] gap-4 px-4 py-3 bg-background-primary border-b border-border-primary text-sm font-medium text-text-tertiary">
              <div>Block events from</div>
              <div>Active</div>
              <div>Show as</div>
              <div>Direction</div>
            </div>

            {syncRules.map(rule => (
              <SyncRuleRow
                key={rule.id}
                rule={rule}
                calendars={displayCalendars}
                onToggle={() => toggleSyncRule(rule.id)}
                onVisibilityChange={(v) => updateSyncRule(rule.id, { visibilityType: v })}
                onDirectionChange={(d) => updateSyncRule(rule.id, { syncDirection: d })}
              />
            ))}
          </div>

          <button className="mt-4 text-sm text-accent-primary hover:underline font-medium">
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
    </div>
  )
}
