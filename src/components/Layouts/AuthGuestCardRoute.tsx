import { Navigate } from '@tanstack/react-router'

import { AuthCardShell } from '@/components/Layouts/AuthCardShell'
import { AuthFlowLayout } from '@/components/Layouts/AuthFlowLayout'
import { useEncryptionSession } from '@/contexts/EncryptionSessionContext'
import { useMeQuery } from '@/services/auth'
import { RoutesPath } from '@/types/routes'

export type AuthGuestCardRouteProps = {
  children: React.ReactNode
}

/** Card-based auth screens: redirect unlocked users home; session without passphrase → unlock. */
export const AuthGuestCardRoute = ({ children }: AuthGuestCardRouteProps) => {
  const { data: me, isPending } = useMeQuery()
  const { passphrase: localPassphrase } = useEncryptionSession()

  if (isPending) {
    return null
  }

  if (me && localPassphrase) {
    return <Navigate to={RoutesPath.HOME.toString()} />
  }

  if (me && !localPassphrase) {
    return <Navigate to={RoutesPath.UNLOCK.toString()} />
  }

  return (
    <AuthFlowLayout>
      <AuthCardShell>{children}</AuthCardShell>
    </AuthFlowLayout>
  )
}
