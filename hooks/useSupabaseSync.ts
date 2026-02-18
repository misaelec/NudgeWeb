'use client'

import { useEffect, useRef, useCallback } from 'react'
import { supabase, syncSupabaseSession } from '@/lib/supabase'
import { useStore } from '@/lib/store'

export function useSupabaseSync() {
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
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

  const fetchAllData = useCallback(async () => {
    console.log('📥 Fetching all data from Supabase...')
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      console.log('⚠️ No session found, skipping fetch')
      return
    }

    console.log('✅ Session found, user:', session.user.id)
    const userId = session.user.id

    syncSupabaseSession(session.access_token, session.refresh_token)

    const [remindersRes, calendarRes, journalRes, objectivesRes] = await Promise.all([
      supabase.from('reminders').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('calendar_events').select('*').eq('user_id', userId).order('start_date', { ascending: true }),
      supabase.from('journal_entries').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('objectives').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    ])

    console.log('📊 Fetch results:', {
      reminders: remindersRes.data?.length || 0,
      calendar: calendarRes.data?.length || 0,
      journal: journalRes.data?.length || 0,
      objectives: objectivesRes.data?.length || 0,
    })

    if (remindersRes.data) {
      setReminders(remindersRes.data.map(r => ({
        ...r,
        dueDate: new Date(r.due_date),
        createdAt: new Date(r.created_at),
        completedAt: r.completed_at ? new Date(r.completed_at) : undefined,
      })))
    }

    if (calendarRes.data) {
      setCalendarEvents(calendarRes.data.map(e => ({
        ...e,
        startDate: new Date(e.start_date),
        endDate: new Date(e.end_date),
        createdAt: new Date(e.created_at),
      })))
    }

    if (journalRes.data) {
      setJournalEntries(journalRes.data.map(j => ({
        ...j,
        createdAt: new Date(j.created_at),
      })))
    }

    if (objectivesRes.data) {
      setObjectives(objectivesRes.data.map(o => ({
        ...o,
        dueDate: o.due_date ? new Date(o.due_date) : undefined,
        createdAt: new Date(o.created_at),
      })))
    }
  }, [setReminders, setCalendarEvents, setJournalEntries, setObjectives])

  useEffect(() => {
    let isMounted = true
    let currentUserId: string | null = null

    const setupChannel = async () => {
      console.log('🔌 Setting up Supabase realtime channel...')
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('❌ Session error:', sessionError)
        return
      }
      
      if (!session?.user) {
        console.log('⚠️ No session, cannot setup realtime')
        return
      }

      currentUserId = session.user.id
      syncSupabaseSession(session.access_token, session.refresh_token)
      
      console.log('✅ Setting up realtime for user:', currentUserId)

      if (channelRef.current) {
        await supabase.removeChannel(channelRef.current)
      }

      const channel = supabase
        .channel('db-changes')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'reminders', filter: `user_id=eq.${currentUserId}` },
          (payload) => {
            console.log('⚡ INSERT reminders:', payload.new)
            if (payload.new) {
              const newReminder = {
                ...payload.new,
                dueDate: new Date(payload.new.due_date),
                createdAt: new Date(payload.new.created_at),
                completedAt: payload.new.completed_at ? new Date(payload.new.completed_at) : undefined,
              }
              reminderActions.addReminder(newReminder as any)
            }
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'reminders', filter: `user_id=eq.${currentUserId}` },
          (payload) => {
            console.log('⚡ UPDATE reminders:', payload.new)
            if (payload.new) {
              const updatedReminder = {
                ...payload.new,
                dueDate: new Date(payload.new.due_date),
                createdAt: new Date(payload.new.created_at),
                completedAt: payload.new.completed_at ? new Date(payload.new.completed_at) : undefined,
              }
              reminderActions.updateReminder((payload.new as any).id, updatedReminder as any)
            }
          }
        )
        .on(
          'postgres_changes',
          { event: 'DELETE', schema: 'public', table: 'reminders', filter: `user_id=eq.${currentUserId}` },
          (payload) => {
            console.log('⚡ DELETE reminders:', payload.old)
            if (payload.old) {
              reminderActions.deleteReminder(payload.old.id)
            }
          }
        )
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'calendar_events', filter: `user_id=eq.${currentUserId}` },
          (payload) => {
            console.log('⚡ INSERT calendar_events:', payload.new)
            if (payload.new) {
              const newEvent = {
                ...payload.new,
                startDate: new Date(payload.new.start_date),
                endDate: new Date(payload.new.end_date),
                createdAt: new Date(payload.new.created_at),
              }
              calendarActions.addEvent(newEvent as any)
            }
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'calendar_events', filter: `user_id=eq.${currentUserId}` },
          (payload) => {
            console.log('⚡ UPDATE calendar_events:', payload.new)
            if (payload.new) {
              const updatedEvent = {
                ...payload.new,
                startDate: new Date(payload.new.start_date),
                endDate: new Date(payload.new.end_date),
                createdAt: new Date(payload.new.created_at),
              }
              calendarActions.updateEvent((payload.new as any).id, updatedEvent as any)
            }
          }
        )
        .on(
          'postgres_changes',
          { event: 'DELETE', schema: 'public', table: 'calendar_events', filter: `user_id=eq.${currentUserId}` },
          (payload) => {
            console.log('⚡ DELETE calendar_events:', payload.old)
            if (payload.old) {
              calendarActions.deleteEvent(payload.old.id)
            }
          }
        )
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'journal_entries', filter: `user_id=eq.${currentUserId}` },
          (payload) => {
            console.log('⚡ INSERT journal_entries:', payload.new)
            if (payload.new) {
              const newEntry = {
                ...payload.new,
                createdAt: new Date(payload.new.created_at),
              }
              journalActions.addEntry(newEntry as any)
            }
          }
        )
        .on(
          'postgres_changes',
          { event: 'DELETE', schema: 'public', table: 'journal_entries', filter: `user_id=eq.${currentUserId}` },
          (payload) => {
            console.log('⚡ DELETE journal_entries:', payload.old)
            if (payload.old) {
              journalActions.deleteEntry(payload.old.id)
            }
          }
        )
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'objectives', filter: `user_id=eq.${currentUserId}` },
          (payload) => {
            console.log('⚡ INSERT objectives:', payload.new)
            if (payload.new) {
              const newObjective = {
                ...payload.new,
                dueDate: payload.new.due_date ? new Date(payload.new.due_date) : undefined,
                createdAt: new Date(payload.new.created_at),
              }
              objectiveActions.addObjective(newObjective as any)
            }
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'objectives', filter: `user_id=eq.${currentUserId}` },
          (payload) => {
            console.log('⚡ UPDATE objectives:', payload.new)
            if (payload.new) {
              const updatedObjective = {
                ...payload.new,
                dueDate: payload.new.due_date ? new Date(payload.new.due_date) : undefined,
                createdAt: new Date(payload.new.created_at),
              }
              objectiveActions.updateObjective((payload.new as any).id, updatedObjective as any)
            }
          }
        )
        .on(
          'postgres_changes',
          { event: 'DELETE', schema: 'public', table: 'objectives', filter: `user_id=eq.${currentUserId}` },
          (payload) => {
            console.log('⚡ DELETE objectives:', payload.old)
            if (payload.old) {
              objectiveActions.deleteObjective(payload.old.id)
            }
          }
        )
        .subscribe((status) => {
          console.log('📡 Channel status:', status)
        })

      channelRef.current = channel
    }

    setupChannel()

    return () => {
      isMounted = false
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [reminderActions, calendarActions, journalActions, objectiveActions])

  return { fetchAllData }
}
