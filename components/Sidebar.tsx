'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Focus,
  Calendar,
  Bell,
  BookOpen,
  Settings,
  LogOut,
  Sparkles,
  BarChart3,
  MessageSquarePlus,
  X,
  Send,
  Smile,
} from 'lucide-react'
import { useAuth } from './Providers'

function FeedbackModal({ email, onClose }: { email: string; onClose: () => void }) {
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || status === 'sending') return
    setStatus('sending')
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, email }),
      })
      if (!res.ok) throw new Error()
      setStatus('sent')
      setTimeout(onClose, 1500)
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-surface-primary border border-border-primary rounded-apple-xl shadow-2xl w-[420px] mx-4 flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-primary">
          <h2 className="text-text-primary font-semibold text-sm">Send Feedback</h2>
          <button onClick={onClose} className="text-text-tertiary hover:text-text-primary transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-text-tertiary">Your message</label>
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What's on your mind? Bug reports, suggestions, anything..."
              rows={5}
              className="bg-surface-secondary text-text-primary placeholder-text-tertiary text-sm px-3 py-2.5 rounded-apple-lg border border-border-primary outline-none focus:ring-1 focus:ring-accent-primary resize-none"
            />
          </div>

          {status === 'error' && (
            <p className="text-xs text-red-500">Something went wrong. Please try again.</p>
          )}

          <button
            type="submit"
            disabled={!message.trim() || status === 'sending' || status === 'sent'}
            className="flex items-center justify-center gap-2 bg-accent-primary text-white text-sm font-medium py-2.5 rounded-apple-lg disabled:opacity-50 transition-opacity"
          >
            {status === 'sent' ? (
              'Feedback sent!'
            ) : status === 'sending' ? (
              'Sending...'
            ) : (
              <>
                <Send size={15} />
                Send Feedback
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function Sidebar() {
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [featureFlags, setFeatureFlags] = useState<Record<string, boolean>>({
    reminders: true,
    calendar: true,
    events: true,
    pomodoro: true,
    appBlocking: true,
    journal: true,
    objectives: true,
    happiness: true,
  })

  useEffect(() => {
    const loadFlags = () => {
      const stored = localStorage.getItem('nudge-feature-flags')
      if (stored) {
        setFeatureFlags(JSON.parse(stored))
      }
    }
    loadFlags()
    
    const handleStorage = () => loadFlags()
    const handleCustom = () => loadFlags()
    window.addEventListener('storage', handleStorage)
    window.addEventListener('feature-flags-updated', handleCustom)
    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener('feature-flags-updated', handleCustom)
    }
  }, [])

  const navItems = [
    { href: '/app/reminders', icon: Bell, label: 'Reminders', key: 'reminders' },
    { href: '/app', icon: BarChart3, label: 'Statistics', key: null },
    { href: '/app/focus', icon: Focus, label: 'Focus', key: 'pomodoro' },
    { href: '/app/calendar', icon: Calendar, label: 'Calendar', key: 'calendar' },
    { href: '/app/journal', icon: BookOpen, label: 'Journal', key: 'journal' },
    { href: '/app/happiness', icon: Smile, label: 'Well-being', key: 'happiness' },
    { href: '/app/settings', icon: Settings, label: 'Settings', key: null },
  ].filter(item => item.key === null || featureFlags[item.key] !== false)

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-background-secondary border-r border-border-primary flex flex-col">
      <div className="p-6">
        <Link href="/app/reminders" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent-primary rounded-apple-xl flex items-center justify-center shadow-apple">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-semibold text-text-primary">Nudge</span>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-border-primary">
        {user && (
          <div className="flex items-center gap-3 px-3 py-2 mb-3">
            <div className="w-9 h-9 bg-accent-primary rounded-full flex items-center justify-center text-white font-medium">
              {(user.name || user.email).charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">{user.name || user.email.split('@')[0]}</p>
              <p className="text-xs text-text-tertiary truncate">{user.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={() => setFeedbackOpen(true)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-apple-lg text-text-tertiary hover:text-text-primary hover:bg-surface-secondary transition-all duration-200 mb-1"
        >
          <MessageSquarePlus className="w-5 h-5" />
          <span>Feedback</span>
        </button>
        <button
          onClick={() => signOut()}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-apple-lg text-text-tertiary hover:text-action-danger hover:bg-action-danger/10 transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </button>
      </div>

      {feedbackOpen && (
        <FeedbackModal
          email={user?.email ?? ''}
          onClose={() => setFeedbackOpen(false)}
        />
      )}
    </aside>
  )
}
