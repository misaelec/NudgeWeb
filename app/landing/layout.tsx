'use client'

import { ReactNode } from 'react'

export default function LandingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background-primary)' }}>
      {children}
    </div>
  )
}
