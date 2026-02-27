'use client'

import { ReactNode, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { useAuth } from '@/components/Providers'

export default function AppLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, loading } = useAuth()

  const isAuthRoute = pathname ? (pathname.startsWith('/auth') || pathname.startsWith('auth')) : false

  useEffect(() => {
    if (!loading && !user && !isAuthRoute) {
      console.log('[AppLayout] No user found, redirecting to /landing')
      router.replace('/landing')
    }
  }, [user, loading, router, isAuthRoute])

  // Show nothing while loading auth state on auth routes, or while determining session
  if (!loading && !user && !isAuthRoute) {
    return null
  }

  if (isAuthRoute) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen bg-background-primary">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        {children}
      </main>
    </div>
  )
}
