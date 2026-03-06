import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

export default createMiddleware(routing)

export const config = {
  matcher: [
    // Match all pathnames except Next.js internals, Vercel internals,
    // auth callbacks (handled outside locale routing), and static files
    '/((?!api|auth/callback|_next|_vercel|.*\\..*).*)',
  ],
}
