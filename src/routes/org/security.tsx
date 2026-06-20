import { createFileRoute } from '@tanstack/react-router'

import { Layout } from '@/components/Layouts'
import { ProtectedRoutes } from '@/components/ProtectedRoutes'
import { RoutesPath } from '@/types/routes'
import { OrgSecurityView } from '@/views/OrganizationViews/OrgSecurityView'

export const Route = createFileRoute(RoutesPath.ORG_SECURITY)({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <ProtectedRoutes>
      <Layout>
        <OrgSecurityView />
      </Layout>
    </ProtectedRoutes>
  )
}
