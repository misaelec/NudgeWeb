export const metadata = {
  title: 'Privacy Policy - Nudge',
}

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-6">
      <h1 className="text-3xl font-bold text-text-primary mb-4">Privacy Policy</h1>
      <p className="text-text-tertiary mb-8">Last Updated: February 19, 2026</p>

      <div className="space-y-6 text-text-secondary">
        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">1. Introduction</h2>
          <p>
            Welcome to Nudge ("we," "our," or "the App"). We respect your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, share, and safeguard your information when you use our web and mobile applications.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">2. Information We Collect</h2>
          <p className="mb-3">
            To provide our productivity and calendar synchronization services, we collect the following information:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Account Information:</strong> Your name, email address, and profile picture when you register (e.g., via Google Auth).
            </li>
            <li>
              <strong>Third-Party Data (Google Calendar):</strong> If you choose to connect your Google Calendar account, we will request access via OAuth authentication to read and edit your calendar events.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">3. How We Use Your Information</h2>
          <p>
            We use the collected information exclusively to operate and improve Nudge:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li>To display your calendar events within the Nudge interface.</li>
            <li>To create, update, or synchronize events across your connected calendars based on the sync rules you configure.</li>
            <li>To authenticate your identity and keep your session secure.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">4. Google API Services User Data Policy (Limited Use)</h2>
          <p className="mb-3">
            Nudge's use and transfer to any other app of information received from Google APIs will adhere to the Google API Services User Data Policy, including the Limited Use requirements.
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>We do not sell your Google data to third parties.</li>
            <li>We do not use your Google data to serve advertisements.</li>
            <li>We only read and write to your calendar to provide the synchronization functionality you have explicitly requested and enabled.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">5. Data Storage and Security</h2>
          <p>
            Your data (including Google access tokens) is stored securely on our servers (managed via Supabase) using industry-standard encryption. Your calendar access tokens are only used automatically by the system to execute your sync rules.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">6. Your Rights and Data Control</h2>
          <p className="mb-3">You can at any time:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Revoke Nudge's access to your Google account directly from your Google Account Security settings.</li>
            <li>Disconnect your calendars from the Nudge App settings, which will delete our access tokens.</li>
            <li>Request the complete deletion of your account and associated data by contacting us at mespinosa.ai@gmail.com.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">7. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at: <a href="mailto:mespinosa.ai@gmail.com" className="text-accent-primary hover:underline">mespinosa.ai@gmail.com</a>.
          </p>
        </section>
      </div>
    </div>
  )
}
