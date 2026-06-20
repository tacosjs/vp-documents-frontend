import { createFileRoute } from '@tanstack/react-router'

import { AuthGuestCardRoute } from '@/components/Layouts/AuthGuestCardRoute'
import { SignUpView } from '@/views/AuthViews/SignUpView'

type SignUpSearch = {
  invite?: string
}

export const Route = createFileRoute('/auth/signup')({
  component: RouteComponent,
  validateSearch: (raw: Record<string, unknown>): SignUpSearch => ({
    invite:
      typeof raw.invite === 'string' && raw.invite.trim().length > 0
        ? raw.invite.trim()
        : undefined,
  }),
})

function RouteComponent() {
  return (
    <AuthGuestCardRoute>
      <SignUpView />
    </AuthGuestCardRoute>
  )
}
