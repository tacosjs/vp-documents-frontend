import { createFileRoute } from '@tanstack/react-router'

import { Layout } from '@/components/Layouts'
import { ProtectedRoutes } from '@/components/ProtectedRoutes'
import { OrgSecurityView } from '@/views/OrganizationViews/OrgSecurityView'

export const Route = createFileRoute('/org/security')({
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
