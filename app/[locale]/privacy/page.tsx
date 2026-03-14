export const metadata = {
  title: 'Privacy Policy - Nudge',
}

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-6">
      <h1 className="text-3xl font-bold text-text-primary mb-4">Privacy Policy</h1>
      <p className="text-text-tertiary mb-8">Last updated: March 13, 2026</p>

      <div className="space-y-6 text-text-secondary">
        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">1. Introduction</h2>
          <p>
            Welcome to Nudge ("we," "our," or "the App"). We respect your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, share, and safeguard your information when you use our Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">2. Data We Collect</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Account data:</strong> email address, name, profile picture (via Google OAuth).</li>
            <li><strong>Calendar data:</strong> event titles, dates, times, locations — only when you connect Google Calendar.</li>
            <li><strong>App data:</strong> reminders, journal entries, focus sessions, wellbeing assessments.</li>
            <li><strong>Usage data:</strong> chat prompts sent to the AI assistant, feature usage.</li>
            <li><strong>Payment data:</strong> handled entirely by Stripe — we never see or store card numbers.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">3. How We Use Your Data</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>To provide and improve the Service.</li>
            <li>To process payments via Stripe.</li>
            <li>To send transactional emails (account, billing).</li>
            <li>To power AI features — prompts are sent to Google Gemini or Groq for processing.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">4. Google API Services — Limited Use</h2>
          <p className="mb-3">
            Nudge's use and transfer to any other app of information received from Google APIs adheres to the{' '}
            <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-accent-primary hover:underline">Google API Services User Data Policy</a>, including the Limited Use requirements.
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>We do not sell your Google data to third parties.</li>
            <li>We do not use your Google data to serve advertisements.</li>
            <li>We only read and write to your calendar to provide the synchronization functionality you have explicitly enabled.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">5. Data Sharing</h2>
          <p className="mb-3">We do not sell your data. We share data only with the following infrastructure providers:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Supabase</strong> — database infrastructure (United States)</li>
            <li><strong>Stripe</strong> — payment processing (United States)</li>
            <li><strong>Google</strong> — AI via Gemini API; calendar via OAuth</li>
            <li><strong>Groq</strong> — AI fallback processing (United States)</li>
            <li><strong>Vercel</strong> — hosting and edge infrastructure (United States)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">6. Your Rights (GDPR / CCPA)</h2>
          <p className="mb-3">You have the right to access, correct, export, or delete your data at any time. To exercise these rights:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Disconnect your Google Calendar from the app Settings — this immediately revokes and deletes our stored access tokens.</li>
            <li>Revoke Nudge's access directly from your <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-accent-primary hover:underline">Google Account permissions</a>.</li>
            <li>Request full account deletion by emailing <a href="mailto:support@nudgereminds.com" className="text-accent-primary hover:underline">support@nudgereminds.com</a> — we will respond within 30 days.</li>
          </ul>
          <p className="mt-3">EU users may lodge complaints with their local Data Protection Authority.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">7. Data Retention</h2>
          <p>
            Data is retained while your account is active. After account deletion, data is removed within 30 days. Stripe retains payment records per their own retention policy.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">8. Security</h2>
          <p>
            We use industry-standard encryption in transit (TLS) and at rest. Google Calendar access tokens are encrypted and never exposed to other users. Access to production data is strictly limited to authorized personnel.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">9. Cookies</h2>
          <p>
            We use session cookies for authentication only. We do not use advertising or tracking cookies.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">10. Children</h2>
          <p>
            The Service is not directed to children under 13 (16 in the EU). We do not knowingly collect data from minors. If you believe a minor has provided us data, contact us and we will delete it promptly.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">11. International Transfers</h2>
          <p>
            Your data is processed in the United States. By using the Service you consent to this transfer. For EU users, transfers are covered under Standard Contractual Clauses with our infrastructure providers.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">12. Changes</h2>
          <p>
            We will notify you of material changes via email or in-app notice before they take effect.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">13. Contact</h2>
          <p>
            Questions about this Privacy Policy:{' '}
            <a href="mailto:support@nudgereminds.com" className="text-accent-primary hover:underline">support@nudgereminds.com</a>
          </p>
        </section>
      </div>
    </div>
  )
}
