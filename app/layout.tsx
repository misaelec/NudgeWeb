import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/components/Providers'
import ThemeInitializer from '@/components/ThemeInitializer'

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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('nudge-settings');
                  if (stored) {
                    var settings = JSON.parse(stored);
                    if (settings.darkMode === 'dark') {
                      document.documentElement.classList.add('dark');
                    } else {
                      document.documentElement.classList.remove('dark');
                    }
                  } else {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body>
        <ThemeInitializer />
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
