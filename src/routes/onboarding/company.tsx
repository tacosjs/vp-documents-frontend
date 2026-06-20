import { createFileRoute } from '@tanstack/react-router'

import { ProtectedRoutes } from '@/components/ProtectedRoutes'
import { OnboardingCompanyView } from '@/views/OnboardingCompanyView'

export const Route = createFileRoute('/onboarding/company')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <ProtectedRoutes>
      <OnboardingCompanyView />
    </ProtectedRoutes>
  )
}
