'use client'

import { useEffect, useRef, useState } from 'react'
import { useStore } from '@/lib/store'
import { useReminderStore } from '@/lib/reminderStore'
import { supabase, syncSupabaseSession } from '@/lib/supabase'
import { useAuth } from '@/components/Providers'

export function useSupabaseSync() {
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const isConnectedRef = useRef(false)
  const currentUserIdRef = useRef<string | null>(null)
  const isProcessingRef = useRef(false)
  const [isReady, setIsReady] = useState(false)

  const { user, loading } = useAuth()

  const isAuthCallback = typeof window !== 'undefined' && window.location.pathname === '/auth/callback'

  useEffect(() => {
    if (isAuthCallback) {
      return
    }

    if (loading) {
      return
    }

    if (!user) {
      setIsReady(false)
      cleanupChannel()
      return
    }

    setIsReady(true)
  }, [user, loading, isAuthCallback])

  const getAccessToken = async (): Promise<string | null> => {
    if (typeof window === 'undefined') return null
    
    const stored = localStorage.getItem('supabase_session')
    if (stored) {
      try {
        const session = JSON.parse(stored)
        if (session.access_token) {
          return session.access_token
        }
      } catch {
        return null
      }
    }
    return null
  }

  const getUserId = (): string | null => {
    if (typeof window === 'undefined') return null
    const stored = localStorage.getItem('supabase_session')
    if (stored) {
      try {
        const session = JSON.parse(stored)
        return session.user?.id || null
      } catch {
        return null
      }
    }
    return null
  }

  const handleDatabaseChange = (payload: any, table: string) => {
    if (isProcessingRef.current) {
      return
    }

    const { eventType, new: newRecord, old: oldRecord } = payload
    
    isProcessingRef.current = true

    const reminderStore = useReminderStore.getState()
    const store = useStore.getState()

    try {
      switch (table) {
        case 'reminders':
          if (eventType === 'INSERT') {
            const existing = reminderStore.reminders.find(r => r.id === newRecord.id)
            if (existing) return
            reminderStore.syncFromRealtime({
              id: newRecord.id,
              title: newRecord.title,
              notes: newRecord.notes,
              dueDate: newRecord.due_date ? new Date(newRecord.due_date) : new Date(),
              priority: newRecord.priority || 'medium',
              completed: newRecord.is_completed ?? false,
              createdAt: newRecord.created_at ? new Date(newRecord.created_at) : new Date(),
            })
          } else if (eventType === 'UPDATE') {
            reminderStore.syncFromRealtime({
              id: newRecord.id,
              title: newRecord.title || '',
              notes: newRecord.notes,
              dueDate: newRecord.due_date ? new Date(newRecord.due_date) : new Date(),
              priority: newRecord.priority || 'medium',
              completed: newRecord.is_completed ?? false,
            })
          } else if (eventType === 'DELETE') {
            reminderStore.deleteReminder(oldRecord.id, true)
          }
          break
        case 'calendar_events': {
          const mapEvent = (r: any) => ({
            id: r.id,
            title: r.title || '(No title)',
            description: r.description || '',
            startDate: new Date(r.start_date),
            endDate: new Date(r.end_date),
            location: r.location || '',
            color: r.color || '#007AFF',
            sourceType: r.source_type || 'local',
            createdAt: new Date(r.created_at),
          })
          if (eventType === 'INSERT') {
            const exists = store.calendarEvents.some((e: any) => e.id === newRecord.id)
            if (!exists) {
              useStore.setState({
                calendarEvents: [...store.calendarEvents, mapEvent(newRecord)]
              })
            }
          } else if (eventType === 'UPDATE') {
            useStore.setState({
              calendarEvents: store.calendarEvents.map((e: any) =>
                e.id === newRecord.id ? { ...e, ...mapEvent(newRecord) } : e
              )
            })
          } else if (eventType === 'DELETE') {
            useStore.setState({
              calendarEvents: store.calendarEvents.filter((e: any) => e.id !== oldRecord.id)
            })
          }
          break
        }
        case 'journal_entries':
          if (eventType === 'INSERT') {
            store.journalActions.addEntry({
              ...newRecord,
              createdAt: new Date(newRecord.created_at),
            })
          } else if (eventType === 'DELETE') {
            store.journalActions.deleteEntry(oldRecord.id)
          }
          break
        case 'objectives':
          if (eventType === 'INSERT') {
            store.objectiveActions.addObjective({
              ...newRecord,
              dueDate: newRecord.due_date ? new Date(newRecord.due_date) : undefined,
              createdAt: new Date(newRecord.created_at),
            })
          } else if (eventType === 'UPDATE') {
            store.objectiveActions.updateObjective(newRecord.id, {
              ...newRecord,
              dueDate: newRecord.due_date ? new Date(newRecord.due_date) : undefined,
            })
          } else if (eventType === 'DELETE') {
            store.objectiveActions.deleteObjective(oldRecord.id)
          }
          break
      }
    } finally {
      setTimeout(() => {
        isProcessingRef.current = false
      }, 100)
    }
  }

  const cleanupChannel = () => {
    if (channelRef.current) {
      channelRef.current.unsubscribe()
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
      isConnectedRef.current = false
      currentUserIdRef.current = null
    }
  }

  const fetchAllData = async () => {
    try {
      const token = await getAccessToken()
      const userId = getUserId()
      if (!token || !userId) {
        return
      }

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'apikey': 'sb_publishable_4HHk7Qa7gY-Qnoa8dbCa6Q_ZnebZgQJ',
      }

      const API_URL = 'https://tdidckvdawyctcswoppi.supabase.co'

      const [remindersRes, calendarRes, journalRes, objectivesRes] = await Promise.all([
        fetch(`${API_URL}/rest/v1/reminders?user_id=eq.${userId}&order=created_at.desc`, { headers }),
        fetch(`${API_URL}/rest/v1/calendar_events?user_id=eq.${userId}&order=start_date.asc`, { headers }),
        fetch(`${API_URL}/rest/v1/journal_entries?user_id=eq.${userId}&order=created_at.desc`, { headers }),
        fetch(`${API_URL}/rest/v1/objectives?user_id=eq.${userId}&order=created_at.desc`, { headers }),
      ])

      const reminders = await remindersRes.json()
      const calendar = await calendarRes.json()
      const journal = await journalRes.json()
      const objectives = await objectivesRes.json()

      const reminderStore = useReminderStore.getState()
      const store = useStore.getState()

      if (Array.isArray(reminders)) {
        reminderStore.setReminders(reminders.map((r: any) => ({
          ...r,
          id: r.id,
          dueDate: r.due_date ? new Date(r.due_date) : new Date(),
          createdAt: r.created_at ? new Date(r.created_at) : new Date(),
          completed: r.is_completed ?? false,
          completedAt: r.completed_at ? new Date(r.completed_at) : undefined,
        })))
      }

      if (Array.isArray(calendar)) {
        store.setCalendarEvents(calendar.map((e: any) => ({
          id: e.id,
          title: e.title || '(No title)',
          description: e.description || '',
          startDate: new Date(e.start_date),
          endDate: new Date(e.end_date),
          location: e.location || '',
          color: e.color || '#007AFF',
          sourceType: e.source_type || 'local',
          createdAt: new Date(e.created_at),
        })))
      }

      if (Array.isArray(journal)) {
        store.setJournalEntries(journal.map((j: any) => ({
          ...j,
          createdAt: new Date(j.created_at),
        })))
      }

      if (Array.isArray(objectives)) {
        store.setObjectives(objectives.map((o: any) => ({
          ...o,
          dueDate: o.due_date ? new Date(o.due_date) : undefined,
          createdAt: new Date(o.created_at),
        })))
      }

      setupRealtime()
    } catch (error) {
      console.warn('⚠️ Error fetching data (caught):', error)
    }
  }

  const setupRealtime = async () => {
    const token = await getAccessToken()
    const userId = getUserId()

    if (!token || !userId) {
      return
    }

    // Sync the auth session to the Supabase client so Realtime
    // RLS filtering works (auth.uid() must match user_id)
    const stored = localStorage.getItem('supabase_session')
    if (stored) {
      try {
        const session = JSON.parse(stored)
        if (session.access_token && session.refresh_token) {
          syncSupabaseSession(session.access_token, session.refresh_token)
        }
      } catch {}
    }

    if (channelRef.current && isConnectedRef.current && currentUserIdRef.current === userId) {
      return
    }

    if (channelRef.current) {
      cleanupChannel()
    }

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
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          isConnectedRef.current = true
          currentUserIdRef.current = userId
        } else if (status === 'CHANNEL_ERROR') {
          isConnectedRef.current = false
        } else if (status === 'CLOSED') {
          isConnectedRef.current = false
        }
      })

    channelRef.current = channel
  }

  useEffect(() => {
    if (!isReady) {
      return
    }

    if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
      return
    }

    const userId = getUserId()
    if (!userId) {
      cleanupChannel()
      return
    }

    if (currentUserIdRef.current === userId && channelRef.current) {
      return
    }

    currentUserIdRef.current = userId
    
    getAccessToken().then((token) => {
      if (token) {
        try {
          fetchAllData()
        } catch (error) {
          console.warn('Data fetch error:', error)
        }
      }
    })

    return () => {
      cleanupChannel()
    }
  }, [isReady])

  return { fetchAllData }
}
