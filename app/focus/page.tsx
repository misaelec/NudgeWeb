'use client'

import { useState, useEffect, useCallback } from 'react'
import Sidebar from '@/components/Sidebar'
import { useAuth } from '@/components/Providers'
import { useStore } from '@/lib/store'
import { notificationService } from '@/lib/notifications'
import { Play, Pause, RotateCcw, Clock, Target, Shield, CheckCircle2, XCircle, Bell, BellOff } from 'lucide-react'

export default function FocusPage() {
  const { user, loading } = useAuth()
  const { pomodoroActions, preferences } = useStore()
  const [mounted, setMounted] = useState(false)
  const [mode, setMode] = useState<'pomodoro' | 'shortBreak' | 'longBreak'>('pomodoro')
  const [isRunning, setIsRunning] = useState(false)
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [sessions, setSessions] = useState(0)
  const [notificationPermission, setNotificationPermission] = useState<string>('default')

  useEffect(() => {
    setMounted(true)
    if (typeof window !== 'undefined') {
      setNotificationPermission(notificationService.permissionStatus)
    }
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)
    } else if (timeLeft === 0) {
      setIsRunning(false)
      if (mode === 'pomodoro') {
        setSessions((s) => s + 1)
        pomodoroActions.completeSession(25)
        if (preferences.focusNotifications) {
          notificationService.showFocusSessionComplete(sessions + 1, (sessions + 1) * 25)
        }
      }
    }
    return () => clearInterval(interval)
  }, [isRunning, timeLeft, mode, pomodoroActions, preferences.focusNotifications, sessions])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const startTimer = useCallback(async () => {
    if (preferences.focusNotifications && notificationPermission !== 'granted') {
      await notificationService.requestPermission()
      setNotificationPermission(notificationService.permissionStatus)
    }
    setIsRunning(true)
  }, [preferences.focusNotifications, notificationPermission])

  const pauseTimer = () => setIsRunning(false)
  const resetTimer = () => {
    setIsRunning(false)
    setTimeLeft(getTimeForMode(mode))
  }

  const switchMode = (newMode: 'pomodoro' | 'shortBreak' | 'longBreak') => {
    setMode(newMode)
    setIsRunning(false)
    setTimeLeft(getTimeForMode(newMode))
  }

  const getTimeForMode = (m: typeof mode) => {
    switch (m) {
      case 'pomodoro': return 25 * 60
      case 'shortBreak': return 5 * 60
      case 'longBreak': return 15 * 60
    }
  }

  const requestNotificationPermission = async () => {
    const granted = await notificationService.requestPermission()
    setNotificationPermission(granted ? 'granted' : 'denied')
  }

  const progress = ((getTimeForMode(mode) - timeLeft) / getTimeForMode(mode)) * 100

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

  const isPomodoroEnabled = preferences.pomodoroEnabled
  const isAppBlockingEnabled = preferences.appBlockingEnabled && preferences.notificationsEnabled

  return (
    <div className="min-h-screen bg-background-primary">
      <Sidebar />

      <main className="ml-64 p-8">
        <div className="max-w-4xl mx-auto">
          <header className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-semibold text-text-primary mb-2">
                Focus Mode
              </h1>
              <p className="text-text-tertiary">Stay productive with Pomodoro technique</p>
            </div>
            {notificationPermission !== 'granted' && (
              <button
                onClick={requestNotificationPermission}
                className="btn-secondary flex items-center gap-2"
              >
                <BellOff className="w-4 h-4" />
                Enable Notifications
              </button>
            )}
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2 card">
              <div className="text-center py-8">
                <div className="flex justify-center gap-2 mb-8">
                  {[
                    { id: 'pomodoro', label: 'Pomodoro' },
                    { id: 'shortBreak', label: 'Short Break' },
                    { id: 'longBreak', label: 'Long Break' }
                  ].map(item => (
                    <button
                      key={item.id}
                      onClick={() => switchMode(item.id as typeof mode)}
                      className={`px-4 py-2 rounded-apple-lg font-medium transition-all ${
                        mode === item.id
                          ? 'bg-accent-primary text-white'
                          : 'bg-surface-secondary text-text-secondary hover:bg-border-primary'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                <div className="relative w-64 h-64 mx-auto mb-8">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="128"
                      cy="128"
                      r="120"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      className="text-surface-secondary"
                    />
                    <circle
                      cx="128"
                      cy="128"
                      r="120"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${progress * 7.54} 754`}
                      className="text-accent-primary transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-6xl font-light text-text-primary tabular-nums">
                      {formatTime(timeLeft)}
                    </span>
                  </div>
                </div>

                <div className="flex justify-center gap-4">
                  {!isRunning ? (
                    <button onClick={startTimer} className="btn-primary px-8 py-3 text-lg flex items-center gap-2">
                      <Play className="w-5 h-5" />
                      Start
                    </button>
                  ) : (
                    <button onClick={pauseTimer} className="btn-secondary px-8 py-3 text-lg flex items-center gap-2">
                      <Pause className="w-5 h-5" />
                      Pause
                    </button>
                  )}
                  <button onClick={resetTimer} className="btn-secondary px-6 py-3">
                    <RotateCcw className="w-5 h-5" />
                  </button>
                </div>

                <div className="mt-8 pt-8 border-t border-border-primary">
                  <p className="text-sm text-text-tertiary">
                    Sessions completed today: <span className="font-semibold text-text-primary">{sessions}</span>
                  </p>
                  <p className="text-sm text-text-tertiary mt-1">
                    Total focus time: <span className="font-semibold text-text-primary">{sessions * 25} minutes</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="card">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-accent-secondary/10 rounded-apple-lg">
                    <Clock className="w-5 h-5 text-accent-secondary" />
                  </div>
                  <h3 className="font-semibold text-text-primary">Session Stats</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-text-tertiary">Today</span>
                    <span className="font-medium text-text-primary">{sessions} sessions</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-text-tertiary">Focus Time</span>
                    <span className="font-medium text-text-primary">{sessions * 25} min</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-text-tertiary">Break Time</span>
                    <span className="font-medium text-text-primary">{sessions * 5} min</span>
                  </div>
                </div>
              </div>

              {isAppBlockingEnabled && (
                <div className="card">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-action-danger/10 rounded-apple-lg">
                      <Shield className="w-5 h-5 text-action-danger" />
                    </div>
                    <h3 className="font-semibold text-text-primary">App Blocking</h3>
                  </div>
                  <p className="text-sm text-text-tertiary mb-4">
                    Block distracting apps during focus sessions.
                  </p>
                  <div className="flex items-center justify-between p-3 bg-surface-secondary rounded-apple-lg">
                    <div className="flex items-center gap-3">
                      {notificationPermission === 'granted' ? (
                        <CheckCircle2 className="w-5 h-5 text-success" />
                      ) : (
                        <XCircle className="w-5 h-5 text-text-tertiary" />
                      )}
                      <span className="text-sm font-medium text-text-primary">
                        {notificationPermission === 'granted' ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <span className="text-xs text-text-tertiary">iOS only</span>
                  </div>
                </div>
              )}

              <div className="card">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-success/10 rounded-apple-lg">
                    <Target className="w-5 h-5 text-success" />
                  </div>
                  <h3 className="font-semibold text-text-primary">Today's Goal</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-text-tertiary">Sessions</span>
                    <span className="font-medium text-text-primary">{sessions}/8</span>
                  </div>
                  <div className="w-full h-2 bg-surface-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent-primary rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((sessions / 8) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
