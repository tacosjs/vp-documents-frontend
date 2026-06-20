import { createFileRoute } from '@tanstack/react-router'

import { AuthCardShell } from '@/components/Layouts/AuthCardShell'
import { AuthFlowLayout } from '@/components/Layouts/AuthFlowLayout'
import { RoutesPath } from '@/types/routes'
import { InviteLandingView } from '@/views/InviteLandingView'

export const Route = createFileRoute(RoutesPath.INVITE_TOKEN)({
  component: RouteComponent,
})

function RouteComponent() {
  const { token } = Route.useParams()
  return (
    <AuthFlowLayout>
      <AuthCardShell>
        <InviteLandingView token={token} />
      </AuthCardShell>
    </AuthFlowLayout>
  )
}
