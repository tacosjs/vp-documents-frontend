import { createFileRoute } from '@tanstack/react-router'

import { AuthGuestCardRoute } from '@/components/Layouts/AuthGuestCardRoute'
import { SignInView } from '@/views/AuthViews/SignInView'

type SignInSearch = {
  redirect?: string
}

export const Route = createFileRoute('/auth/signin')({
  component: RouteComponent,
  validateSearch: (raw: Record<string, unknown>): SignInSearch => {
    const redirect =
      typeof raw.redirect === 'string' && raw.redirect.trim().length > 0
        ? raw.redirect.trim()
        : undefined
    return { redirect }
  },
})

function RouteComponent() {
  return (
    <AuthGuestCardRoute>
      <SignInView />
    </AuthGuestCardRoute>
  )
}
