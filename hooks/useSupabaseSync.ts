'use client'

import { useEffect, useRef } from 'react'
import { useStore } from '@/lib/store'
import { useReminderStore } from '@/lib/reminderStore'
import { supabase } from '@/lib/supabase'

export function useSupabaseSync() {
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const isConnectedRef = useRef(false)
  const currentUserIdRef = useRef<string | null>(null)
  const isProcessingRef = useRef(false)

  const getAccessToken = (): string | null => {
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

  const injectAuth = async () => {
    const token = getAccessToken()
    if (token) {
      console.log('✅ Auth Token injected:', token.substring(0, 20) + '...')
      await supabase.auth.setSession({
        access_token: token,
        refresh_token: token,
      })
    }
  }

  const handleDatabaseChange = (payload: any, table: string) => {
    if (isProcessingRef.current) {
      return
    }

    console.log(`📡 Realtime change on ${table}:`, payload)
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
            reminderStore.addReminder({
              ...newRecord,
              id: newRecord.id,
              dueDate: newRecord.due_date ? new Date(newRecord.due_date) : new Date(),
              createdAt: newRecord.created_at ? new Date(newRecord.created_at) : new Date(),
              completed: newRecord.is_completed ?? false,
              completedAt: newRecord.completed_at ? new Date(newRecord.completed_at) : undefined,
            })
          } else if (eventType === 'UPDATE') {
            reminderStore.updateReminder(newRecord.id, {
              ...newRecord,
              dueDate: newRecord.due_date ? new Date(newRecord.due_date) : new Date(),
              completedAt: newRecord.completed_at ? new Date(newRecord.completed_at) : undefined,
            }, true)
          } else if (eventType === 'DELETE') {
            reminderStore.deleteReminder(oldRecord.id, true)
          }
          break
        case 'calendar_events':
          if (eventType === 'INSERT') {
            store.calendarActions.addEvent({
              ...newRecord,
              startDate: new Date(newRecord.start_date),
              endDate: new Date(newRecord.end_date),
              createdAt: new Date(newRecord.created_at),
            })
          } else if (eventType === 'UPDATE') {
            store.calendarActions.updateEvent(newRecord.id, {
              ...newRecord,
              startDate: new Date(newRecord.start_date),
              endDate: new Date(newRecord.end_date),
            })
          } else if (eventType === 'DELETE') {
            store.calendarActions.deleteEvent(oldRecord.id)
          }
          break
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
      console.log('🧹 Cleaning up WebSocket channel...')
      channelRef.current.unsubscribe()
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
      isConnectedRef.current = false
      currentUserIdRef.current = null
    }
  }

  const fetchAllData = async () => {
    const token = getAccessToken()
    const userId = getUserId()
    if (!token || !userId) return

    console.log('📥 Fetching all data from Supabase...')

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'apikey': 'sb_publishable_4HHk7Qa7gY-Qnoa8dbCa6Q_ZnebZgQJ',
    }

    const API_URL = 'https://tdidckvdawyctcswoppi.supabase.co'

    try {
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

      console.log('📊 Fetch results:', {
        reminders: reminders?.length || 0,
        calendar: calendar?.length || 0,
        journal: journal?.length || 0,
        objectives: objectives?.length || 0,
      })

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
          ...e,
          startDate: new Date(e.start_date),
          endDate: new Date(e.end_date),
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
      console.error('Error fetching data:', error)
    }
  }

  const setupRealtime = () => {
    const token = getAccessToken()
    const userId = getUserId()

    if (!token || !userId) {
      console.log('⚠️ No token or userId, skipping realtime setup')
      return
    }

    if (channelRef.current && isConnectedRef.current && currentUserIdRef.current === userId) {
      console.log('⏭️ Already connected for user:', userId)
      return
    }

    if (channelRef.current) {
      cleanupChannel()
    }

    console.log('🔌 Setting up WebSocket realtime...')

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
        console.log('📡 WebSocket status:', status)
        if (status === 'SUBSCRIBED') {
          console.log('✅ WebSocket connected and subscribed to all tables!')
          isConnectedRef.current = true
          currentUserIdRef.current = userId
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ WebSocket CHANNEL_ERROR')
          isConnectedRef.current = false
        } else if (status === 'CLOSED') {
          console.log('📡 WebSocket closed')
          isConnectedRef.current = false
        }
      })

    channelRef.current = channel
  }

  useEffect(() => {
    const userId = getUserId()
    if (!userId) {
      cleanupChannel()
      return
    }

    if (currentUserIdRef.current === userId && channelRef.current) {
      return
    }

    currentUserIdRef.current = userId
    
    injectAuth().then(() => {
      fetchAllData()
    })

    return () => {
      cleanupChannel()
    }
  }, [])

  return { fetchAllData }
}
