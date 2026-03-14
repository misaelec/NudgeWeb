import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY)

export const FROM_ADDRESS = 'Nudge <support@nudgereminds.com>'

export async function sendWelcomeProEmail(to: string, name?: string) {
  return resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: 'Welcome to Nudge Pro 🎉',
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111; background: #fff; max-width: 560px; margin: 0 auto; padding: 32px 24px;">
  <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 8px;">You're now on Nudge Pro!</h1>
  <p style="color: #555; margin-bottom: 24px;">Hi${name ? ` ${name}` : ''},</p>
  <p style="color: #555;">Thanks for upgrading. Your Pro subscription is now active and you have access to:</p>
  <ul style="color: #555; line-height: 1.8;">
    <li>AI Assistant — ask about your calendar, reminders, and more</li>
    <li>Google Calendar sync</li>
    <li>Journaling</li>
    <li>Wellbeing tracking</li>
  </ul>
  <p style="color: #555; margin-top: 24px;">You can manage your subscription at any time from <strong>Settings → Billing</strong>.</p>
  <p style="color: #555;">If you have any questions, just reply to this email — we're here to help.</p>
  <p style="color: #555; margin-top: 32px;">— The Nudge team</p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;">
  <p style="color: #999; font-size: 12px;">Nudge · <a href="https://nudgereminds.com/privacy" style="color: #999;">Privacy Policy</a> · <a href="https://nudgereminds.com/terms" style="color: #999;">Terms</a></p>
</body>
</html>
    `,
  })
}

export async function sendPaymentFailedEmail(to: string) {
  return resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: 'Payment failed for Nudge Pro',
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111; background: #fff; max-width: 560px; margin: 0 auto; padding: 32px 24px;">
  <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 8px;">Payment issue with your Nudge subscription</h1>
  <p style="color: #555;">We were unable to process your most recent payment for Nudge Pro.</p>
  <p style="color: #555;">Please update your payment method to keep your Pro access:</p>
  <p style="margin: 24px 0;">
    <a href="https://nudgereminds.com/app/settings" style="background: #6366f1; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Update Payment Method</a>
  </p>
  <p style="color: #555;">If you need help, reply to this email and we'll sort it out.</p>
  <p style="color: #555; margin-top: 32px;">— The Nudge team</p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;">
  <p style="color: #999; font-size: 12px;">Nudge · <a href="https://nudgereminds.com/privacy" style="color: #999;">Privacy Policy</a></p>
</body>
</html>
    `,
  })
}
