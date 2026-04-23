export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  return {
    title: locale === 'es' ? 'Soporte - Nudge' : 'Support - Nudge',
  }
}

export default async function SupportPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const es = locale === 'es'

  return (
    <div className="max-w-3xl mx-auto py-12 px-6">
      <h1 className="text-3xl font-bold text-text-primary mb-2">
        {es ? 'Soporte' : 'Support'}
      </h1>
      <p className="text-text-tertiary mb-10">
        {es ? 'Estamos aquí para ayudarte.' : 'We\'re here to help.'}
      </p>

      <div className="space-y-10">

        {/* Contact */}
        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">
            {es ? 'Contacto' : 'Contact Us'}
          </h2>
          <p className="text-text-secondary mb-4">
            {es
              ? 'Para preguntas, reportar un problema o cualquier solicitud, escríbenos directamente. Respondemos en menos de 48 horas.'
              : 'For questions, bug reports, or any other requests, reach out to us directly. We respond within 48 hours.'}
          </p>
          <a
            href="mailto:support@nudgereminds.com"
            className="inline-flex items-center gap-2 px-5 py-3 bg-accent-primary text-white rounded-apple-lg font-medium hover:bg-accent-primary/90 transition-colors"
          >
            support@nudgereminds.com
          </a>
        </section>

        {/* FAQ */}
        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-4">
            {es ? 'Preguntas frecuentes' : 'Frequently Asked Questions'}
          </h2>

          <div className="space-y-6">
            <div>
              <h3 className="font-medium text-text-primary mb-1">
                {es ? '¿Cómo sincronizo Google Calendar?' : 'How do I sync Google Calendar?'}
              </h3>
              <p className="text-text-secondary text-sm">
                {es
                  ? 'Ve a Configuración → Google Calendar → Conectar cuenta. Inicia sesión con tu cuenta de Google y acepta los permisos de calendario. Los eventos se sincronizarán automáticamente.'
                  : 'Go to Settings → Google Calendar → Connect account. Sign in with your Google account and accept the calendar permissions. Events will sync automatically.'}
              </p>
            </div>

            <div>
              <h3 className="font-medium text-text-primary mb-1">
                {es ? '¿Cómo elimino mi cuenta?' : 'How do I delete my account?'}
              </h3>
              <p className="text-text-secondary text-sm">
                {es
                  ? 'En la app de iOS: ve a Configuración → Perfil → Eliminar cuenta. En la web: ve a Configuración → Eliminar cuenta. Tu cuenta y todos tus datos se eliminarán permanentemente.'
                  : 'On iOS: go to Settings → Profile → Delete Account. On the web: go to Settings → Delete Account. Your account and all associated data will be permanently deleted.'}
              </p>
            </div>

            <div>
              <h3 className="font-medium text-text-primary mb-1">
                {es ? '¿Mis datos están seguros?' : 'Is my data secure?'}
              </h3>
              <p className="text-text-secondary text-sm">
                {es
                  ? 'Sí. Toda la comunicación usa TLS. Los datos se almacenan en Supabase (infraestructura segura) y nunca se venden a terceros. Consulta nuestra '
                  : 'Yes. All communication uses TLS. Data is stored in Supabase (secure infrastructure) and is never sold to third parties. See our '}
                <a href={`/${locale}/privacy`} className="text-accent-primary hover:underline">
                  {es ? 'Política de Privacidad' : 'Privacy Policy'}
                </a>
                {es ? ' para más detalles.' : ' for details.'}
              </p>
            </div>

            <div>
              <h3 className="font-medium text-text-primary mb-1">
                {es ? '¿Cómo activo las notificaciones?' : 'How do I enable notifications?'}
              </h3>
              <p className="text-text-secondary text-sm">
                {es
                  ? 'En iOS: ve a Configuración del sistema → Nudge → Notificaciones y actívalas. En la app, ve a Configuración → Notificaciones para personalizar qué notificaciones recibir.'
                  : 'On iOS: go to System Settings → Nudge → Notifications and enable them. Inside the app, go to Settings → Notifications to customize which notifications you receive.'}
              </p>
            </div>

            <div>
              <h3 className="font-medium text-text-primary mb-1">
                {es ? 'Tengo un problema no listado aquí' : 'I have an issue not listed here'}
              </h3>
              <p className="text-text-secondary text-sm">
                {es
                  ? 'Escríbenos a '
                  : 'Email us at '}
                <a href="mailto:support@nudgereminds.com" className="text-accent-primary hover:underline">
                  support@nudgereminds.com
                </a>
                {es
                  ? ' con una descripción del problema y, si es posible, capturas de pantalla. Lo resolveremos lo antes posible.'
                  : ' with a description of the issue and screenshots if possible. We\'ll get back to you as soon as possible.'}
              </p>
            </div>
          </div>
        </section>

        {/* Account deletion link — required by App Store */}
        <section className="p-5 bg-surface-secondary rounded-apple-xl border border-border-primary">
          <h2 className="font-semibold text-text-primary mb-2">
            {es ? 'Eliminación de cuenta' : 'Account Deletion'}
          </h2>
          <p className="text-text-secondary text-sm mb-4">
            {es
              ? 'Puedes eliminar tu cuenta directamente desde la app (Configuración → Perfil → Eliminar cuenta) o contactándonos. La eliminación es permanente e irreversible.'
              : 'You can delete your account directly from the app (Settings → Profile → Delete Account) or by contacting us. Deletion is permanent and irreversible.'}
          </p>
          <a
            href="mailto:support@nudgereminds.com?subject=Delete%20my%20account"
            className="text-sm text-accent-primary hover:underline"
          >
            {es ? 'Solicitar eliminación por correo →' : 'Request deletion by email →'}
          </a>
        </section>

      </div>
    </div>
  )
}
