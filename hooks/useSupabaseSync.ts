'use client'

import { useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
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
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return

    const userId = session.user.id

    const [remindersRes, calendarRes, journalRes, objectivesRes] = await Promise.all([
      supabase.from('reminders').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('calendar_events').select('*').eq('user_id', userId).order('start_date', { ascending: true }),
      supabase.from('journal_entries').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('objectives').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    ])

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
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user || !isMounted) return

      currentUserId = session.user.id

      if (channelRef.current) {
        await supabase.removeChannel(channelRef.current)
      }

      const channel = supabase
        .channel('db-changes')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'reminders', filter: `user_id=eq.${currentUserId}` },
          (payload) => {
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
            if (payload.old) {
              reminderActions.deleteReminder(payload.old.id)
            }
          }
        )
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'calendar_events', filter: `user_id=eq.${currentUserId}` },
          (payload) => {
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
            if (payload.old) {
              calendarActions.deleteEvent(payload.old.id)
            }
          }
        )
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'journal_entries', filter: `user_id=eq.${currentUserId}` },
          (payload) => {
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
            if (payload.old) {
              journalActions.deleteEntry(payload.old.id)
            }
          }
        )
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'objectives', filter: `user_id=eq.${currentUserId}` },
          (payload) => {
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
            if (payload.old) {
              objectiveActions.deleteObjective(payload.old.id)
            }
          }
        )
        .subscribe()

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
