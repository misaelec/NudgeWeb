import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/components/Providers'
import { Analytics } from '@vercel/analytics/next'

export const metadata: Metadata = {
  title: 'Nudge - Your Personal Growth Companion',
  description: 'Nudge helps you achieve your goals through focus, organization, and self-reflection.',
  other: {
    'google-site-verification': '7KDJdhcdqujpN7oYBI1g2_vVMJop-jY5H4VE9flYQhU',
  },
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
        <Analytics />
      </body>
    </html>
  )
}
