import { createFileRoute } from '@tanstack/react-router'

import { Layout } from '@/components/Layouts'
import { ProtectedRoutes } from '@/components/ProtectedRoutes'
import { TeamInvitesView } from '@/views/OrganizationViews/OrgInvitesView'

export const Route = createFileRoute('/org/members')({
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
