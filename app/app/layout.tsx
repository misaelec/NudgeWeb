'use client'

import { ReactNode } from 'react'
import { AuthProvider } from '@/components/Providers'
import Sidebar from '@/components/Sidebar'

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <div className="flex min-h-screen bg-background-primary">
        <Sidebar />
        <main className="flex-1 ml-64 p-8">
          {children}
        </main>
      </div>
    </AuthProvider>
  )
}
