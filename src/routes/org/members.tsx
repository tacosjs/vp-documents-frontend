import { createFileRoute } from '@tanstack/react-router'

import { Layout } from '@/components/Layouts'
import { ProtectedRoutes } from '@/components/ProtectedRoutes'
import { RoutesPath } from '@/types/routes'
import { TeamInvitesView } from '@/views/OrganizationViews/OrgInvitesView'

export const Route = createFileRoute(RoutesPath.ORG_MEMBERS)({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <ProtectedRoutes>
      <Layout>
        <TeamInvitesView />
      </Layout>
    </ProtectedRoutes>
  )
}
