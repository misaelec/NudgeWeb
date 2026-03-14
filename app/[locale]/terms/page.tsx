export const metadata = {
  title: 'Terms of Service - Nudge',
}

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-6">
      <h1 className="text-3xl font-bold text-text-primary mb-4">Terms of Service</h1>
      <p className="text-text-tertiary mb-8">Last updated: March 13, 2026</p>

      <div className="space-y-6 text-text-secondary">
        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">1. Acceptance of Terms</h2>
          <p>
            By accessing or using Nudge ("Service"), you agree to be bound by these Terms. If you disagree, do not use the Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">2. Description of Service</h2>
          <p>
            Nudge is a productivity application offering reminders, calendar synchronization, focus tools, journaling, wellbeing tracking, and AI-assisted task management. Features are available on Free and Pro subscription tiers.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">3. Eligibility</h2>
          <p>
            You must be at least 13 years old (16 in the EU/UK) to use the Service. By using Nudge you represent that you meet this requirement.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">4. Accounts</h2>
          <p>
            You are responsible for maintaining the confidentiality of your credentials and for all activity under your account. Notify us immediately of any unauthorized use at{' '}
            <a href="mailto:support@nudgereminds.com" className="text-accent-primary hover:underline">support@nudgereminds.com</a>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">5. Subscriptions and Payments</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Pro subscriptions are billed monthly ($5.99) or annually ($47.99) via Stripe.</li>
            <li>Subscriptions renew automatically unless cancelled before the renewal date.</li>
            <li>Cancellations take effect at the end of the current billing period — no partial refunds.</li>
            <li>We reserve the right to change pricing with 30 days' notice.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">6. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>Violate any applicable laws or regulations.</li>
            <li>Upload harmful, offensive, or infringing content.</li>
            <li>Attempt to reverse-engineer or circumvent the Service.</li>
            <li>Use the Service to spam or harass others.</li>
            <li>Access other users' data without authorization.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">7. Google Calendar Integration</h2>
          <p>
            When you connect a Google account, you grant Nudge limited access to your calendar data solely to provide the Service. We do not sell this data. Access can be revoked at any time from your Google account settings or within the app. Nudge's use of information received from Google APIs adheres to the{' '}
            <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-accent-primary hover:underline">Google API Services User Data Policy</a>, including the Limited Use requirements.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">8. AI Features</h2>
          <p>
            The AI assistant is provided for productivity assistance only. Responses may be inaccurate. Do not rely on them for medical, legal, or financial decisions. Conversations may be logged to improve the Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">9. Intellectual Property</h2>
          <p>
            Nudge and its original content, features, and functionality are owned by Nudge and protected by international copyright, trademark, and other laws. You retain ownership of content you create within the Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">10. Privacy</h2>
          <p>
            Your use of the Service is governed by our{' '}
            <a href="/privacy" className="text-accent-primary hover:underline">Privacy Policy</a>, incorporated herein by reference.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">11. Termination</h2>
          <p>
            We may suspend or terminate your account for violations of these Terms. You may delete your account at any time. Upon termination, your data will be deleted within 30 days.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">12. Disclaimers</h2>
          <p>
            THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. TO THE FULLEST EXTENT PERMITTED BY LAW, NUDGE DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">13. Limitation of Liability</h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, NUDGE SHALL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES. OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID IN THE 12 MONTHS PRECEDING THE CLAIM.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">14. Governing Law</h2>
          <p>
            These Terms are governed by the laws of Mexico, without regard to conflict-of-law principles. Disputes shall be resolved in the courts of Mexico City.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">15. Changes</h2>
          <p>
            We may update these Terms at any time. Continued use after changes constitutes acceptance. Material changes will be notified by email.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">16. Contact</h2>
          <p>
            <a href="mailto:support@nudgereminds.com" className="text-accent-primary hover:underline">support@nudgereminds.com</a>
          </p>
        </section>
      </div>
    </div>
  )
}
