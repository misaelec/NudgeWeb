'use client'

import { useState } from 'react'
import { useCalendarSyncStore, ConnectedCalendar, CalendarSyncRule, VisibilityType, SyncDirection } from '@/lib/calendarSyncStore'

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
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-center gap-3">
        <div 
          className="w-4 h-4 rounded-full" 
          style={{ backgroundColor: calendar.color }}
        />
        <div>
          <p className="font-medium text-gray-900">{calendar.accountName || calendar.accountEmail}</p>
          <p className="text-sm text-gray-500">{PROVIDER_LABELS[calendar.provider]}</p>
        </div>
      </div>
      <button
        onClick={onRemove}
        className="text-gray-400 hover:text-red-500 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
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
    <div className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0">
      <div className="flex-1">
        <span className="text-sm font-medium text-gray-700">
          {sourceCalendar.accountName || sourceCalendar.accountEmail}
        </span>
        <span className="mx-2 text-gray-400">→</span>
        <span className="text-sm font-medium text-gray-700">
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
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
      </label>

      <select
        value={rule.visibilityType}
        onChange={(e) => onVisibilityChange(e.target.value as VisibilityType)}
        className="text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
      >
        {VISIBILITY_OPTIONS.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>

      <select
        value={rule.syncDirection}
        onChange={(e) => onDirectionChange(e.target.value as SyncDirection)}
        className="text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
    updateSyncRule 
  } = useCalendarSyncStore()

  const nudgeCalendar = calendars.find(c => c.provider === 'nudge')

  // Mock data for demonstration
  const mockCalendars: ConnectedCalendar[] = calendars.length > 0 ? calendars : [
    {
      id: '1',
      userId: 'user-1',
      provider: 'nudge',
      accountEmail: 'me@example.com',
      accountName: 'My Nudge Calendar',
      isPrimary: true,
      color: '#6366f1',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      userId: 'user-1',
      provider: 'google',
      accountEmail: 'work@gmail.com',
      accountName: 'Work Calendar',
      isPrimary: false,
      color: '#ea4335',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '3',
      userId: 'user-1',
      provider: 'google',
      accountEmail: 'personal@gmail.com',
      accountName: 'Personal',
      isPrimary: false,
      color: '#34a853',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '4',
      userId: 'user-1',
      provider: 'apple',
      accountEmail: 'icloud.com',
      accountName: 'iCloud',
      isPrimary: false,
      color: '#a259ff',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]

  const mockRules: CalendarSyncRule[] = syncRules.length > 0 ? syncRules : [
    {
      id: 'r1',
      userId: 'user-1',
      sourceCalendarId: '2', // Work
      targetCalendarId: '1',  // Nudge
      isEnabled: true,
      visibilityType: 'busy',
      syncDirection: 'one_way',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'r2',
      userId: 'user-1',
      sourceCalendarId: '3', // Personal
      targetCalendarId: '1', // Nudge
      isEnabled: true,
      visibilityType: 'full',
      syncDirection: 'one_way',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'r3',
      userId: 'user-1',
      sourceCalendarId: '4', // iCloud
      targetCalendarId: '1', // Nudge
      isEnabled: false,
      visibilityType: 'busy',
      syncDirection: 'bidirectional',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]

  const externalCalendars = mockCalendars.filter(c => c.provider !== 'nudge')

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Calendar Connections</h2>
        <p className="text-gray-600 mb-6">
          Connect external calendars to sync events with your Nudge calendar.
        </p>

        <div className="space-y-3">
          {mockCalendars.map(calendar => (
            <CalendarCard
              key={calendar.id}
              calendar={calendar}
              onRemove={() => removeCalendar(calendar.id)}
            />
          ))}
        </div>

        <button className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Connect Calendar
        </button>
      </div>

      {externalCalendars.length > 0 && nudgeCalendar && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Sync Rules</h2>
          <p className="text-gray-600 mb-6">
            Configure how events from connected calendars sync to your Nudge calendar.
          </p>

          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="grid grid-cols-[2fr_100px_140px_140px] gap-4 px-4 py-3 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-500">
              <div>Block events from</div>
              <div>Active</div>
              <div>Show as</div>
              <div>Direction</div>
            </div>

            {mockRules.map(rule => (
              <SyncRuleRow
                key={rule.id}
                rule={rule}
                calendars={mockCalendars}
                onToggle={() => toggleSyncRule(rule.id)}
                onVisibilityChange={(v) => updateSyncRule(rule.id, { visibilityType: v })}
                onDirectionChange={(d) => updateSyncRule(rule.id, { syncDirection: d })}
              />
            ))}
          </div>

          <button className="mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium">
            + Add custom rule
          </button>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-1">Coming Soon</h3>
        <p className="text-sm text-blue-700">
          OAuth integration for Google, Apple, and Outlook calendars will be available in the next update.
          For now, you can see the UI layout and configure sync rules.
        </p>
      </div>
    </div>
  )
}
