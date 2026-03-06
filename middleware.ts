import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

export default createMiddleware(routing)

export const config = {
  matcher: [
    // Match all paths except API routes, auth callbacks, static files, and Next.js internals
    '/((?!api|auth/callback|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
}
