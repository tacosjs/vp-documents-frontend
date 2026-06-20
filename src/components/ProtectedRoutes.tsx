import { Navigate, useRouterState } from '@tanstack/react-router'

import { Spinner } from '@/components/ui/spinner'
import { useEncryptionSession } from '@/contexts/EncryptionSessionContext'
import { env } from '@/env'
import { useDevicePassphraseRestore } from '@/hooks/useDevicePassphraseRestore'
import { useMeQuery } from '@/services/auth'
import { RoutesPath } from '@/types/routes'

export const ProtectedRoutes = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const { data: me, isPending } = useMeQuery()
  const { passphrase } = useEncryptionSession()
  const { waitingForDeviceRestore } = useDevicePassphraseRestore()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isOnboardingCompany = pathname === RoutesPath.ONBOARDING_COMPANY

  const needsTenantGate =
    !env.VITE_MOCK_AUTH && !!me && !!passphrase && !waitingForDeviceRestore

  const hasWorkspace = !!me?.tenantId

  if (isPending) {
    return (
      <div className="flex items-center justify-center h-svh">
        <Spinner />
      </div>
    )
  }

  if (!me) {
    return <Navigate to={RoutesPath.SIGN_IN.toString()} />
  }

  if (waitingForDeviceRestore) {
    return (
      <div className="flex items-center justify-center h-svh">
        <Spinner />
      </div>
    )
  }

  if (!passphrase) {
    return <Navigate to={RoutesPath.UNLOCK.toString()} />
  }

  if (needsTenantGate && !hasWorkspace && !isOnboardingCompany) {
    return <Navigate to={RoutesPath.ONBOARDING_COMPANY.toString()} />
  }

  return <>{children}</>
}
