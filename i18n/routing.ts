import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['en', 'es', 'fr', 'pt'],
  defaultLocale: 'en',
  localePrefix: 'as-needed', // English has no prefix: /app; others: /es/app
})
