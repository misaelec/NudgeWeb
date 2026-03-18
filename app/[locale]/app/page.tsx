'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/components/Providers'
import {
  Focus,
  Bell,
  BookOpen,
  Target,
  TrendingUp,
  Clock,
  Sparkles,
  ArrowRight,
  BarChart3,
  Flame,
  Zap,
  CalendarCheck,
  Trophy
} from 'lucide-react'
import { useStore } from '@/lib/store'
import { useReminderStore } from '@/lib/reminderStore'
import { format, subDays } from 'date-fns'

export default function StatisticsPage() {
  const t = useTranslations('statistics')
  const router = useRouter()
  const { user, loading } = useAuth()
  const { objectives, fearObjectives, totalFocusMinutes, pomodoroSessions, streaks, journalEntries } = useStore()
  const { reminders } = useReminderStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

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

  if (!user) {
    router.push('/landing')
    return null
  }

  const activeObjectives = objectives.filter(o => !o.completed).length
  const activeFears = fearObjectives.filter(f => f.status === 'active').length
  const pendingReminders = reminders.filter(r => !r.completed).length
  const completedReminders = reminders.filter(r => r.completed).length
  const completedObjectives = objectives.filter(o => o.completed).length

  const weekAgo = subDays(new Date(), 7)
  const journalThisWeek = journalEntries.filter(e => new Date(e.createdAt) >= weekAgo).length

  return (
    <div className="min-h-screen bg-background-primary p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold text-text-primary mb-2">
            {t('title')}
          </h1>
          <p className="text-text-tertiary">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={<Focus className="w-6 h-6" />}
            label={t('focusTime')}
            value={`${Math.floor(totalFocusMinutes / 60)}h ${totalFocusMinutes % 60}m`}
            subtext={t('focusSessions', { n: pomodoroSessions })}
            color="blue"
            trend={totalFocusMinutes > 0 ? '+' : ''}
          />
          <StatCard
            icon={<Flame className="w-6 h-6" />}
            label={t('focusStreak')}
            value={streaks.focus?.currentCount || 0}
            subtext={t('focusStreakBest', { n: streaks.focus?.longestCount || 0 })}
            color="orange"
          />
          <StatCard
            icon={<BookOpen className="w-6 h-6" />}
            label={t('journalStreak')}
            value={streaks.journal?.currentCount || 0}
            subtext={t('journalThisWeek', { n: journalThisWeek })}
            color="green"
          />
          <StatCard
            icon={<Trophy className="w-6 h-6" />}
            label={t('objectives')}
            value={`${completedObjectives}/${objectives.length}`}
            subtext={t('objectivesActive', { n: activeObjectives })}
            color="purple"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <QuickActionCard
                icon={<Focus className="w-8 h-8" />}
                title={t('startFocus')}
                description={t('startFocusDesc')}
                color="blue"
                onClick={() => router.push('/app/focus')}
              />
              <QuickActionCard
                icon={<CalendarCheck className="w-8 h-8" />}
                title={t('addReminder')}
                description={t('addReminderDesc')}
                color="green"
                onClick={() => router.push('/app/reminders')}
              />
              <QuickActionCard
                icon={<BookOpen className="w-8 h-8" />}
                title={t('writeJournal')}
                description={t('writeJournalDesc')}
                color="orange"
                onClick={() => router.push('/app/journal')}
              />
              <QuickActionCard
                icon={<Target className="w-8 h-8" />}
                title={t('setObjectives')}
                description={t('setObjectivesDesc')}
                color="purple"
                onClick={() => router.push('/app/objectives')}
              />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-accent-secondary" />
              <h2 className="text-lg font-semibold text-text-primary">{t('todaysProgress')}</h2>
            </div>
            <div className="space-y-4">
              <ProgressItem
                label={t('progressReminders')}
                current={completedReminders}
                total={reminders.length}
                color="bg-accent-secondary"
              />
              <ProgressItem
                label={t('progressObjectives')}
                current={completedObjectives}
                total={objectives.length}
                color="bg-success"
              />
              <ProgressItem
                label={t('progressFocus')}
                current={pomodoroSessions}
                total={8}
                max={8}
                color="bg-action-warning"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-text-primary">{t('recentObjectives')}</h2>
              <button
                onClick={() => router.push('/app/objectives')}
                className="text-accent-primary text-sm font-medium hover:underline"
              >
                {t('viewAll')}
              </button>
            </div>
            {objectives.length > 0 ? (
              <div className="space-y-4">
                {objectives.slice(0, 3).map((obj) => (
                  <ObjectiveRow key={obj.id} objective={obj} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Target className="w-12 h-12 text-text-placeholder" />}
                title={t('noObjectivesTitle')}
                description={t('noObjectivesDesc')}
                action={t('addObjective')}
                onClick={() => router.push('/app/journal')}
              />
            )}
          </div>

          <div className="space-y-6">
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-text-primary">{t('upcoming')}</h2>
                <span className="text-xs text-text-tertiary">{t('upcomingDays')}</span>
              </div>
              {reminders.filter(r => !r.completed).slice(0, 4).length > 0 ? (
                <div className="space-y-3">
                  {reminders.filter(r => !r.completed).slice(0, 4).map((rem) => (
                    <div key={rem.id} className="flex items-center gap-3 p-3 bg-surface-secondary rounded-apple-lg">
                      <div className={`w-2 h-2 rounded-full ${
                        rem.priority === 'high' ? 'bg-action-danger' : 
                        rem.priority === 'medium' ? 'bg-action-warning' : 'bg-success'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-text-primary truncate">{rem.title}</p>
                        <p className="text-xs text-text-tertiary">
                          {format(new Date(rem.dueDate), 'EEE, MMM d')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-text-tertiary">
                  {t('noUpcoming')}
                </div>
              )}
            </div>

            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-action-warning" />
                <h2 className="text-lg font-semibold text-text-primary">{t('quickStats')}</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-surface-secondary rounded-apple-lg">
                  <p className="text-2xl font-semibold text-text-primary">{pendingReminders}</p>
                  <p className="text-xs text-text-tertiary">{t('pending')}</p>
                </div>
                <div className="text-center p-3 bg-surface-secondary rounded-apple-lg">
                  <p className="text-2xl font-semibold text-text-primary">{activeFears}</p>
                  <p className="text-xs text-text-tertiary">{t('activeFears')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, subtext, color, trend }: {
  icon: React.ReactNode
  label: string
  value: string | number
  subtext: string
  color: 'blue' | 'green' | 'orange' | 'purple' | 'red'
  trend?: string
}) {
  const colors = {
    blue: 'bg-accent-secondary/10 text-accent-secondary',
    green: 'bg-success/10 text-success',
    orange: 'bg-action-warning/10 text-action-warning',
    purple: 'bg-purple-500/10 text-purple-500',
    red: 'bg-action-danger/10 text-action-danger',
  }

  return (
    <div className="card">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-3 rounded-apple-lg ${colors[color as keyof typeof colors]}`}>
          {icon}
        </div>
        {trend && (
          <span className="text-xs font-medium text-success flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            {trend}
          </span>
        )}
      </div>
      <p className="text-2xl font-semibold text-text-primary">{value}</p>
      <p className="text-sm font-medium text-text-primary">{label}</p>
      <p className="text-xs text-text-tertiary mt-1">{subtext}</p>
    </div>
  )
}

function ProgressItem({ label, current, total, max, color }: {
  label: string
  current: number
  total: number
  max?: number
  color: string
}) {
  const displayMax = max || total

  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-text-secondary">{label}</span>
        <span className="text-text-primary font-medium">{current}/{displayMax}</span>
      </div>
      <div className="w-full h-2 bg-surface-secondary rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${Math.min((current / displayMax) * 100, 100)}%` }}
        />
      </div>
    </div>
  )
}

function QuickActionCard({ icon, title, description, color, onClick }: {
  icon: React.ReactNode
  title: string
  description: string
  color: 'blue' | 'green' | 'orange' | 'purple'
  onClick: () => void
}) {
  const colors = {
    blue: 'bg-accent-secondary/10 text-accent-secondary',
    green: 'bg-success/10 text-success',
    orange: 'bg-action-warning/10 text-action-warning',
    purple: 'bg-purple-500/10 text-purple-500',
  }

  return (
    <button
      onClick={onClick}
      className="card text-left hover:shadow-apple-lg transition-all duration-300 group w-full"
    >
      <div className="flex items-start gap-4">
        <div className={`p-4 rounded-apple-xl ${colors[color as keyof typeof colors]}`}>
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-text-primary group-hover:text-accent-primary transition-colors">
            {title}
          </h3>
          <p className="text-text-secondary text-sm mt-1">{description}</p>
        </div>
        <ArrowRight className="w-5 h-5 text-text-placeholder group-hover:text-accent-primary group-hover:translate-x-1 transition-all" />
      </div>
    </button>
  )
}

function ObjectiveRow({ objective }: { objective: any }) {
  const t = useTranslations('statistics')
  const categoryColors: Record<string, string> = {
    work: 'bg-accent-secondary/10 text-accent-secondary',
    personal: 'bg-success/10 text-success',
    health: 'bg-action-warning/10 text-action-warning',
    learning: 'bg-purple-500/10 text-purple-500',
  }

  return (
    <div className="flex items-center gap-4 p-4 bg-surface-secondary rounded-apple-lg">
      <div className={`px-3 py-1 rounded-full text-xs font-medium ${categoryColors[objective.category as string] || 'bg-text-placeholder/10 text-text-placeholder'}`}>
        {objective.category}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-text-primary truncate">{objective.title}</p>
        <p className="text-sm text-text-tertiary">{t('complete', { pct: objective.progress })}</p>
      </div>
      <div className="w-24 h-2 bg-border-primary rounded-full overflow-hidden">
        <div
          className="h-full bg-accent-primary rounded-full transition-all duration-500"
          style={{ width: `${objective.progress}%` }}
        />
      </div>
    </div>
  )
}

function EmptyState({ icon, title, description, action, onClick }: {
  icon: React.ReactNode
  title: string
  description: string
  action: string
  onClick: () => void
}) {
  return (
    <div className="text-center py-8">
      <div className="flex justify-center mb-4">{icon}</div>
      <h3 className="font-medium text-text-primary mb-1">{title}</h3>
      <p className="text-sm text-text-tertiary mb-4">{description}</p>
      <button onClick={onClick} className="btn-primary text-sm">
        {action}
      </button>
    </div>
  )
}
