'use client'

import { useEffect, useState } from 'react'

export default function ThemeInitializer() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    const handleSettingsUpdate = () => {
      try {
        const stored = localStorage.getItem('nudge-settings')
        if (stored) {
          const settings = JSON.parse(stored)
          if (settings.darkMode === 'dark') {
            document.documentElement.classList.add('dark')
          } else {
            document.documentElement.classList.remove('dark')
          }
        }
      } catch (e) {
        console.error('Error applying theme:', e)
      }
    }

    window.addEventListener('settings-updated', handleSettingsUpdate)
    
    return () => {
      window.removeEventListener('settings-updated', handleSettingsUpdate)
    }
  }, [])

  return null
}
