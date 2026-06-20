import { createFileRoute } from '@tanstack/react-router'

import { AuthGuestCardRoute } from '@/components/Layouts/AuthGuestCardRoute'
import { ForgotPasswordView } from '@/views/AuthViews/ForgotPasswordView'

export const Route = createFileRoute('/auth/forgot-password')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <AuthGuestCardRoute>
      <ForgotPasswordView />
    </AuthGuestCardRoute>
  )
}
