'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/Providers'
import Sidebar from '@/components/Sidebar'
import {
  Focus,
  Calendar,
  Bell,
  BookOpen,
  Target,
  TrendingUp,
  Clock,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Play,
  X,
  BarChart3,
  Flame,
  Zap,
  CalendarCheck,
  Trophy
} from 'lucide-react'
import { useStore } from '@/lib/store'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'

export default function Dashboard() {
  const router = useRouter()
  const { user, loading, signIn, signUp, signInWithGoogle } = useAuth()
  const { objectives, fearObjectives, reminders, totalFocusMinutes, pomodoroSessions, streaks, journalEntries } = useStore()
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
    return <LandingPage signIn={signIn} signUp={signUp} signInWithGoogle={signInWithGoogle} />
  }

  const activeObjectives = objectives.filter(o => !o.completed).length
  const activeFears = fearObjectives.filter(f => f.status === 'active').length
  const pendingReminders = reminders.filter(r => !r.completed).length
  const completedReminders = reminders.filter(r => r.completed).length
  const completedObjectives = objectives.filter(o => o.completed).length

  const weekAgo = subDays(new Date(), 7)
  const journalThisWeek = journalEntries.filter(e => new Date(e.createdAt) >= weekAgo).length

  return (
    <div className="min-h-screen bg-background-primary">
      <Sidebar />

      <main className="ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl font-semibold text-text-primary mb-2">
              Welcome back, {user.name || user.email.split('@')[0]}
            </h1>
            <p className="text-text-tertiary">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              icon={<Focus className="w-6 h-6" />}
              label="Focus Time"
              value={`${Math.floor(totalFocusMinutes / 60)}h ${totalFocusMinutes % 60}m`}
              subtext={`${pomodoroSessions} sessions today`}
              color="blue"
              trend={totalFocusMinutes > 0 ? '+' : ''}
            />
            <StatCard
              icon={<Flame className="w-6 h-6" />}
              label="Focus Streak"
              value={streaks.focus?.currentCount || 0}
              subtext={`Best: ${streaks.focus?.longestCount || 0} days`}
              color="orange"
            />
            <StatCard
              icon={<BookOpen className="w-6 h-6" />}
              label="Journal Streak"
              value={streaks.journal?.currentCount || 0}
              subtext={`${journalThisWeek} this week`}
              color="green"
            />
            <StatCard
              icon={<Trophy className="w-6 h-6" />}
              label="Objectives"
              value={`${completedObjectives}/${objectives.length}`}
              subtext={`${activeObjectives} active`}
              color="purple"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <QuickActionCard
                  icon={<Focus className="w-8 h-8" />}
                  title="Start Focus Session"
                  description="Begin a Pomodoro timer and block distractions"
                  color="blue"
                  onClick={() => router.push('/focus')}
                />
                <QuickActionCard
                  icon={<CalendarCheck className="w-8 h-8" />}
                  title="Add Reminder"
                  description="Never miss an important task"
                  color="green"
                  onClick={() => router.push('/reminders')}
                />
                <QuickActionCard
                  icon={<BookOpen className="w-8 h-8" />}
                  title="Write Journal"
                  description="Capture your thoughts and reflections"
                  color="orange"
                  onClick={() => router.push('/journal')}
                />
                <QuickActionCard
                  icon={<Target className="w-8 h-8" />}
                  title="Set Objectives"
                  description="Define your goals and key results"
                  color="purple"
                  onClick={() => router.push('/journal')}
                />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-accent-secondary" />
                <h2 className="text-lg font-semibold text-text-primary">Today's Progress</h2>
              </div>
              <div className="space-y-4">
                <ProgressItem
                  label="Reminders"
                  current={completedReminders}
                  total={reminders.length}
                  color="bg-accent-secondary"
                />
                <ProgressItem
                  label="Objectives"
                  current={completedObjectives}
                  total={objectives.length}
                  color="bg-success"
                />
                <ProgressItem
                  label="Focus Sessions"
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
                <h2 className="text-lg font-semibold text-text-primary">Recent Objectives</h2>
                <button
                  onClick={() => router.push('/journal')}
                  className="text-accent-primary text-sm font-medium hover:underline"
                >
                  View All
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
                  title="No objectives yet"
                  description="Create your first objective to track your goals"
                  action="Add Objective"
                  onClick={() => router.push('/journal')}
                />
              )}
            </div>

            <div className="space-y-6">
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-text-primary">Upcoming</h2>
                  <span className="text-xs text-text-tertiary">Next 7 days</span>
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
                    No upcoming reminders
                  </div>
                )}
              </div>

              <div className="card">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-5 h-5 text-action-warning" />
                  <h2 className="text-lg font-semibold text-text-primary">Quick Stats</h2>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-surface-secondary rounded-apple-lg">
                    <p className="text-2xl font-semibold text-text-primary">{pendingReminders}</p>
                    <p className="text-xs text-text-tertiary">Pending</p>
                  </div>
                  <div className="text-center p-3 bg-surface-secondary rounded-apple-lg">
                    <p className="text-2xl font-semibold text-text-primary">{activeFears}</p>
                    <p className="text-xs text-text-tertiary">Active Fears</p>
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
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0
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
        <p className="text-sm text-text-tertiary">{objective.progress}% complete</p>
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

