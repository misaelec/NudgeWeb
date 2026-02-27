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
  console.log('[AppLayout] pathname:', pathname, 'isAuthRoute:', isAuthRoute, 'loading:', loading, 'user:', !!user)

  useEffect(() => {
    // Only redirect after loading is complete AND no user found AND not an auth route
    if (!loading && !user && !isAuthRoute) {
      console.log('[AppLayout] No user after loading, redirecting to landing')
      router.replace('/landing')
    }
  }, [user, loading, router, isAuthRoute])

  // Show nothing while loading auth state on auth routes, or while determining session
  if (!loading && !user && !isAuthRoute) {
    return null
  }

  if (isAuthRoute) {
    console.log('[AppLayout] Rendering auth route children')
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
