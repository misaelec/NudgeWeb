'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'

export function useSupabaseSync() {
  const { 
    reminderActions,
    calendarActions,
    journalActions,
    objectiveActions,
    setReminders,
    setCalendarEvents,
    setJournalEntries,
    setObjectives,
  } = useStore()

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  const getAccessToken = useCallback((): string | null => {
    if (typeof window === 'undefined') return null
    const stored = localStorage.getItem('supabase_session')
    if (stored) {
      try {
        const session = JSON.parse(stored)
        return session.access_token || null
      } catch {
        return null
      }
    }
    return null
  }, [])

  const injectAuth = useCallback(async () => {
    const token = getAccessToken()
    if (token) {
      console.log('✅ Auth Token injected:', token.substring(0, 20) + '...')
      await supabase.auth.setSession({
        access_token: token,
        refresh_token: token,
      })
    } else {
      console.log('⚠️ No auth token found in localStorage')
    }
  }, [getAccessToken])

  const handleDatabaseChange = useCallback((payload: any, table: string) => {
    console.log(`📡 Realtime change on ${table}:`, payload)
    const { eventType, new: newRecord, old: oldRecord } = payload
    
    switch (table) {
      case 'reminders':
        if (eventType === 'INSERT') {
          reminderActions.addReminder({
            ...newRecord,
            dueDate: new Date(newRecord.due_date),
            createdAt: new Date(newRecord.created_at),
            completedAt: newRecord.completed_at ? new Date(newRecord.completed_at) : undefined,
          })
        } else if (eventType === 'UPDATE') {
          reminderActions.updateReminder(newRecord.id, {
            ...newRecord,
            dueDate: new Date(newRecord.due_date),
            completedAt: newRecord.completed_at ? new Date(newRecord.completed_at) : undefined,
          })
        } else if (eventType === 'DELETE') {
          reminderActions.deleteReminder(oldRecord.id)
        }
        break
      case 'calendar_events':
        if (eventType === 'INSERT') {
          calendarActions.addEvent({
            ...newRecord,
            startDate: new Date(newRecord.start_date),
            endDate: new Date(newRecord.end_date),
            createdAt: new Date(newRecord.created_at),
          })
        } else if (eventType === 'UPDATE') {
          calendarActions.updateEvent(newRecord.id, {
            ...newRecord,
            startDate: new Date(newRecord.start_date),
            endDate: new Date(newRecord.end_date),
          })
        } else if (eventType === 'DELETE') {
          calendarActions.deleteEvent(oldRecord.id)
        }
        break
      case 'journal_entries':
        if (eventType === 'INSERT') {
          journalActions.addEntry({
            ...newRecord,
            createdAt: new Date(newRecord.created_at),
          })
        } else if (eventType === 'UPDATE') {
          // journalEntries is immutable, no update
        } else if (eventType === 'DELETE') {
          journalActions.deleteEntry(oldRecord.id)
        }
        break
      case 'objectives':
        if (eventType === 'INSERT') {
          objectiveActions.addObjective({
            ...newRecord,
            dueDate: newRecord.due_date ? new Date(newRecord.due_date) : undefined,
            createdAt: new Date(newRecord.created_at),
          })
        } else if (eventType === 'UPDATE') {
          objectiveActions.updateObjective(newRecord.id, {
            ...newRecord,
            dueDate: newRecord.due_date ? new Date(newRecord.due_date) : undefined,
          })
        } else if (eventType === 'DELETE') {
          objectiveActions.deleteObjective(oldRecord.id)
        }
        break
    }
  }, [reminderActions, calendarActions, journalActions, objectiveActions])

  const setupRealtime = useCallback(async () => {
    const token = getAccessToken()
    if (!token) {
      console.log('⚠️ No token, skipping realtime setup')
      return
    }

    console.log('🔌 Setting up WebSocket realtime...')
    await injectAuth()

    const channel = supabase
      .channel('db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reminders' },
        (payload) => handleDatabaseChange(payload, 'reminders')
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'calendar_events' },
        (payload) => handleDatabaseChange(payload, 'calendar_events')
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'journal_entries' },
        (payload) => handleDatabaseChange(payload, 'journal_entries')
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'objectives' },
        (payload) => handleDatabaseChange(payload, 'objectives')
      )
      .subscribe((status) => {
        console.log('📡 WebSocket status:', status)
        if (status === 'SUBSCRIBED') {
          console.log('✅ WebSocket connected and subscribed to all tables!')
        }
      })

    channelRef.current = channel
  }, [getAccessToken, injectAuth, handleDatabaseChange])

  const fetchAllData = useCallback(async () => {
    console.log('📥 Fetching all data from Supabase...')
    const token = getAccessToken()
    if (!token) {
      console.log('⚠️ No access token, skipping fetch')
      return
    }

    console.log('✅ Token found, fetching data...')

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'apikey': 'sb_publishable_4HHk7Qa7gY-Qnoa8dbCa6Q_ZnebZgQJ',
    }

    const API_URL = 'https://tdidckvdawyctcswoppi.supabase.co'

    const [remindersRes, calendarRes, journalRes, objectivesRes] = await Promise.all([
      fetch(`${API_URL}/rest/v1/reminders?select=*&order=created_at.desc`, { headers }),
      fetch(`${API_URL}/rest/v1/calendar_events?select=*&order=start_date.asc`, { headers }),
      fetch(`${API_URL}/rest/v1/journal_entries?select=*&order=created_at.desc`, { headers }),
      fetch(`${API_URL}/rest/v1/objectives?select=*&order=created_at.desc`, { headers }),
    ])

    const reminders = await remindersRes.json()
    const calendar = await calendarRes.json()
    const journal = await journalRes.json()
    const objectives = await objectivesRes.json()

    console.log('📊 Fetch results:', {
      reminders: reminders?.length || 0,
      calendar: calendar?.length || 0,
      journal: journal?.length || 0,
      objectives: objectives?.length || 0,
    })

    if (Array.isArray(reminders)) {
      setReminders(reminders.map((r: any) => ({
        ...r,
        dueDate: new Date(r.due_date),
        createdAt: new Date(r.created_at),
        completedAt: r.completed_at ? new Date(r.completed_at) : undefined,
      })))
    }

    if (Array.isArray(calendar)) {
      setCalendarEvents(calendar.map((e: any) => ({
        ...e,
        startDate: new Date(e.start_date),
        endDate: new Date(e.end_date),
        createdAt: new Date(e.created_at),
      })))
    }

    if (Array.isArray(journal)) {
      setJournalEntries(journal.map((j: any) => ({
        ...j,
        createdAt: new Date(j.created_at),
      })))
    }

    if (Array.isArray(objectives)) {
      setObjectives(objectives.map((o: any) => ({
        ...o,
        dueDate: o.due_date ? new Date(o.due_date) : undefined,
        createdAt: new Date(o.created_at),
      })))
    }

    await setupRealtime()
  }, [getAccessToken, setReminders, setCalendarEvents, setJournalEntries, setObjectives, setupRealtime])

  useEffect(() => {
    fetchAllData()

    return () => {
      if (channelRef.current) {
        console.log('🧹 Cleaning up WebSocket channel')
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [])

  return { fetchAllData }
}
