export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  return {
    title: locale === 'es' ? 'Términos de Servicio - Nudge' : 'Terms of Service - Nudge',
  }
}

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const es = locale === 'es'

  return (
    <div className="max-w-3xl mx-auto py-12 px-6">
      <h1 className="text-3xl font-bold text-text-primary mb-4">
        {es ? 'Términos de Servicio' : 'Terms of Service'}
      </h1>
      <p className="text-text-tertiary mb-8">{es ? 'Última actualización: 13 de marzo de 2026' : 'Last updated: March 13, 2026'}</p>

      <div className="space-y-6 text-text-secondary">
        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">
            {es ? '1. Aceptación de los Términos' : '1. Acceptance of Terms'}
          </h2>
          <p>
            {es
              ? 'Al acceder o utilizar Nudge ("Servicio"), aceptas estar sujeto a estos Términos. Si no estás de acuerdo, no utilices el Servicio.'
              : 'By accessing or using Nudge ("Service"), you agree to be bound by these Terms. If you disagree, do not use the Service.'}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">
            {es ? '2. Descripción del Servicio' : '2. Description of Service'}
          </h2>
          <p>
            {es
              ? 'Nudge es una aplicación de productividad que ofrece recordatorios, sincronización de calendario, herramientas de enfoque, diario personal, seguimiento de bienestar y gestión de tareas asistida por IA. Las funciones están disponibles en los planes Gratuito y Pro.'
              : 'Nudge is a productivity application offering reminders, calendar synchronization, focus tools, journaling, wellbeing tracking, and AI-assisted task management. Features are available on Free and Pro subscription tiers.'}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">
            {es ? '3. Elegibilidad' : '3. Eligibility'}
          </h2>
          <p>
            {es
              ? 'Debes tener al menos 13 años (16 en la UE/Reino Unido) para utilizar el Servicio. Al usar Nudge, declaras que cumples este requisito.'
              : 'You must be at least 13 years old (16 in the EU/UK) to use the Service. By using Nudge you represent that you meet this requirement.'}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">
            {es ? '4. Cuentas' : '4. Accounts'}
          </h2>
          <p>
            {es
              ? <>Eres responsable de mantener la confidencialidad de tus credenciales y de toda la actividad bajo tu cuenta. Notifícanos inmediatamente cualquier uso no autorizado en{' '}<a href="mailto:support@nudgereminds.com" className="text-accent-primary hover:underline">support@nudgereminds.com</a>.</>
              : <>You are responsible for maintaining the confidentiality of your credentials and for all activity under your account. Notify us immediately of any unauthorized use at{' '}<a href="mailto:support@nudgereminds.com" className="text-accent-primary hover:underline">support@nudgereminds.com</a>.</>}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">
            {es ? '5. Suscripciones y Pagos' : '5. Subscriptions and Payments'}
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            {es ? (
              <>
                <li>Las suscripciones Pro se facturan mensualmente ($5.99) o anualmente ($47.99) a través de Stripe.</li>
                <li>Las suscripciones se renuevan automáticamente salvo que se cancelen antes de la fecha de renovación.</li>
                <li>Las cancelaciones surten efecto al final del período de facturación vigente — no se realizan reembolsos parciales.</li>
                <li>Nos reservamos el derecho de modificar los precios con 30 días de aviso.</li>
              </>
            ) : (
              <>
                <li>Pro subscriptions are billed monthly ($5.99) or annually ($47.99) via Stripe.</li>
                <li>Subscriptions renew automatically unless cancelled before the renewal date.</li>
                <li>Cancellations take effect at the end of the current billing period — no partial refunds.</li>
                <li>We reserve the right to change pricing with 30 days&apos; notice.</li>
              </>
            )}
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">
            {es ? '6. Uso Aceptable' : '6. Acceptable Use'}
          </h2>
          <p>{es ? 'Aceptas no:' : 'You agree not to:'}</p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            {es ? (
              <>
                <li>Violar ninguna ley o regulación aplicable.</li>
                <li>Subir contenido dañino, ofensivo o que infrinja derechos de terceros.</li>
                <li>Intentar realizar ingeniería inversa o eludir el Servicio.</li>
                <li>Usar el Servicio para enviar spam o acosar a otras personas.</li>
                <li>Acceder a los datos de otros usuarios sin autorización.</li>
              </>
            ) : (
              <>
                <li>Violate any applicable laws or regulations.</li>
                <li>Upload harmful, offensive, or infringing content.</li>
                <li>Attempt to reverse-engineer or circumvent the Service.</li>
                <li>Use the Service to spam or harass others.</li>
                <li>Access other users&apos; data without authorization.</li>
              </>
            )}
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">
            {es ? '7. Integración con Google Calendar' : '7. Google Calendar Integration'}
          </h2>
          <p>
            {es ? (
              <>Al conectar una cuenta de Google, otorgas a Nudge acceso limitado a tus datos de calendario exclusivamente para prestar el Servicio. No vendemos estos datos. El acceso puede revocarse en cualquier momento desde la configuración de tu cuenta de Google o dentro de la app. El uso de información recibida de las APIs de Google por parte de Nudge cumple con la{' '}<a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-accent-primary hover:underline">Política de Datos de Usuario de los Servicios API de Google</a>, incluidos los requisitos de Uso Limitado.</>
            ) : (
              <>When you connect a Google account, you grant Nudge limited access to your calendar data solely to provide the Service. We do not sell this data. Access can be revoked at any time from your Google account settings or within the app. Nudge&apos;s use of information received from Google APIs adheres to the{' '}<a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-accent-primary hover:underline">Google API Services User Data Policy</a>, including the Limited Use requirements.</>
            )}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">
            {es ? '8. Funciones de IA' : '8. AI Features'}
          </h2>
          <p>
            {es
              ? 'El asistente de IA se proporciona únicamente como apoyo a la productividad. Las respuestas pueden ser inexactas. No las utilices para decisiones médicas, legales o financieras. Las conversaciones pueden registrarse para mejorar el Servicio.'
              : 'The AI assistant is provided for productivity assistance only. Responses may be inaccurate. Do not rely on them for medical, legal, or financial decisions. Conversations may be logged to improve the Service.'}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">
            {es ? '9. Propiedad Intelectual' : '9. Intellectual Property'}
          </h2>
          <p>
            {es
              ? 'Nudge y su contenido, funciones y funcionalidades originales son propiedad de Nudge y están protegidos por las leyes internacionales de derechos de autor, marcas comerciales y otras leyes aplicables. Tú conservas la propiedad del contenido que creas dentro del Servicio.'
              : 'Nudge and its original content, features, and functionality are owned by Nudge and protected by international copyright, trademark, and other laws. You retain ownership of content you create within the Service.'}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">
            {es ? '10. Privacidad' : '10. Privacy'}
          </h2>
          <p>
            {es ? (
              <>Tu uso del Servicio se rige por nuestra{' '}<a href="/privacy" className="text-accent-primary hover:underline">Política de Privacidad</a>, incorporada aquí por referencia.</>
            ) : (
              <>Your use of the Service is governed by our{' '}<a href="/privacy" className="text-accent-primary hover:underline">Privacy Policy</a>, incorporated herein by reference.</>
            )}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">
            {es ? '11. Terminación' : '11. Termination'}
          </h2>
          <p>
            {es
              ? 'Podemos suspender o cancelar tu cuenta por incumplimiento de estos Términos. Puedes eliminar tu cuenta en cualquier momento. Tras la cancelación, tus datos serán eliminados en un plazo de 30 días.'
              : 'We may suspend or terminate your account for violations of these Terms. You may delete your account at any time. Upon termination, your data will be deleted within 30 days.'}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">
            {es ? '12. Exención de Garantías' : '12. Disclaimers'}
          </h2>
          <p>
            {es
              ? 'EL SERVICIO SE PROPORCIONA "TAL CUAL" SIN GARANTÍAS DE NINGÚN TIPO. EN LA MÁXIMA MEDIDA PERMITIDA POR LA LEY, NUDGE RENUNCIA A TODAS LAS GARANTÍAS, EXPRESAS O IMPLÍCITAS.'
              : 'THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. TO THE FULLEST EXTENT PERMITTED BY LAW, NUDGE DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED.'}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">
            {es ? '13. Limitación de Responsabilidad' : '13. Limitation of Liability'}
          </h2>
          <p>
            {es
              ? 'EN LA MÁXIMA MEDIDA PERMITIDA POR LA LEY, NUDGE NO SERÁ RESPONSABLE POR DAÑOS INDIRECTOS, INCIDENTALES, ESPECIALES O CONSECUENTES. NUESTRA RESPONSABILIDAD TOTAL NO EXCEDERÁ EL IMPORTE PAGADO POR EL USUARIO EN LOS 12 MESES ANTERIORES A LA RECLAMACIÓN.'
              : 'TO THE MAXIMUM EXTENT PERMITTED BY LAW, NUDGE SHALL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES. OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID IN THE 12 MONTHS PRECEDING THE CLAIM.'}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">
            {es ? '14. Ley Aplicable' : '14. Governing Law'}
          </h2>
          <p>
            {es
              ? 'Estos Términos se rigen por las leyes de México, sin atención a sus principios de conflicto de leyes. Las disputas se resolverán en los tribunales de la Ciudad de México.'
              : 'These Terms are governed by the laws of Mexico, without regard to conflict-of-law principles. Disputes shall be resolved in the courts of Mexico City.'}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">
            {es ? '15. Cambios' : '15. Changes'}
          </h2>
          <p>
            {es
              ? 'Podemos actualizar estos Términos en cualquier momento. El uso continuado tras los cambios implica su aceptación. Los cambios sustanciales serán notificados por correo electrónico.'
              : 'We may update these Terms at any time. Continued use after changes constitutes acceptance. Material changes will be notified by email.'}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">
            {es ? '16. Contacto' : '16. Contact'}
          </h2>
          <p>
            <a href="mailto:support@nudgereminds.com" className="text-accent-primary hover:underline">support@nudgereminds.com</a>
          </p>
        </section>
      </div>
    </div>
  )
}
