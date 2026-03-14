export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  return {
    title: locale === 'es' ? 'Política de Privacidad - Nudge' : 'Privacy Policy - Nudge',
  }
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const es = locale === 'es'

  return (
    <div className="max-w-3xl mx-auto py-12 px-6">
      <h1 className="text-3xl font-bold text-text-primary mb-4">
        {es ? 'Política de Privacidad' : 'Privacy Policy'}
      </h1>
      <p className="text-text-tertiary mb-8">
        {es ? 'Última actualización: 13 de marzo de 2026' : 'Last updated: March 13, 2026'}
      </p>

      <div className="space-y-6 text-text-secondary">
        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">
            {es ? '1. Introducción' : '1. Introduction'}
          </h2>
          <p>
            {es
              ? 'Bienvenido a Nudge ("nosotros", "nuestro" o "la App"). Respetamos tu privacidad y nos comprometemos a proteger tus datos personales. Esta Política de Privacidad explica cómo recopilamos, usamos, compartimos y protegemos tu información cuando utilizas nuestro Servicio.'
              : 'Welcome to Nudge ("we," "our," or "the App"). We respect your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, share, and safeguard your information when you use our Service.'}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">
            {es ? '2. Datos que Recopilamos' : '2. Data We Collect'}
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            {es ? (
              <>
                <li><strong>Datos de cuenta:</strong> dirección de correo electrónico, nombre, foto de perfil (vía Google OAuth).</li>
                <li><strong>Datos de calendario:</strong> títulos de eventos, fechas, horas, ubicaciones — solo cuando conectas Google Calendar.</li>
                <li><strong>Datos de la app:</strong> recordatorios, entradas de diario, sesiones de enfoque, evaluaciones de bienestar.</li>
                <li><strong>Datos de uso:</strong> mensajes enviados al asistente de IA, uso de funciones.</li>
                <li><strong>Datos de pago:</strong> gestionados íntegramente por Stripe — nunca vemos ni almacenamos números de tarjeta.</li>
              </>
            ) : (
              <>
                <li><strong>Account data:</strong> email address, name, profile picture (via Google OAuth).</li>
                <li><strong>Calendar data:</strong> event titles, dates, times, locations — only when you connect Google Calendar.</li>
                <li><strong>App data:</strong> reminders, journal entries, focus sessions, wellbeing assessments.</li>
                <li><strong>Usage data:</strong> chat prompts sent to the AI assistant, feature usage.</li>
                <li><strong>Payment data:</strong> handled entirely by Stripe — we never see or store card numbers.</li>
              </>
            )}
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">
            {es ? '3. Cómo Usamos tus Datos' : '3. How We Use Your Data'}
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            {es ? (
              <>
                <li>Para prestar y mejorar el Servicio.</li>
                <li>Para procesar pagos a través de Stripe.</li>
                <li>Para enviar correos transaccionales (cuenta, facturación).</li>
                <li>Para potenciar las funciones de IA — los mensajes se envían a Google Gemini o Groq para su procesamiento.</li>
              </>
            ) : (
              <>
                <li>To provide and improve the Service.</li>
                <li>To process payments via Stripe.</li>
                <li>To send transactional emails (account, billing).</li>
                <li>To power AI features — prompts are sent to Google Gemini or Groq for processing.</li>
              </>
            )}
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">
            {es ? '4. Servicios de API de Google — Uso Limitado' : '4. Google API Services — Limited Use'}
          </h2>
          <p className="mb-3">
            {es ? (
              <>El uso y transferencia a otras aplicaciones de la información recibida de las APIs de Google por parte de Nudge cumple con la{' '}<a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-accent-primary hover:underline">Política de Datos de Usuario de los Servicios API de Google</a>, incluidos los requisitos de Uso Limitado.</>
            ) : (
              <>Nudge&apos;s use and transfer to any other app of information received from Google APIs adheres to the{' '}<a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-accent-primary hover:underline">Google API Services User Data Policy</a>, including the Limited Use requirements.</>
            )}
          </p>
          <ul className="list-disc pl-6 space-y-2">
            {es ? (
              <>
                <li>No vendemos tus datos de Google a terceros.</li>
                <li>No usamos tus datos de Google para mostrar publicidad.</li>
                <li>Solo leemos y escribimos en tu calendario para proporcionar la funcionalidad de sincronización que has habilitado explícitamente.</li>
              </>
            ) : (
              <>
                <li>We do not sell your Google data to third parties.</li>
                <li>We do not use your Google data to serve advertisements.</li>
                <li>We only read and write to your calendar to provide the synchronization functionality you have explicitly enabled.</li>
              </>
            )}
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">
            {es ? '5. Compartición de Datos' : '5. Data Sharing'}
          </h2>
          <p className="mb-3">
            {es
              ? 'No vendemos tus datos. Solo los compartimos con los siguientes proveedores de infraestructura:'
              : 'We do not sell your data. We share data only with the following infrastructure providers:'}
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Supabase</strong> — {es ? 'infraestructura de base de datos (Estados Unidos)' : 'database infrastructure (United States)'}</li>
            <li><strong>Stripe</strong> — {es ? 'procesamiento de pagos (Estados Unidos)' : 'payment processing (United States)'}</li>
            <li><strong>Google</strong> — {es ? 'IA vía API de Gemini; calendario vía OAuth' : 'AI via Gemini API; calendar via OAuth'}</li>
            <li><strong>Groq</strong> — {es ? 'procesamiento de IA alternativo (Estados Unidos)' : 'AI fallback processing (United States)'}</li>
            <li><strong>Vercel</strong> — {es ? 'alojamiento e infraestructura edge (Estados Unidos)' : 'hosting and edge infrastructure (United States)'}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">
            {es ? '6. Tus Derechos (RGPD / CCPA)' : '6. Your Rights (GDPR / CCPA)'}
          </h2>
          <p className="mb-3">
            {es
              ? 'Tienes derecho a acceder, corregir, exportar o eliminar tus datos en cualquier momento. Para ejercer estos derechos:'
              : 'You have the right to access, correct, export, or delete your data at any time. To exercise these rights:'}
          </p>
          <ul className="list-disc pl-6 space-y-2">
            {es ? (
              <>
                <li>Desconecta tu Google Calendar desde la Configuración de la app — esto revoca y elimina inmediatamente nuestros tokens de acceso almacenados.</li>
                <li>Revoca el acceso de Nudge directamente desde los <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-accent-primary hover:underline">permisos de tu cuenta de Google</a>.</li>
                <li>Solicita la eliminación completa de tu cuenta enviando un correo a <a href="mailto:support@nudgereminds.com" className="text-accent-primary hover:underline">support@nudgereminds.com</a> — responderemos en un plazo de 30 días.</li>
              </>
            ) : (
              <>
                <li>Disconnect your Google Calendar from the app Settings — this immediately revokes and deletes our stored access tokens.</li>
                <li>Revoke Nudge&apos;s access directly from your <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-accent-primary hover:underline">Google Account permissions</a>.</li>
                <li>Request full account deletion by emailing <a href="mailto:support@nudgereminds.com" className="text-accent-primary hover:underline">support@nudgereminds.com</a> — we will respond within 30 days.</li>
              </>
            )}
          </ul>
          <p className="mt-3">
            {es
              ? 'Los usuarios de la UE pueden presentar reclamaciones ante su Autoridad de Protección de Datos local.'
              : 'EU users may lodge complaints with their local Data Protection Authority.'}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">
            {es ? '7. Retención de Datos' : '7. Data Retention'}
          </h2>
          <p>
            {es
              ? 'Los datos se conservan mientras tu cuenta esté activa. Tras la eliminación de la cuenta, los datos se borran en un plazo de 30 días. Stripe conserva los registros de pago según su propia política de retención.'
              : 'Data is retained while your account is active. After account deletion, data is removed within 30 days. Stripe retains payment records per their own retention policy.'}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">
            {es ? '8. Seguridad' : '8. Security'}
          </h2>
          <p>
            {es
              ? 'Utilizamos cifrado estándar del sector en tránsito (TLS) y en reposo. Los tokens de acceso de Google Calendar están cifrados y nunca se exponen a otros usuarios. El acceso a los datos de producción está estrictamente limitado al personal autorizado.'
              : 'We use industry-standard encryption in transit (TLS) and at rest. Google Calendar access tokens are encrypted and never exposed to other users. Access to production data is strictly limited to authorized personnel.'}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">
            {es ? '9. Cookies' : '9. Cookies'}
          </h2>
          <p>
            {es
              ? 'Utilizamos cookies de sesión únicamente para autenticación. No usamos cookies publicitarias ni de seguimiento.'
              : 'We use session cookies for authentication only. We do not use advertising or tracking cookies.'}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">
            {es ? '10. Menores' : '10. Children'}
          </h2>
          <p>
            {es
              ? 'El Servicio no está dirigido a menores de 13 años (16 en la UE). No recopilamos datos de menores de forma consciente. Si crees que un menor nos ha proporcionado datos, contáctanos y los eliminaremos de inmediato.'
              : 'The Service is not directed to children under 13 (16 in the EU). We do not knowingly collect data from minors. If you believe a minor has provided us data, contact us and we will delete it promptly.'}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">
            {es ? '11. Transferencias Internacionales' : '11. International Transfers'}
          </h2>
          <p>
            {es
              ? 'Tus datos se procesan en los Estados Unidos. Al utilizar el Servicio, aceptas esta transferencia. Para los usuarios de la UE, las transferencias están cubiertas por Cláusulas Contractuales Estándar con nuestros proveedores de infraestructura.'
              : 'Your data is processed in the United States. By using the Service you consent to this transfer. For EU users, transfers are covered under Standard Contractual Clauses with our infrastructure providers.'}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">
            {es ? '12. Cambios' : '12. Changes'}
          </h2>
          <p>
            {es
              ? 'Te notificaremos los cambios sustanciales por correo electrónico o mediante aviso dentro de la app antes de que entren en vigor.'
              : 'We will notify you of material changes via email or in-app notice before they take effect.'}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">
            {es ? '13. Contacto' : '13. Contact'}
          </h2>
          <p>
            {es ? 'Preguntas sobre esta Política de Privacidad:' : 'Questions about this Privacy Policy:'}{' '}
            <a href="mailto:support@nudgereminds.com" className="text-accent-primary hover:underline">support@nudgereminds.com</a>
          </p>
        </section>
      </div>
    </div>
  )
}
