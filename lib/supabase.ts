export const supabaseConfig = {
  projectUrl: 'https://tdidckvdawyctcswoppi.supabase.co',
  anonKey: 'sb_publishable_4HHk7Qa7gY-Qnoa8dbCa6Q_ZnebZgQJ',
  redirectUrl: process.env.NEXT_PUBLIC_REDIRECT_URL || 'https://nudge-web-flax.vercel.app/auth/callback',
}

export const supabaseAuthUrl = `${supabaseConfig.projectUrl}/auth/v1`