function LandingPage({ signIn, signUp, signInWithGoogle }: {
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signUp: (email: string, password: string) => Promise<{ success: boolean; error?: string; needsConfirmation?: boolean }>
  signInWithGoogle: () => Promise<void>
}) {
  const router = useRouter()
  const [showAuth, setShowAuth] = useState(false)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleAuth = async () => {
    setError('')
    setIsLoading(true)
    
    let result
    if (authMode === 'signup') {
      result = await signUp(email, password)
    } else {
      result = await signIn(email, password)
    }
    
    setIsLoading(false)
    
    if (result.success) {
      router.push('/')
    } else {
      setError(result.error || 'Authentication failed')
    }
  }

  return (
    <div className="min-h-screen bg-background-primary">
      <header className="fixed top-0 left-0 right-0 z-50 bg-background-primary/80 backdrop-blur-lg border-b border-border-primary">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent-primary rounded-apple-xl flex items-center justify-center shadow-apple">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold text-text-primary">Nudge</span>
          </div>
          <button
            onClick={() => setShowAuth(true)}
            className="btn-primary"
          >
            Get Started
          </button>
        </div>
      </header>

      <main className="pt-24">
        <section className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-accent-primary/10 text-accent-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              Your Personal Growth Companion
            </div>
            <h1 className="text-5xl md:text-7xl font-semibold text-text-primary mb-6 leading-tight">
              Achieve More.<br />
              <span className="text-accent-primary">Stress Less.</span>
            </h1>
            <p className="text-xl text-text-secondary mb-10 max-w-2xl mx-auto">
              Nudge combines focus techniques, goal tracking, and self-reflection
              tools to help you become your best self.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setShowAuth(true)}
                className="btn-primary text-lg px-8 py-3"
              >
                Try Nudge Free
                <ArrowRight className="w-5 h-5 ml-2 inline" />
              </button>
              <button className="btn-secondary text-lg px-8 py-3">
                <Play className="w-5 h-5 mr-2 inline" />
                Watch Demo
              </button>
            </div>
          </div>

          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Focus className="w-8 h-8 text-accent-primary" />}
              title="Focus Mode"
              description="Pomodoro timer with app blocking to help you stay in the zone."
            />
            <FeatureCard
              icon={<Target className="w-8 h-8 text-success" />}
              title="OKR Tracking"
              description="Set objectives and track key results to achieve your goals."
            />
            <FeatureCard
              icon={<BookOpen className="w-8 h-8 text-action-warning" />}
              title="Fear Setting"
              description="Address your fears with Tim Ferriss proven methodology."
            />
          </div>
        </section>

        <section className="bg-surface-secondary py-20">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-3xl font-semibold text-center text-text-primary mb-12">Everything You Need</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <FeatureGridItem icon={<Clock className="w-6 h-6" />} label="Pomodoro Timer" />
              <FeatureGridItem icon={<Calendar className="w-6 h-6" />} label="Calendar" />
              <FeatureGridItem icon={<Bell className="w-6 h-6" />} label="Reminders" />
              <FeatureGridItem icon={<BookOpen className="w-6 h-6" />} label="Journal" />
              <FeatureGridItem icon={<Target className="w-6 h-6" />} label="Objectives" />
              <FeatureGridItem icon={<TrendingUp className="w-6 h-6" />} label="Fear Setting" />
              <FeatureGridItem icon={<CheckCircle2 className="w-6 h-6" />} label="Habits" />
              <FeatureGridItem icon={<Sparkles className="w-6 h-6" />} label="AI Insights" />
            </div>
          </div>
        </section>
      </main>

      {showAuth && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-primary rounded-apple-xl shadow-apple-xl p-8 w-full max-w-md animate-scale-in">
            <div className="text-center mb-8">
              <div className="w-12 h-12 bg-accent-primary rounded-apple-xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-semibold text-text-primary">
                {authMode === 'signin' ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p className="text-text-secondary mt-1">
                {authMode === 'signin' ? 'Sign in to continue to Nudge' : 'Get started with Nudge'}
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-action-danger/10 text-action-danger rounded-apple-lg text-sm">
                {error}
              </div>
            )}

            {authMode === 'signup' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-secondary mb-1">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input"
                  placeholder="Your name"
                />
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-text-secondary mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="you@example.com"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-text-secondary mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="••••••••"
              />
            </div>

            <button 
              onClick={handleAuth} 
              className="btn-primary w-full mb-4 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Please wait...' : (authMode === 'signin' ? 'Sign In' : 'Create Account')}
            </button>

            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border-primary" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-surface-primary text-text-tertiary">Or continue with</span>
              </div>
            </div>

            <button
              onClick={() => signInWithGoogle()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-border-primary rounded-apple-lg hover:bg-surface-secondary transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span className="text-text-primary font-medium">Google</span>
            </button>

            <p className="text-center text-sm text-text-tertiary mt-6">
              {authMode === 'signin' ? (
                <>
                  Don&apos;t have an account?{' '}
                  <button onClick={() => { setAuthMode('signup'); setError(''); }} className="text-accent-primary font-medium hover:underline">
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button onClick={() => { setAuthMode('signin'); setError(''); }} className="text-accent-primary font-medium hover:underline">
                    Sign in
                  </button>
                </>
              )}
            </p>

            <button
              onClick={() => { setShowAuth(false); setError(''); }}
              className="absolute top-4 right-4 text-text-tertiary hover:text-text-primary transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function FeatureCard({ icon, title, description }: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="card text-center hover:shadow-apple-lg transition-shadow">
      <div className="w-16 h-16 bg-surface-secondary rounded-apple-xl flex items-center justify-center mx-auto mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-text-primary mb-2">{title}</h3>
      <p className="text-text-secondary text-sm">{description}</p>
    </div>
  )
}

function FeatureGridItem({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <div className="w-12 h-12 bg-surface-secondary rounded-apple-xl flex items-center justify-center">
        {icon}
      </div>
      <span className="text-sm text-text-secondary">{label}</span>
    </div>
  )
}
