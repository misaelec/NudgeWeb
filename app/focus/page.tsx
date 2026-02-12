'use client'

import { useState, useEffect, useCallback } from 'react'
import Sidebar from '@/components/Sidebar'
import { useAuth } from '@/components/Providers'
import { useStore } from '@/lib/store'
import { Play, Pause, RotateCcw, Clock, Target, Shield, CheckCircle2, XCircle } from 'lucide-react'

export default function FocusPage() {
  const { user, loading } = useAuth()
  const { pomodoroActions, featureFlags } = useStore()
  const [mounted, setMounted] = useState(false)
  const [mode, setMode] = useState<'pomodoro' | 'shortBreak' | 'longBreak'>('pomodoro')
  const [isRunning, setIsRunning] = useState(false)
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [sessions, setSessions] = useState(0)

  useEffect(() => {
    setMounted(true)
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
      }
    }
    return () => clearInterval(interval)
  }, [isRunning, timeLeft, mode, pomodoroActions])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const startTimer = () => setIsRunning(true)
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

  if (loading || !mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-apple-gray-50">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-apple-blue/20 rounded-apple-xl animate-pulse" />
          <p className="text-apple-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const isAppBlockingEnabled = featureFlags?.appBlocking !== false

  return (
    <div className="min-h-screen bg-apple-gray-50 dark:bg-apple-gray-950">
      <Sidebar />

      <main className="ml-64 p-8">
        <div className="max-w-4xl mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl font-semibold text-apple-gray-900 dark:text-white mb-2">
              Focus Mode
            </h1>
            <p className="text-apple-gray-500">Stay productive with Pomodoro technique</p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2 card">
              <div className="text-center py-8">
                <div className="flex justify-center gap-2 mb-8">
                  <button
                    onClick={() => switchMode('pomodoro')}
                    className={`px-4 py-2 rounded-apple-lg font-medium transition-all ${
                      mode === 'pomodoro'
                        ? 'bg-apple-blue text-white'
                        : 'bg-apple-gray-100 dark:bg-apple-gray-800 text-apple-gray-600 dark:text-apple-gray-400'
                    }`}
                  >
                    Pomodoro
                  </button>
                  <button
                    onClick={() => switchMode('shortBreak')}
                    className={`px-4 py-2 rounded-apple-lg font-medium transition-all ${
                      mode === 'shortBreak'
                        ? 'bg-apple-blue text-white'
                        : 'bg-apple-gray-100 dark:bg-apple-gray-800 text-apple-gray-600 dark:text-apple-gray-400'
                    }`}
                  >
                    Short Break
                  </button>
                  <button
                    onClick={() => switchMode('longBreak')}
                    className={`px-4 py-2 rounded-apple-lg font-medium transition-all ${
                      mode === 'longBreak'
                        ? 'bg-apple-blue text-white'
                        : 'bg-apple-gray-100 dark:bg-apple-gray-800 text-apple-gray-600 dark:text-apple-gray-400'
                    }`}
                  >
                    Long Break
                  </button>
                </div>

                <div className="text-8xl font-light text-apple-gray-900 dark:text-white mb-8 tabular-nums">
                  {formatTime(timeLeft)}
                </div>

                <div className="flex justify-center gap-4">
                  {!isRunning ? (
                    <button onClick={startTimer} className="btn-primary px-8 py-3 text-lg">
                      <Play className="w-5 h-5 mr-2 inline" />
                      Start
                    </button>
                  ) : (
                    <button onClick={pauseTimer} className="btn-secondary px-8 py-3 text-lg">
                      <Pause className="w-5 h-5 mr-2 inline" />
                      Pause
                    </button>
                  )}
                  <button onClick={resetTimer} className="btn-secondary px-6 py-3">
                    <RotateCcw className="w-5 h-5" />
                  </button>
                </div>

                <div className="mt-8 pt-8 border-t border-apple-gray-100 dark:border-apple-gray-800">
                  <p className="text-sm text-apple-gray-500">
                    Sessions completed today: <span className="font-semibold text-apple-gray-900 dark:text-white">{sessions}</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="card">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-apple-blue/10 rounded-apple-lg">
                    <Clock className="w-5 h-5 text-apple-blue" />
                  </div>
                  <h3 className="font-semibold text-apple-gray-900 dark:text-white">Session Stats</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-apple-gray-500">Today</span>
                    <span className="font-medium text-apple-gray-900 dark:text-white">{sessions} sessions</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-apple-gray-500">Focus Time</span>
                    <span className="font-medium text-apple-gray-900 dark:text-white">{sessions * 25} min</span>
                  </div>
                </div>
              </div>

              {isAppBlockingEnabled && (
                <div className="card">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-apple-red/10 rounded-apple-lg">
                      <Shield className="w-5 h-5 text-apple-red" />
                    </div>
                    <h3 className="font-semibold text-apple-gray-900 dark:text-white">App Blocking</h3>
                  </div>
                  <p className="text-sm text-apple-gray-500 mb-4">
                    Block distracting apps during focus sessions.
                  </p>
                  <div className="flex items-center justify-between p-3 bg-apple-gray-50 dark:bg-apple-gray-800 rounded-apple-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-apple-green" />
                      <span className="text-sm font-medium text-apple-gray-900 dark:text-white">Enabled</span>
                    </div>
                    <span className="text-xs text-apple-gray-500">iOS only</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
