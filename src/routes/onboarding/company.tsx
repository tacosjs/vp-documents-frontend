import { createFileRoute } from '@tanstack/react-router'

import { ProtectedRoutes } from '@/components/ProtectedRoutes'
import { RoutesPath } from '@/types/routes'
import { OnboardingCompanyView } from '@/views/OnboardingCompanyView'

export const Route = createFileRoute(RoutesPath.ONBOARDING_COMPANY)({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <ProtectedRoutes>
      <OnboardingCompanyView />
    </ProtectedRoutes>
  )
}
