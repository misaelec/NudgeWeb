export const metadata = {
  title: 'Terms of Service - Nudge',
}

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-6">
      <h1 className="text-3xl font-bold text-text-primary mb-4">Terms of Service</h1>
      <p className="text-text-tertiary mb-8">Last Updated: February 19, 2026</p>

      <div className="space-y-6 text-text-secondary">
        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">1. Acceptance of Terms</h2>
          <p>
            By accessing and using Nudge, you agree to be bound by these Terms of Service. If you do not agree to any part of these terms, you may not access the service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">2. Description of Service</h2>
          <p>
            Nudge is a productivity tool that allows users to manage reminders, journals, and synchronize events across multiple third-party calendars (such as Google Calendar).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">3. User Accounts and Security</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>You are responsible for maintaining the confidentiality of your account and for all activities that occur under it.</li>
            <li>You must provide accurate and complete information when creating an account.</li>
            <li>We reserve the right to suspend or terminate your account if we detect fraudulent use, abuse, or violations of the policies of the third-party APIs you connect.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">4. Third-Party Integrations</h2>
          <p className="mb-3">
            Nudge allows integration with external services like Google Calendar.
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>By connecting these services, you grant us permission to access and modify your data on those platforms strictly for the operation of Nudge.</li>
            <li>We are not responsible for downtime, data loss, or failures that originate directly from these third-party services (e.g., if Google Calendar experiences an outage).</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">5. Acceptable Use</h2>
          <p>
            You agree not to use Nudge for any illegal or unauthorized purpose. You must not attempt to hack, alter, or overload our servers or the calendar synchronization systems.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">6. Limitation of Liability</h2>
          <p className="mb-3">
            To the maximum extent permitted by law, Nudge and its creators shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, resulting from:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Your use or inability to use the application.</li>
            <li>Any unauthorized access to or alteration of your transmissions or synchronized data.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">7. Modifications to the Terms</h2>
          <p>
            We reserve the right to modify or replace these Terms at any time. We will provide notice of any significant changes by updating the date at the top of these Terms. Your continued use of the App after any changes constitutes acceptance of the new Terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">8. Contact Information</h2>
          <p>
            For any questions regarding these Terms, please contact us at: <a href="mailto:mespinosa.ai@gmail.com" className="text-accent-primary hover:underline">mespinosa.ai@gmail.com</a>.
          </p>
        </section>
      </div>
    </div>
  )
}
