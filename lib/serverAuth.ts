import { createClient } from '@supabase/supabase-js'

/**
 * Validates the Supabase JWT from the Authorization header and returns the user_id.
 * Returns null if missing or invalid.
 */
export async function getAuthenticatedUserId(request: Request): Promise<string | null> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null

  const token = authHeader.slice(7)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: { user } } = await supabase.auth.getUser(token)
  return user?.id ?? null
}
