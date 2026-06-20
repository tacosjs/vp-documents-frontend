import { createFileRoute } from '@tanstack/react-router'

import { Layout } from '@/components/Layouts'
import { ProtectedRoutes } from '@/components/ProtectedRoutes'
import { RoutesPath } from '@/types/routes'
import { DocumentCreationView } from '@/views/DocumentsView'

export const Route = createFileRoute(RoutesPath.DOCUMENTS_CREATE)({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <ProtectedRoutes>
      <Layout>
        <DocumentCreationView />
      </Layout>
    </ProtectedRoutes>
  )
}
