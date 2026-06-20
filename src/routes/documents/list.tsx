import { createFileRoute } from '@tanstack/react-router'

import { Layout } from '@/components/Layouts'
import { ProtectedRoutes } from '@/components/ProtectedRoutes'
import { RoutesPath } from '@/types/routes'
import { DocumentsListView } from '@/views/DocumentsView'

export const Route = createFileRoute(RoutesPath.DOCUMENTS_LIST)({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <ProtectedRoutes>
      <Layout>
        <DocumentsListView />
      </Layout>
    </ProtectedRoutes>
  )
}
