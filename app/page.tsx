'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/Providers'

export default function RootPage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace('/app/reminders')
      } else {
        router.replace('/landing')
      }
    }
  }, [user, loading, router])

  return (
    <div className="min-h-screen bg-background-primary flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-accent-primary/30 border-t-accent-primary rounded-full animate-spin" />
    </div>
  )
}
