import { create } from 'zustand'
import { supabaseAuth } from './auth'

interface SubscriptionState {
  plan: 'free' | 'pro'
  status: string
  cancel_at_period_end: boolean
  current_period_end: string | null
  loading: boolean
  fetchSubscription: (userId: string) => Promise<void>
  reset: () => void
}

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  plan: 'free',
  status: 'active',
  cancel_at_period_end: false,
  current_period_end: null,
  loading: true,

  fetchSubscription: async (userId: string) => {
    try {
      const token = supabaseAuth.currentAccessToken
      const res = await fetch('/api/billing/subscription', {
        headers: {
          'x-user-id': userId,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })
      if (!res.ok) return
      const data = await res.json()
      set({ ...data, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  reset: () => set({ plan: 'free', status: 'active', cancel_at_period_end: false, current_period_end: null, loading: true }),
}))
