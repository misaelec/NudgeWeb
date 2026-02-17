'use client'

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

const navItems = [
  { href: '/app/reminders', icon: Bell, label: 'Reminders' },
  { href: '/app', icon: BarChart3, label: 'Statistics' },
  { href: '/app/focus', icon: Focus, label: 'Focus' },
  { href: '/app/calendar', icon: Calendar, label: 'Calendar' },
  { href: '/app/journal', icon: BookOpen, label: 'Journal' },
  { href: '/app/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { user, signOut } = useAuth()

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
