import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

export default createMiddleware(routing)

export const config = {
  matcher: [
    // Match all paths except API routes, static files, and Next.js internals
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
}
