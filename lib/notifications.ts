export type NotificationType = 
  | 'reminder_due'
  | 'reminder_completed'
  | 'focus_session_start'
  | 'focus_session_complete'
  | 'focus_break_start'
  | 'focus_break_complete'
  | 'streak_milestone'
  | 'journal_streak'
  | 'objective_complete'

interface NotificationData {
  title: string
  body: string
  icon?: string
  tag?: string
  requireInteraction?: boolean
  silent?: boolean
}

const notificationIcons: Record<NotificationType, string> = {
  reminder_due: '/icons/reminder.png',
  reminder_completed: '/icons/reminder-complete.png',
  focus_session_start: '/icons/focus.png',
  focus_session_complete: '/icons/focus-complete.png',
  focus_break_start: '/icons/break.png',
  focus_break_complete: '/icons/break-complete.png',
  streak_milestone: '/icons/streak.png',
  journal_streak: '/icons/journal.png',
  objective_complete: '/icons/objective.png',
}

class NotificationService {
  private permission: NotificationPermission = 'default'
  private defaultIcon: string = '/icons/icon-192.png'

  constructor() {
    if (typeof window !== 'undefined') {
      this.permission = Notification.permission
      console.log('NotificationService initialized, permission:', this.permission)
    }
  }

  async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined') return false

    try {
      console.log('Requesting notification permission...')
      this.permission = await Notification.requestPermission()
      console.log('Permission result:', this.permission)
      return this.permission === 'granted'
    } catch (error) {
      console.error('Failed to request notification permission:', error)
      return false
    }
  }

  get permissionStatus(): NotificationPermission {
    return this.permission
  }

  isSupported(): boolean {
    if (typeof window === 'undefined') return false
    return 'Notification' in window
  }

  async show(type: NotificationType, data: NotificationData): Promise<boolean> {
    console.log('NotificationService.show called:', type, data)
    
    if (this.permission !== 'granted') {
      console.log('Permission not granted, requesting...')
      const granted = await this.requestPermission()
      if (!granted) {
        console.log('Permission denied')
        return false
      }
    }

    if (typeof window === 'undefined') return false

    try {
      const icon = data.icon || notificationIcons[type] || this.defaultIcon
      console.log('Creating notification with icon:', icon)
      
      const notification = new Notification(data.title, {
        body: data.body,
        icon,
        tag: data.tag || type,
        requireInteraction: data.requireInteraction ?? false,
        silent: data.silent ?? false,
      })

      notification.onclick = () => {
        window.focus()
        notification.close()
      }

      console.log('Notification created successfully')
      return true
    } catch (error) {
      console.error('Failed to show notification:', error)
      return false
    }
  }

  async showReminderDue(title: string, dueDate: Date): Promise<boolean> {
    const formattedDate = dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    return this.show('reminder_due', {
      title: 'Reminder Due',
      body: `${title} - Due at ${formattedDate}`,
      tag: `reminder-${title}`,
    })
  }

  async showReminderCompleted(title: string): Promise<boolean> {
    return this.show('reminder_completed', {
      title: 'Reminder Completed',
      body: `Great job! "${title}" has been completed.`,
      tag: `reminder-complete-${title}`,
    })
  }

  async showFocusSessionComplete(sessionCount: number, totalMinutes: number): Promise<boolean> {
    return this.show('focus_session_complete', {
      title: 'Focus Session Complete!',
      body: `You completed ${sessionCount} session(s) totaling ${totalMinutes} minutes.`,
      requireInteraction: true,
    })
  }

  async showFocusBreakStart(minutes: number): Promise<boolean> {
    return this.show('focus_break_start', {
      title: 'Time for a Break',
      body: `Take a ${minutes}-minute break. You've earned it!`,
      tag: 'focus-break',
    })
  }

  async showFocusBreakComplete(): Promise<boolean> {
    return this.show('focus_break_complete', {
      title: 'Break Over',
      body: 'Ready to focus again?',
      tag: 'focus-break-complete',
    })
  }

  async showStreakMilestone(streakType: string, count: number): Promise<boolean> {
    return this.show('streak_milestone', {
      title: `${streakType.charAt(0).toUpperCase() + streakType.slice(1)} Streak!`,
      body: `You're on a ${count}-day ${streakType} streak! Keep it up!`,
      requireInteraction: true,
    })
  }

  async showJournalStreak(days: number): Promise<boolean> {
    return this.show('journal_streak', {
      title: 'Journal Streak!',
      body: `You've written in your journal for ${days} days in a row!`,
      tag: 'journal-streak',
    })
  }

  async showObjectiveComplete(title: string): Promise<boolean> {
    return this.show('objective_complete', {
      title: 'Objective Completed!',
      body: `Congratulations! "${title}" has been achieved.`,
      requireInteraction: true,
    })
  }

  scheduleLocalNotification(type: NotificationType, data: NotificationData, delayMs: number): number {
    if (typeof window === 'undefined') return -1

    const timeoutId = window.setTimeout(() => {
      this.show(type, data)
    }, delayMs)

    return timeoutId
  }

  cancelScheduledNotification(timeoutId: number): void {
    if (typeof window === 'undefined') return
    window.clearTimeout(timeoutId)
  }

  handleReminderNotification(
    title: string,
    dueDate: Date,
    reminderId: string
  ): number | null {
    console.log('handleReminderNotification called:', { title, dueDate, reminderId })
    console.log('Current permission:', this.permission)
    
    const now = new Date()
    const delay = dueDate.getTime() - now.getTime()
    console.log('Delay until notification (ms):', delay)

    if (delay <= 0) {
      console.log('Reminder is past due, showing immediately')
      this.show('reminder_due', {
        title: 'Reminder Due',
        body: title,
        tag: `reminder-${reminderId}`,
      })
      return null
    }

    // For testing: show notification now if within 60 seconds
    if (delay < 60000) {
      console.log('Testing mode: showing notification now')
      this.show('reminder_due', {
        title: 'Reminder Due (Scheduled)',
        body: `${title} - was due in ${Math.round(delay/1000)}s`,
        tag: `reminder-${reminderId}`,
      })
      return null
    }

    if (this.permission !== 'granted') {
      console.log('Permission not granted, cannot schedule')
      return null
    }

    return this.scheduleReminderNotification(title, dueDate, reminderId)
  }

  scheduleReminderNotification(
    title: string, 
    dueDate: Date, 
    reminderId: string
  ): number | null {
    const now = new Date()
    const delay = dueDate.getTime() - now.getTime()

    if (delay <= 0) return null

    return this.scheduleLocalNotification('reminder_due', {
      title: 'Reminder Due',
      body: title,
      tag: `reminder-${reminderId}`,
    }, delay)
  }

  scheduleFocusNotifications(
    sessionMinutes: number,
    breakMinutes: number,
    sessionCount: number
  ): { sessionTimeout: number; breakTimeout: number } | null {
    if (typeof window === 'undefined') return null

    const sessionDelay = sessionMinutes * 60 * 1000
    const breakDelay = sessionDelay + (breakMinutes * 60 * 1000)

    const sessionTimeout = this.scheduleLocalNotification('focus_session_complete', {
      title: 'Focus Session Complete',
      body: `Great work! ${sessionMinutes} minutes of focus completed.`,
      tag: 'focus-complete',
    }, sessionDelay)

    const breakTimeout = this.scheduleLocalNotification('focus_break_start', {
      title: 'Take a Break',
      body: `${breakMinutes} minutes to recharge.`,
      tag: 'focus-break',
    }, breakDelay)

    return { sessionTimeout, breakTimeout }
  }
}

export const notificationService = new NotificationService()
