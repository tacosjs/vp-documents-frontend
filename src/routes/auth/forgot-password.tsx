import { createFileRoute } from '@tanstack/react-router'

import { AuthGuestCardRoute } from '@/components/Layouts/AuthGuestCardRoute'
import { RoutesPath } from '@/types/routes'
import { ForgotPasswordView } from '@/views/AuthViews/ForgotPasswordView'

export const Route = createFileRoute(RoutesPath.FORGOT_PASSWORD)({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <AuthGuestCardRoute>
      <ForgotPasswordView />
    </AuthGuestCardRoute>
  )
}
