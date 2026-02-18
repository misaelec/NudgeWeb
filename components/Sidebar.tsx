'use client'

import { useState, useEffect } from 'react'
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
  BarChart3
} from 'lucide-react'
import { useAuth } from './Providers'

export default function Sidebar() {
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const [featureFlags, setFeatureFlags] = useState<Record<string, boolean>>({
    reminders: true,
    calendar: true,
    events: true,
    pomodoro: true,
    appBlocking: true,
    journal: true,
    objectives: true,
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
          onClick={() => signOut()}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-apple-lg text-text-tertiary hover:text-action-danger hover:bg-action-danger/10 transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
