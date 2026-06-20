import { Navigate, createFileRoute } from '@tanstack/react-router'

import { RoutesPath } from '@/types/routes'

export const Route = createFileRoute('/auth/')({
  component: AuthIndexRedirect,
})

function AuthIndexRedirect() {
  return <Navigate to={RoutesPath.SIGN_IN.toString()} replace />
}
