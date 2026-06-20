import { Navigate, createFileRoute } from '@tanstack/react-router'

import { AuthFlowLayout } from '@/components/Layouts/AuthFlowLayout'
import { Spinner } from '@/components/ui/spinner'
import { useEncryptionSession } from '@/contexts/EncryptionSessionContext'
import { useDevicePassphraseRestore } from '@/hooks/useDevicePassphraseRestore'
import { useMeQuery } from '@/services/auth'
import { RoutesPath } from '@/types/routes'
import { UnlockView } from '@/views/AuthViews/UnlockView'

export const Route = createFileRoute('/auth/unlock')({
  component: RouteComponent,
})

function RouteComponent() {
  const { data: me, isPending } = useMeQuery()
  const { passphrase: localPassphrase } = useEncryptionSession()
  const { waitingForDeviceRestore } = useDevicePassphraseRestore()

  if (isPending) {
    return null
  }

  if (!me) {
    return <Navigate to={RoutesPath.SIGN_IN.toString()} />
  }

  if (waitingForDeviceRestore) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center bg-neutral-50">
        <Spinner />
      </div>
    )
  }

  if (localPassphrase) {
    return <Navigate to={RoutesPath.HOME.toString()} />
  }

  return (
    <AuthFlowLayout>
      <UnlockView />
    </AuthFlowLayout>
  )
}
