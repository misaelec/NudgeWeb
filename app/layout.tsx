import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/components/Providers'

export const metadata: Metadata = {
  title: 'Nudge - Your Personal Growth Companion',
  description: 'Nudge helps you achieve your goals through focus, organization, and self-reflection.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
